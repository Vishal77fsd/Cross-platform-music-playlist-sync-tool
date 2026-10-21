import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { upsertAccount } from "@/lib/db/accounts";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

async function getSpotifyUserId(accessToken: string): Promise<string> {
  logger.info("[spotify callback] Fetching Spotify user profile");
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Spotify user profile");
  const data = await res.json();
  return data.id as string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=access_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=missing_params", request.url)
    );
  }

  // Extract userId from state — format is "uuid:userId"
  const parts = state.split(":");
  // state format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:userId"
  // userId is the last part, the UUID before it has colons too so join the rest
  const userId = parts[parts.length - 1];

  if (!userId) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=invalid_state", request.url)
    );
  }

  try {
    const provider = new SpotifyProvider();
    const token = await provider.exchangeCodeForToken(code);
    const providerAccountId = await getSpotifyUserId(token.accessToken);

    const data = await upsertAccount({
      userId,
      platform: "spotify",
      providerAccountId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? null,
      expiresAt: token.expiresAt
        ? new Date(token.expiresAt).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(),
    });
    console.log("Data", data);
    return NextResponse.redirect(
      new URL("/dashboard/platforms?connected=spotify", request.url)
    );
  } catch (err) {
    console.error("Spotify callback failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=token_exchange_failed", request.url)
    );
  }
}