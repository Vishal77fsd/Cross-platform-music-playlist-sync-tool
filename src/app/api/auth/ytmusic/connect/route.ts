import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import { NextResponse } from "next/server";

export async function GET() {
  const state = crypto.randomUUID();
  const provider = new YtMusicProvider();

  const url = provider.getAuthorizationUrl(state);
  return NextResponse.json({ url, state });
}
