import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import { getSession } from "@/lib/auth/session";
import { MusicProvider } from "@/lib/core/MusicProvider";
import { AccountRecord, findAccount, upsertAccount } from "@/lib/db/accounts";
import { ProviderAuthToken } from "@/lib/types/domain";
import { type NextRequest, NextResponse } from "next/server";

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

  console.log(`[transfer] refreshing ${account.platform} token...`);
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
// ─── Provider factory ────────────────────────────────────────────────────────
function makeProvider(platform: string): MusicProvider {
  if (platform === "spotify") return new SpotifyProvider();
  if (platform === "ytmusic") return new YtMusicProvider();
  throw new Error(`Unsupported platform: ${platform}`);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sourcePlatform, destinationPlatform, playlistId } = body ?? {};

  if (!sourcePlatform || !destinationPlatform || !playlistId) {
    return NextResponse.json(
      {
        error:
          "sourcePlatform, destinationPlatform and playlistId are required.",
      },
      { status: 400 },
    );
  }

  if (sourcePlatform === destinationPlatform) {
    return NextResponse.json(
      { error: "Source and destination platforms must be different" },
      { status: 400 },
    );
  }

  // LOAD BOTH THE ACCONT
  const [sourceAccount, destinationAccount] = await Promise.all([
    findAccount(session.userId, sourcePlatform),
    findAccount(session.userId, destinationPlatform),
  ]);

  if (!sourceAccount) {
    console.error(`[transfer]`, sourceAccount);
    return NextResponse.json(
      { error: `${sourcePlatform} is not connected.` },
      { status: 400 },
    );
  }

  if (!destinationAccount) {
    console.error(`[transfer]`, destinationAccount);
    return NextResponse.json(
      { error: `${destinationPlatform} is not connected.` },
      { status: 400 },
    );
  }

  try {
    const sourceProvider = makeProvider(sourcePlatform);
    const destProvider = makeProvider(destinationPlatform);

    // ── 2. Get fresh tokens ──────────────────────────────────────────────────
    const [sourceToken, destToken] = await Promise.all([
      getValidToken(sourceAccount, sourceProvider),
      getValidToken(destinationAccount, destProvider),
    ]);

    // ── 3. Fetch tracks from source playlist ─────────────────────────────────
    console.log(
      `[transfer] fetching tracks from ${sourcePlatform} playlist ${playlistId}`,
    );
    const sourceTracks = await sourceProvider.getPlaylistTracks(
      sourceToken,
      playlistId,
    );
    console.log(`[transfer] got ${sourceTracks.length} tracks`);

    if (sourceTracks.length === 0) {
      return NextResponse.json(
        { error: "The source playlist has no tracks." },
        { status: 400 },
      );
    }

    // ── 4. Search for each track on the destination ───────────────────────────
    const matched: string[] = []; // destination provider IDs to add
    const unmatched: {
      title: string;
      artist: string;
    }[] = [];

    for (const track of sourceTracks) {
      try {
        const candidates = await destProvider.searchTrack(destToken, track);
        if (candidates.length > 0) {
          matched.push(candidates[0].providerId);
        } else {
          unmatched.push({
            title: track.title,
            artist: track.artist,
          });
        }
      } catch (error) {
        // One failed search shouldn't abort the whole transfer
        console.error("error on here", error);
        unmatched.push({ title: track.title, artist: track.artist });
      }
    }

    console.log(
      `[transfer] matched: ${matched.length}, unmatched: ${unmatched.length}`,
    );
    if (matched.length === 0) {
      return NextResponse.json(
        {
          error:
            "None of the tracks could be found on the destination platform.",
        },
        { status: 422 },
      );
    }

    // ── 5. Create playlist on destination ────────────────────────────────────
    const playlistName = sourceTracks[0]
      ? `Transferred playlist`
      : "New playlist";

    const newPlaylistId = await destProvider.createPlaylist(
      destToken,
      playlistName,
      `Transferred from ${sourcePlatform} via Music-migrate`,
    );

    // ── 6. Add matched tracks ────────────────────────────────────────────────
    await destProvider.addTracksToPlaylist(destToken, newPlaylistId, matched);

    // ── 7. Return results ────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      jobId: newPlaylistId,
      totalTracks: sourceTracks.length,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      matchPercent: Math.round((matched.length / sourceTracks.length) * 100),
      unmatched, // so the UI can show what was missed
    });
  } catch (error) {
    console.error("[transfer] failed:", error);
    return NextResponse.json(
      {
        error: "Transfer failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
