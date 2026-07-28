import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { getSession } from "@/lib/auth/session";
import { findAccount, upsertAccount } from "@/lib/db/accounts";
import { ProviderAuthToken } from "@/lib/types/domain";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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
      { error: `${platform} not connected` },
      { status: 400 },
    );
  }

  if (platform === "spotify") {
    try {
      const provider = new SpotifyProvider();

      // 1. Build initial token state using numeric timestamps
      let providerToken: ProviderAuthToken = {
        provider: "spotify",
        accessToken: account.accessToken,
        refreshToken: account.refreshToken ?? undefined,
        // Default to 0 if expiresAt is somehow missing, forcing a safe refresh
        expiresAt: account.expiresAt
          ? new Date(account.expiresAt).getTime()
          : 0,
      };

      // 2. Proactively refresh if expired (with a 30-second buffer cushion)
      const isExpired = Date.now() >= providerToken?.expiresAt - 30000;
      if (isExpired) {
        console.log(
          `[Token Sync] Spotify token for user ${session.userId} has expired. Launching refresh...`,
        );

        // Execute the updated refreshToken flow in your provider
        providerToken = await provider.refreshToken(providerToken);
        console.log("New Token", providerToken);
        // 3. Persist the brand new access token straight to the Database
        await upsertAccount({
          userId: session.userId,
          platform: "spotify",
          providerAccountId: account.providerAccountId,
          accessToken: providerToken.accessToken,
          refreshToken: providerToken.refreshToken ?? account.refreshToken, // Fallback to old token if missing
          expiresAt: new Date(providerToken?.expiresAt).toISOString(), // Map number millisecond back to ISO string
        });

        console.log(
          `[Token Sync] Database successfully updated with fresh credentials for user ${session.userId}.`,
        );
      }
      // 4. Safely query the playlist items with a verified valid token
      const playlists = await provider.getPlaylists(providerToken);

      // Wrap your array in an object to preserve compatibility with your frontend response structure
      return NextResponse.json({ playlists });
    } catch (error: any) {
      console.error(
        "Critical Exception inside Spotify playlist routing orchestration:",
        error,
      );
      return NextResponse.json(
        {
          error: "Failed to fetch Spotify playlist records",
          details: error?.message || "Unknown error",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Platform not supported yet" },
    { status: 400 },
  );
}
