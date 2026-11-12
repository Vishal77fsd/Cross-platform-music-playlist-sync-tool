import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import { getValidToken } from "@/lib/auth/refreshToken";
import { getSession } from "@/lib/auth/session";
import { findAccount } from "@/lib/db/accounts";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  logger.info("[playlists] GET request received");
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");

  if (!platform) {
    return NextResponse.json(
      { error: "platform param required" },
      { status: 400 },
    );
  }

  const account = await findAccount(session.userId, platform);
  if (!account) {
    return NextResponse.json(
      { error: `${platform} is not connected. Go to Platforms to connect it.` },
      { status: 400 },
    );
  }

  try {
    const token = await getValidToken(account);

    if (platform === "spotify") {
      const provider = new SpotifyProvider();
      const playlists = await provider.getPlaylists(token, session);
      return NextResponse.json({ playlists });
    }

    if (platform === "ytmusic") {
      const provider = new YtMusicProvider();
      const playlists = await provider.getPlaylists(token, session);
      return NextResponse.json({ playlists });
    }

    return NextResponse.json(
      { error: `Platform "${platform}" is not supported yet.` },
      { status: 400 },
    );
  } catch (error) {
    logger.error(`[playlists] ${platform} fetch failed: ${error}`);
    console.error(`[playlists] ${platform} fetch failed:`, error);
    return NextResponse.json(
      { error: "Failed to fetch playlists. Try reconnecting the platform." },
      { status: 500 },
    );
  }
}
