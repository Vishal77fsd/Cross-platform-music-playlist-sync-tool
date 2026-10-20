import { MusicProvider } from "@/lib/core/MusicProvider";
import {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
} from "@/lib/types/domain";
import * as crypto from "crypto";

// FIX: This global module variable persists across separate Next.js route file invocations
let NEXT_JS_GLOBAL_AMAZON_VERIFIER = "";

export class AmazonMusicProvider implements MusicProvider {
  readonly name = "amazonmusic" as const;
  private pkceCache = new Map<String, String>();
  private currentVerifier: string = "";

  AMAZON_AUTH_URL = "https://www.amazon.com/ap/oa";
  AMAZON_API_BASE = "https://api.amazon.com/auth/o2";

  private clientId = process.env.AMAZON_CLIENT_ID ?? "";
  private clientSecret = process.env.AMAZON_CLIENT_SECRET ?? "";
  private redirectUri =
    process.env.AMAZON_REDIRECT_URI ??
    "http://localhost:3000/api/auth/amazonmusic/callback";

  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    return { codeVerifier, codeChallenge };
  }

  getAuthorizationUrl(state: string): string {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    // Store it inside the file's global top-level scope memory block
    NEXT_JS_GLOBAL_AMAZON_VERIFIER = codeVerifier;
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: "profile",
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    return `${this.AMAZON_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(_code: string): Promise<ProviderAuthToken> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: _code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code_verifier: NEXT_JS_GLOBAL_AMAZON_VERIFIER,
    });
    console.log("Exchanging code for token with body:2", body.toString());
    const res = await fetch(`${this.AMAZON_API_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Amazon music token exchange failed: ${error}`);
    }

    const data = await res.json();
    return {
      provider: this.name,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000, // expires_in is in seconds
    };
  }

  async refreshToken(_token: ProviderAuthToken): Promise<ProviderAuthToken> {}

  async getPlaylists(_token: ProviderAuthToken): Promise<ProviderPlaylist[]> {}

  async getPlaylistTracks(
    _token: ProviderAuthToken,
    _playlistId: string,
  ): Promise<ProviderTrack[]> {}

  async searchTrack(
    _token: ProviderAuthToken,
    _query: NormalizedTrack,
  ): Promise<ProviderTrack[]> {}

  async createPlaylist(
    _token: ProviderAuthToken,
    _name: string,
    _description?: string,
  ): Promise<string> {}

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[],
  ): Promise<void> {}
}
