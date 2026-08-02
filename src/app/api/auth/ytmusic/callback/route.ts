import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import { upsertAccount } from "@/lib/db/accounts";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=access_denied", req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=missing_params", req.url)
    );
  }

  const [, userId] = state.split(":");

  if (!userId) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=invalid_state", req.url)
    );
  }

  try {
    const provider = new YtMusicProvider();
    const token = await provider.exchangeCodeForToken(code);

    // Fetch the user's YouTube channel ID using the correct endpoint
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!channelRes.ok) {
      const errorText = await channelRes.text();
      throw new Error(`Failed to fetch YouTube channel: ${errorText}`);
    }

    const channelData = await channelRes.json();
    console.log("Channel data:", JSON.stringify(channelData));

    const providerAccountId = channelData.items?.[0]?.id;

    if (!providerAccountId) {
      throw new Error("No channel ID found in YouTube response.");
    }

    await upsertAccount({
      userId,
      platform: "ytmusic",
      providerAccountId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? null,
      expiresAt: token.expiresAt
        ? new Date(token.expiresAt).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    return NextResponse.redirect(
      new URL("/dashboard/platforms?connected=ytmusic", req.url)
    );
  } catch (err) {
    console.error("[ytmusic callback] failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=token_exchange_failed", req.url)
    );
  }
}