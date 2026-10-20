import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { NextRequest } from "next/server";
import { AmazonMusicProvider } from "@/lib/adapters/amazonmusic/AmazonMusicProvider";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = `${crypto.randomUUID()}:${session.userId}`;
  const provider = new AmazonMusicProvider();

  const url = provider.getAuthorizationUrl(state);
  return NextResponse.json({ url, state });
}
