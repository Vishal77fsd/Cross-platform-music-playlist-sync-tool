import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
} from "../../types/domain";
import type { MusicProvider } from "../../core/MusicProvider";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/**
 * Spotify adapter. Uses standard OAuth Authorization Code flow.
 * Scopes needed: playlist-read-private, playlist-modify-public,
 * playlist-modify-private, user-read-private.
 *
 * NOTE: this is a SCAFFOLD. The auth URL builder works; the rest of
 * the methods are stubbed with TODOs describing exactly which Spotify
 * endpoint to call. This is intentionally left for you to implement
 * as a learning exercise — see the TODO comments for the shape of
 * each request.
 */
export class SpotifyProvider implements MusicProvider {
  readonly name = "spotify" as const;

  private clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
  private clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  private redirectUri =
    process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? "http://localhost:3000/api/auth/spotify/callback";

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: "playlist-read-private playlist-modify-public playlist-modify-private user-read-private",
      state,
      show_dialog: "true",
    });
    console.log("params", this.clientId)
    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(_code: string): Promise<ProviderAuthToken> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: _code,
      redirect_uri: this.redirectUri,
    });

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if(!res.ok){
      const error = await res.text();
      throw new Error(`Spotify token exchange failed: ${error}`);
    }

    const data = await res.json();

    return {
      provider: this.name,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000, // expires_in is in seconds
    }
  }

  async refreshToken(_token: ProviderAuthToken): Promise<ProviderAuthToken> {
    // TODO: POST to https://accounts.spotify.com/api/token
    //   body: grant_type=refresh_token, refresh_token, client_id, client_secret
    throw new Error("SpotifyProvider.refreshToken not yet implemented");
  }

  async getPlaylists(_token: ProviderAuthToken): Promise<ProviderPlaylist[]> {
    // TODO: GET `${SPOTIFY_API_BASE}/me/playlists` with Authorization: Bearer <token>
    //   Paginated via `next` field in the response — loop until next is null.
    throw new Error("SpotifyProvider.getPlaylists not yet implemented");
  }

  async getPlaylistTracks(_token: ProviderAuthToken, _playlistId: string): Promise<ProviderTrack[]> {
    // TODO: GET `${SPOTIFY_API_BASE}/playlists/{id}/tracks` (100 per page, paginated)
    throw new Error("SpotifyProvider.getPlaylistTracks not yet implemented");
  }

  async searchTrack(_token: ProviderAuthToken, _query: NormalizedTrack): Promise<ProviderTrack[]> {
    // TODO: GET `${SPOTIFY_API_BASE}/search?type=track&q=...`
    //   Build the query as `track:"<title>" artist:"<artist>"` for best precision.
    throw new Error("SpotifyProvider.searchTrack not yet implemented");
  }

  async createPlaylist(_token: ProviderAuthToken, _name: string, _description?: string): Promise<string> {
    // TODO: POST `${SPOTIFY_API_BASE}/users/{user_id}/playlists`
    //   Need the user's Spotify ID first — GET /me to fetch it.
    throw new Error("SpotifyProvider.createPlaylist not yet implemented");
  }

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[]
  ): Promise<void> {
    // TODO: POST `${SPOTIFY_API_BASE}/playlists/{id}/tracks`
    //   Spotify caps this at 100 track URIs per request — chunk the array.
    throw new Error("SpotifyProvider.addTracksToPlaylist not yet implemented");
  }
}
