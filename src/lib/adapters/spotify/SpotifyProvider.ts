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
    process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ??
    "http://localhost:3000/api/auth/spotify/callback";

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope:
        "playlist-read-private playlist-modify-public playlist-modify-private user-read-private",
      state,
      show_dialog: "true",
    });
    console.log("params", this.clientId);
    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(_code: string): Promise<ProviderAuthToken> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: _code,
      redirect_uri: this.redirectUri,
    });

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Spotify token exchange failed: ${error}`);
    }

    const data = await res.json();

    return {
      provider: this.name,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000, // expires_in is in seconds
    };
  }

  async refreshToken(_token: ProviderAuthToken): Promise<ProviderAuthToken> {
    if (!_token.refreshToken) {
      throw new Error(
        "Cannot refresh Spotify token: No refresh token available.",
      );
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: _token.refreshToken,
      client_id: this.clientId,
    });

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const rawError = await res
          .text()
          .catch(() => "Unreadable stream output");
        console.error(
          `[Spotify Auth Error] Status: ${res.status}. Raw Output:`,
          rawError,
        );
        throw new Error(
          `Spotify token refresh failed with status ${res.status}. Check your server logs.`,
        );
      }

      const data = await res.json();
      console.log("data", data);

      // Safety fallback check to ensure Spotify actually gave us a token
      if (!data.access_token) {
        throw new Error(
          `Spotify token response missing access_token. Payload: ${JSON.stringify(data)}`,
        );
      }

      return {
        provider: this.name,
        accessToken: data.access_token,
        // Spotify may or may not return a new refresh token. Fallback to the old one.
        refreshToken: data.refresh_token ?? _token.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };
    } catch (error) {
      console.error("Error inside SpotifyProvider.refreshToken:", error);
      throw error;
    }
  }

  async getPlaylists(_token: ProviderAuthToken): Promise<ProviderPlaylist[]> {
    const playlists: ProviderPlaylist[] = [];

    let url = `${SPOTIFY_API_BASE}/me/playlists?limit=50`;
    while (url) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${_token.accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res
          .text()
          .catch(() => "Could not read error body");
        console.error(`[Spotify API Error] Status: ${res.status}`, errorText);
        throw new Error(
          `Failed to fetch spotify playlists. Status: ${res.status}`,
        );
      }

      const data = await res.json();
      // Map Spotify's playlist items to your internal ProviderPlaylist structure
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          playlists.push({
            providerId: item.id,
            provider: this.name, // "spotify"
            name: item.name,
            description: item.description ?? "",
            trackCount: item.tracks?.total ?? 0,
            imageUrl: item.images?.[0]?.url, // Grabs the first available image URL
          });
        }
      }

      // Move to the next page of pagination or break the loop when null
      url = data.next;
    }

    return playlists;
  }

  async getPlaylistTracks(
    _token: ProviderAuthToken,
    _playlistId: string,
  ): Promise<ProviderTrack[]> {
    // TODO: GET `${SPOTIFY_API_BASE}/playlists/{id}/tracks` (100 per page, paginated)
    throw new Error("SpotifyProvider.getPlaylistTracks not yet implemented");
  }

  async searchTrack(
    _token: ProviderAuthToken,
    _query: NormalizedTrack,
  ): Promise<ProviderTrack[]> {
    // TODO: GET `${SPOTIFY_API_BASE}/search?type=track&q=...`
    //   Build the query as `track:"<title>" artist:"<artist>"` for best precision.
    throw new Error("SpotifyProvider.searchTrack not yet implemented");
  }

  async createPlaylist(
    _token: ProviderAuthToken,
    _name: string,
    _description?: string,
  ): Promise<string> {
    // TODO: POST `${SPOTIFY_API_BASE}/users/{user_id}/playlists`
    //   Need the user's Spotify ID first — GET /me to fetch it.
    throw new Error("SpotifyProvider.createPlaylist not yet implemented");
  }

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[],
  ): Promise<void> {
    // TODO: POST `${SPOTIFY_API_BASE}/playlists/{id}/tracks`
    //   Spotify caps this at 100 track URIs per request — chunk the array.
    throw new Error("SpotifyProvider.addTracksToPlaylist not yet implemented");
  }
}
