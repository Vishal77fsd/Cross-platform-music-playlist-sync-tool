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

/**
 * Runs the full transfer pipeline in the background.
 * Called without await so the HTTP response returns immediately.
 *
 * Pipeline:
 *   1. Mark job as running
 *   2. Get fresh tokens for both platforms
 *   3. Fetch all tracks from source playlist
 *   4. Search for each track on destination (batched with concurrency limit)
 *   5. Create playlist on destination
 *   6. Add matched tracks
 *   7. Mark job as completed (or failed)
 */
export async function runTransferJob(params: {
  jobId: string;
  userId: string;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistId: string;
  playlistName: string;
}): Promise<void> {
  const {
    jobId,
    userId,
    sourcePlatform,
    destinationPlatform,
    sourcePlaylistId,
    playlistName,
  } = params;

  try {
    await updateJob(jobId, { status: "running" });

    // ── 1. Load accounts & providers ────────────────────────────────────────
    const [sourceAccount, destAccount] = await Promise.all([
      findAccount(userId, sourcePlatform),
      findAccount(userId, destinationPlatform),
    ]);

    if (!sourceAccount) throw new Error(`${sourcePlatform} account not found`);
    if (!destAccount)
      throw new Error(`${destinationPlatform} account not found`);

    const sourceProvider = makeProvider(sourcePlatform);
    const destProvider = makeProvider(destinationPlatform);

    const [sourceToken, destToken] = await Promise.all([
      getValidToken(sourceAccount, sourceProvider),
      getValidToken(destAccount, destProvider),
    ]);

    // ── 2. Fetch source tracks ───────────────────────────────────────────────
    console.log(`[job:${jobId}] fetching tracks from ${sourcePlatform}...`);
    const sourceTracks = await sourceProvider.getPlaylistTracks(
      sourceToken,
      sourcePlaylistId,
    );

    await updateJob(jobId, { totalTracks: sourceTracks.length });
    console.log(`[job:${jobId}] got ${sourceTracks.length} tracks`);

    // ── 3. Search destination with concurrency limit ──────────────────────────
    // Process in batches of 5 concurrent requests instead of 100 sequential
    // This is ~20x faster than sequential while staying well under rate limits
    const CONCURRENCY = 5;
    const matched: string[] = [];
    const unmatched: { title: string; artist: string }[] = [];

    for (let i = 0; i < sourceTracks.length; i += CONCURRENCY) {
      const batch = sourceTracks.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        batch.map((track) => destProvider.searchTrack(destToken, track)),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const track = batch[j];

        if (result.status === "fulfilled" && result.value.length > 0) {
          matched.push(result.value[0].providerId);
        } else {
          unmatched.push({ title: track.title, artist: track.artist });
        }
      }

      // Update progress after each batch so the UI shows live progress
      await updateJob(jobId, {
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
      });

      console.log(
        `[job:${jobId}] batch ${Math.floor(i / CONCURRENCY) + 1}: ` +
          `${matched.length} matched, ${unmatched.length} unmatched so far`,
      );

      // Small delay between batches to avoid rate limiting
      if (i + CONCURRENCY < sourceTracks.length) {
        await new Promise((r) => setTimeout(r, 20000));
      }
    }

    // ── 4. Create playlist on destination ─────────────────────────────────────
    console.log(
      `[job:${jobId}] creating playlist on ${destinationPlatform}...`,
    );
    const newPlaylistId = await destProvider.createPlaylist(
      destToken,
      playlistName,
      `Transferred from ${sourcePlatform} via music-migrate`,
    );

    // ── 5. Add matched tracks ─────────────────────────────────────────────────
    if (matched.length > 0) {
      await destProvider.addTracksToPlaylist(destToken, newPlaylistId, matched);
    }

    // ── 6. Mark complete ──────────────────────────────────────────────────────
    await updateJob(jobId, {
      status: "completed",
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      unmatchedTracks: unmatched,
    });

    console.log(
      `[job:${jobId}] done — ${matched.length}/${sourceTracks.length} tracks matched`,
    );
  } catch (error) {
    console.error(`[job:${jobId}] failed:`, error);
    await updateJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
