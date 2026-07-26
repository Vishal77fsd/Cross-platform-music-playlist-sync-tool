import { NextResponse } from "next/server";
import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { getSession } from "@/lib/auth/session";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Get the session here — this is a same-site request so cookie works fine
  const session = await getSession(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Encode userId into state so we can read it back in the callback
  // without needing the cookie
  const state = `${crypto.randomUUID()}:${session.userId}`;

  const provider = new SpotifyProvider();
  const url = provider.getAuthorizationUrl(state);

  return NextResponse.json({ url, state });
}