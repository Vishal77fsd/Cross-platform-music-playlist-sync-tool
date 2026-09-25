import { inngest } from "./client";
import { updateJob } from "@/lib/db/jobs";
import { findAccount, upsertAccount } from "@/lib/db/accounts";
import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import type { MusicProvider } from "@/lib/core/MusicProvider";
import type { ProviderAuthToken } from "@/lib/types/domain";
import type { AccountRecord } from "@/lib/db/accounts";

function makeProvider(platform: string): MusicProvider {
  if (platform === "spotify") return new SpotifyProvider();
  if (platform === "ytmusic") return new YtMusicProvider();
  throw new Error(`Unsupported platform: ${platform}`);
}

async function getValidToken(
  account: AccountRecord,
  provider: MusicProvider,
): Promise<ProviderAuthToken> {
  const expiresAt = account.expiresAt
    ? new Date(account.expiresAt).getTime()
    : 0;

  const token: ProviderAuthToken = {
    provider: account.platform as ProviderAuthToken["provider"],
    accessToken: account.accessToken,
    refreshToken: account.refreshToken ?? undefined,
    expiresAt,
  };

  const isExpired = Date.now() >= expiresAt - 30_000;
  if (!isExpired) return token;

  const refreshed = await provider.refreshToken(token);

  await upsertAccount({
    userId: account.userId,
    platform: account.platform,
    providerAccountId: account.providerAccountId,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? account.refreshToken,
    expiresAt: refreshed.expiresAt
      ? new Date(refreshed.expiresAt).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  });

  return refreshed;
}

async function searchWithRetry(
  provider: MusicProvider,
  token: ProviderAuthToken,
  track: { title: string; artist: string; rawSourceText: string },
  retries = 2,
): Promise<string | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const results = await provider.searchTrack(token, {
        title: track.title,
        artist: track.artist,
        rawSourceText: track.rawSourceText,
      });
      return results.length > 0 ? results[0].providerId : null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isRateLimit = message.includes("429") || message.includes("rate");
      if (isRateLimit && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return null;
    }
  }
  return null;
}

export const transferFunction = inngest.createFunction(
  {
    id: "transfer-playlist",
    retries: 0, // don't auto-retry — could duplicate tracks
    triggers: { event: "transfer/playlist.start" },
  },
  async ({ event, step }) => {
    const {
      jobId,
      userId,
      sourcePlatform,
      destinationPlatform,
      sourcePlaylistId,
      playlistName,
    } = event.data;
    // step.run breaks the function into resumable steps
    // If Vercel times out mid-way, Inngest resumes from the last completed step
    await step.run("mark-running", async () => {
      await updateJob(jobId, { status: "running" });
    });

    const { sourceTracks } = await step.run("fetch-tracks", async () => {
      const [sourceAccount, destAccount] = await Promise.all([
        findAccount(userId, sourcePlatform),
        findAccount(userId, destinationPlatform),
      ]);

      if (!sourceAccount) throw new Error(`${sourcePlatform} not connected`);
      if (!destAccount) throw new Error(`${destinationPlatform} not connected`);

      const sourceProvider = makeProvider(sourcePlatform);
      const destProvider = makeProvider(destinationPlatform);

      const [sourceToken, destToken] = await Promise.all([
        getValidToken(sourceAccount, sourceProvider),
        getValidToken(destAccount, destProvider),
      ]);

      const sourceTracks = await sourceProvider.getPlaylistTracks(
        sourceToken,
        sourcePlaylistId,
      );

      await updateJob(jobId, { totalTracks: sourceTracks.length });
      console.log(`[job:${jobId}] got ${sourceTracks.length} tracks`);

      return { sourceTracks, sourceToken, destToken };
    });

    // Search in batches — each batch is its own resumable step
    const CONCURRENCY = 5;
    const matched: string[] = [];
    const unmatched: { title: string; artist: string }[] = [];

    for (let i = 0; i < sourceTracks.length; i += CONCURRENCY) {
      const batch = sourceTracks.slice(i, i + CONCURRENCY);
      const batchIndex = Math.floor(i / CONCURRENCY);

      const batchResult = await step.run(
        `search-batch-${batchIndex}`,
        async () => {
          const [destAccount] = await Promise.all([
            findAccount(userId, destinationPlatform),
          ]);

          if (!destAccount)
            throw new Error(`${destinationPlatform} not connected`);

          const destProvider = makeProvider(destinationPlatform);
          const destToken = await getValidToken(destAccount, destProvider);

          const results = await Promise.all(
            batch.map((track) =>
              searchWithRetry(destProvider, destToken, track),
            ),
          );

          return results;
        },
      );

      for (let j = 0; j < batchResult.length; j++) {
        const providerId = batchResult[j];
        const track = batch[j];
        if (providerId) {
          matched.push(providerId);
        } else {
          unmatched.push({ title: track.title, artist: track.artist });
        }
      }

      await step.run(`update-progress-${batchIndex}`, async () => {
        await updateJob(jobId, {
          matchedCount: matched.length,
          unmatchedCount: unmatched.length,
        });
      });

      // 30 second gap between batches — but skip the wait after the last batch
      const isLastBatch = i + CONCURRENCY >= sourceTracks.length;
      if (!isLastBatch) {
        await step.sleep(`cooldown-${batchIndex}`, "30s");
      }
    }

    await step.run("create-and-fill-playlist", async () => {
      const [destAccount] = await Promise.all([
        findAccount(userId, destinationPlatform),
      ]);

      if (!destAccount) throw new Error(`${destinationPlatform} not connected`);

      const destProvider = makeProvider(destinationPlatform);
      const destToken = await getValidToken(destAccount, destProvider);

      const newPlaylistId = await destProvider.createPlaylist(
        destToken,
        playlistName,
        `Transferred from ${sourcePlatform} via music-migrate`,
      );

      if (matched.length > 0) {
        await destProvider.addTracksToPlaylist(
          destToken,
          newPlaylistId,
          matched,
        );
      }

      await updateJob(jobId, {
        status: "completed",
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        unmatchedTracks: unmatched,
      });

      console.log(
        `[job:${jobId}] done — ${matched.length}/${sourceTracks.length} matched`,
      );
    });
  },
);
