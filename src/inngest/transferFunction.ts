import { inngest } from "./client";
import { updateJob } from "@/lib/db/jobs";
import { findAccount, upsertAccount } from "@/lib/db/accounts";
import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import type { MusicProvider } from "@/lib/core/MusicProvider";
import type { ProviderAuthToken } from "@/lib/types/domain";
import type { AccountRecord } from "@/lib/db/accounts";

// Helper utility to introduce micro-delays between parallel tasks
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  try {
    const results = await provider.searchTrack(token, {
      title: track.title,
      artist: track.artist,
      rawSourceText: track.rawSourceText,
    });
    return results.length > 0 ? results[0].providerId : null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    // 🛑 CRITICAL: Bubble rate limits out of searchWithRetry completely!
    if (message.startsWith("RATE_LIMIT_EXCEEDED:")) {
      throw err;
    }
    return null;
  }
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

    const [destAccount] = await Promise.all([
      findAccount(userId, destinationPlatform),
    ]);

    if (!destAccount) throw new Error(`${destinationPlatform} not connected`);

    const destProvider = makeProvider(destinationPlatform);
    const destToken = await getValidToken(destAccount, destProvider);

    let rateLimitHit = false;
    let rateLimitMessage = "";

    for (let i = 0; i < sourceTracks.length; i += CONCURRENCY) {
      const batch = sourceTracks.slice(i, i + CONCURRENCY);
      const batchIndex = Math.floor(i / CONCURRENCY);

      let batchResult: (string | null)[] = batch.map(() => null);

      try {
        batchResult = await step.run(`search-batch-${batchIndex}`, async () => {
          const results = await Promise.all(
            batch.map(async (track, index) => {
              await delay(index * 250); // stagger requests to avoid rate limits
              return await searchWithRetry(destProvider, destToken, track);
            }),
          );

          return results;
        });
      } catch (err: any) {
        console.log("error in batch search", err);
        const msg = err?.message || "";
        if (msg.startsWith("RATE_LIMIT_EXCEEDED:")) {
          const windowSeconds = parseInt(msg.split(":")[1], 10) || 60;

          // 1. Flip flag state and store contextual data outside the step execution
          rateLimitHit = true;
          rateLimitMessage = `Spotify rate limit hit. Finalising migration early. Please try remaining tracks in ${Math.ceil(windowSeconds / 60)} mins.`;

          // 2. Dump all remaining unsearched tracks from this point forward straight into unmatched
          const remainingTracks = sourceTracks.slice(i);
          for (const track of remainingTracks) {
            unmatched.push({
              title: track.title,
              artist: track.artist,
            });
          }

          await updateJob(jobId, {
            status: "failed",
            matchedCount: matched.length,
            unmatchedCount: unmatched.length,
            error: rateLimitMessage,
          });

          // 3. Break the loop cleanly. No steps are executed inside this catch thread block!
          break;
        } else {
          throw err; // Re-throw unhandled code bugs
        }
      }

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

      // Inngest step sleep to provide a cooling down window
      const isLastBatch = i + CONCURRENCY >= sourceTracks.length;
      if (!isLastBatch) {
        // A 3 to 5-second sleep between batches is usually enough when paired with staggered individual track requests
        await step.sleep(`cooldown-${batchIndex}`, "3s");
      }
    }

    // 1. Check if the loop exited early due to a rate limit
    if (rateLimitHit) {
      // If no songs were successfully matched before hitting the limit, fail completely
      if (matched.length === 0) {
        await step.run("fail-job-no-matches", async () => {
          await updateJob(jobId, {
            status: "failed",
            error:
              rateLimitMessage ||
              "Rate limit hit before any tracks could be matched.",
            unmatchedTracks: unmatched,
          });
        });
        return; // Exit the Inngest function early
      }
    }

    // 2. If it didn't hit a limit, or if it did hit a limit BUT has successfully matched songs, proceed here
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

      // Set status based on whether it was a clean completion or a partial recovery
      const finalStatus = rateLimitHit ? "partial_completed" : "completed";

      await updateJob(jobId, {
        status: finalStatus,
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
