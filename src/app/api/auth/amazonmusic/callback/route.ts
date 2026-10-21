import { AmazonMusicProvider } from "@/lib/adapters/amazonmusic/AmazonMusicProvider";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  logger.info("[amazonmusic callback] GET request received");
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/platforms?error=${error}&error_description=${errorDescription}`,
        req.url,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=missing_params", req.url),
    );
  }

  const [, userId] = state.split(":");
  if (!userId) {
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=invalid_state", req.url),
    );
  }

  try {
    const provider = new AmazonMusicProvider();
    const token = await provider.exchangeCodeForToken(code);
    
  } catch (err) {
    console.error("[amazonmusic callback] failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard/platforms?error=token_exchange_failed", req.url),
    );
  }
}
