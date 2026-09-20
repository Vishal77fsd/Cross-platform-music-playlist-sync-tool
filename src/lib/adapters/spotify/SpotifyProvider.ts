import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
  SpotifyPlaylistResponse,
  SpotifyUserProfile,
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
    token: ProviderAuthToken,
    playlistId: string,
  ): Promise<ProviderTrack[]> {
    const tracks: ProviderTrack[] = [];
    let url: string | null =
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/items?limit=100`;

    while (url) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Spotify getPlaylistTracks failed: ${errorText}`);
      }

      const data = await res.json();

      for (const item of data.items ?? []) {
        const track = item.item;

        // Skip nulls, podcasts, episodes — only want tracks
        if (!track || track.type !== "track") continue;
        if (item.is_local) continue; // local files have no Spotify ID

        tracks.push({
          providerId: track.id,
          provider: "spotify",
          title: track.name,
          artist: track.artists?.[0]?.name ?? "",
          featuredArtists:
            track.artists?.slice(1).map((a: { name: string }) => a.name) ?? [],
          album: track.album?.name,
          durationSeconds: track.duration_ms
            ? Math.round(track.duration_ms / 1000)
            : undefined,
          isrc: track.external_ids?.isrc,
          rawSourceText: track.name,
        });
      }

      // Spotify gives the next page as a full URL — null when no more pages
      url = data.next ?? null;
    }

    return tracks;
  }

  async searchTrack(
    _token: ProviderAuthToken,
    _query: NormalizedTrack,
  ): Promise<ProviderTrack[]> {
    // Build Spotify's field-filtered query for best precision
    // e.g. track:"Ghodey Pe Sawaar" artist:"Amit Trivedi"
    const q = `track:"${_query.title}" artist:"${_query.artist}"`;

    const params = new URLSearchParams({
      type: "track",
      q,
    });

    const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${_token.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Spotify search failed: ${errorText}`);
    }

    const data = await res.json();
    let items = data?.tracks?.items ?? [];

    // If strict search found nothing, retry with title only
    // (helps with YouTube tracks where artist = channel name)
    if (items.length === 0 && _query.artist) {
      const fallbackParams = new URLSearchParams({
        type: "track",
        q: _query.title,
        limit: "5",
      });

      const fallbackRes = await fetch(
        `${SPOTIFY_API_BASE}/search?${fallbackParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${_token.accessToken}`,
            Accept: "application/json",
          },
        },
      );

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        items = fallbackData?.tracks?.items ?? [];
      }
    }
    return items.map(
      (track: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { name: string };
        duration_ms: number;
        external_ids?: { isrc?: string };
      }): ProviderTrack => ({
        providerId: track.id,
        provider: "spotify",
        title: track.name,
        artist: track.artists[0]?.name ?? "",
        featuredArtists: track.artists.slice(1).map((a) => a.name),
        album: track.album?.name,
        durationSeconds: Math.round(track.duration_ms / 1000),
        isrc: track.external_ids?.isrc,
        rawSourceText: track.name,
      }),
    );
  }

  async createPlaylist(
    _token: ProviderAuthToken,
    _name: string,
    _description?: string,
  ): Promise<string> {
    // FETCH THE USERID FIRST
    // const userId = await this.getUserId(_token);
    try {
      const url = `${SPOTIFY_API_BASE}/me/playlists`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${_token.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: _name,
          description: _description,
          public: false,
        }),
      });

      if (!res.ok) {
        let errorDetails = "";
        try {
          const errData = await res.json();
          errorDetails = errData.error?.message
            ? `: ${errData.error.message}`
            : "";
        } catch {
          errorDetails = ` (Raw Status text: ${res.statusText})`;
        }
        throw new Error(
          `Spotify API error (Status ${res.status})${errorDetails}`,
        );
      }

      // 5. Parse and validate the response payload
      let data: SpotifyPlaylistResponse;
      try {
        data = await res.json();
      } catch {
        throw new Error("Failed to parse playlist response as JSON.");
      }

      if (!data || typeof data.id !== "string") {
        throw new Error(
          "Spotify playlist creation response is missing a valid 'id'.",
        );
      }

      // 6. Return the newly created playlist's ID
      return data.id;
    } catch (error) {
      console.error("Error inside SpotifyProvider.createPlaylist:", error);
      throw error;
    }
  }

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[],
  ): Promise<void> {
    //   Spotify caps this at 100 track URIs per request — chunk the array.
    const url = `${SPOTIFY_API_BASE}/playlists/${_playlistId}/items`;

    try {
      // 1. Convert simple track IDs into Spotify URIs
      const trackUris = _trackProviderIds.map((id) => `spotify:track:${id}`);

      // 2. Chunk the URIs into arrays of max 100 items each
      const chunkSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < trackUris.length; i += chunkSize) {
        chunks.push(trackUris.slice(i, i + chunkSize));
      }

      // 3. Process each batch sequentially or in parallel
      for (const chunk of chunks) {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${_token.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: chunk,
          }),
        });

        if (!res.ok) {
          let errorDetails = "";
          try {
            const errData = await res.json();
            errorDetails = errData.error?.message
              ? `: ${errData.error.message}`
              : "";
          } catch {
            errorDetails = ` (Raw Status text: ${res.statusText})`;
          }
          throw new Error(
            `Spotify API error (Status ${res.status})${errorDetails}`,
          );
        }

        // Spotify returns a snapshot_id on success
        const data = await res.json();
      }
    } catch (error) {
      console.error("Error while adding tracks in playlist", error);
      throw new Error(
        "Error while adding tracks in playlist. See server logs for details.",
      );
    }
  }

  private async getUserId(_token: ProviderAuthToken): Promise<string> {
    // Ensure the token exists before making the call
    if (!_token?.accessToken) {
      throw new Error("Spotify authentication failed: Missing access token.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
      const url = `${SPOTIFY_API_BASE}/me`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${_token.accessToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      // Clear timeout if fetch resolves in time
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorDetails = "";
        try {
          // Try parsing Spotify's standard error object
          const errData = await res.json();
          errorDetails = errData.error?.message
            ? `: ${errData.error.message}`
            : "";
        } catch {
          errorDetails = ` (Raw Status text: ${res.statusText})`;
        }
        throw new Error(
          `Spotify API error (Status ${res.status})${errorDetails}`,
        );
      }

      // Handle edge case: empty body or success status with no JSON
      if (res.status === 204) {
        throw new Error(
          "Spotify API returned an empty response (204 No Content).",
        );
      }

      // Safely parse JSON to prevent crashes on bad data
      let data: SpotifyUserProfile;
      try {
        data = await res.json();
      } catch {
        throw new Error("Failed to parse Spotify API response as JSON.");
      }

      // Explicitly validate that the 'id' field is present
      if (!data || typeof data.id !== "string") {
        throw new Error(
          "Spotify profile response is missing a valid user 'id'.",
        );
      }

      return data.account_id;
    } catch (error: any) {
      // Make sure timeout cleanup happens even if fetch throws before clearing it
      clearTimeout(timeoutId);

      if (error.name === "AbortController") {
        throw new Error("Spotify API request timed out after 10 seconds.");
      }

      // Bubble up the error with standard error tracing
      throw new Error(`getUserId failed: ${error.message || error}`);
    }
  }
}
