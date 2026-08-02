import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
} from "../../types/domain";
import type { MusicProvider } from "../../core/MusicProvider";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://googleapis.com";
const YOUTUBE_API_BASE = "https://googleapis.com";
/**
 * YouTube Music adapter.
 *
 * IMPORTANT CAVEAT: there is no official "YouTube Music API" for
 * playlist read/write. This scaffold uses the official YouTube Data
 * API v3 (OAuth, quota-limited, stable) against regular YouTube
 * playlists. The tradeoff: video titles are raw ("Artist - Song
 * (Official Video)"), not clean artist/title fields like Spotify
 * gives you — you'll want a title-cleaning step before matching.
 *
 * NOTE: this is a SCAFFOLD, same as the Spotify adapter — the auth
 * URL builder works, the rest are TODOs for you to fill in.
 */
export class YtMusicProvider implements MusicProvider {
  readonly name = "ytmusic" as const;

  private clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  private redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/ytmusic/callback";

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: "https://www.googleapis.com/auth/youtube",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(_code: string): Promise<ProviderAuthToken> {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: _code,
      redirect_uri: this.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    const data = await res.json();
    return {
      provider: this.name,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null, // Google only sends this once on consent prompt
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  async refreshToken(_token: ProviderAuthToken): Promise<ProviderAuthToken> {
    if (!_token.refreshToken) {
      throw new Error("No refresh token available for YouTube Music.");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: _token.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`YouTube token refresh failed: ${error}`);
    }

    const data = await res.json();

    return {
      provider: "ytmusic",
      accessToken: data.access_token,
      // Google doesn't always return a new refresh token — keep the old one
      refreshToken: data.refresh_token ?? _token.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  async getPlaylists(_token: ProviderAuthToken): Promise<ProviderPlaylist[]> {
    const playlists: ProviderPlaylist[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        mine: "true",
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${_token.accessToken}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "YtMusicProvider.getPlaylists error response:",
          errorText,
        );
        throw new Error(
          `YouTube API returned status ${res.status}: ${errorText}`,
        );
      }

      // Safely parse JSON once per request
      const data = await res.json();

      if (data.items) {
        for (const item of data.items) {
          playlists.push({
            id: item.id,
            name: item.snippet?.title || "Untitled Playlist",
            description: item.snippet?.description || "",
            trackCount: item.contentDetails?.itemCount || 0,
            images: item.snippet?.thumbnails
              ? Object.values(item.snippet.thumbnails).map((t: any) => ({
                  url: t.url,
                }))
              : [],
          } as unknown as ProviderPlaylist); // Ensure cast matches your exact ProviderPlaylist type contract
        }
      }

      // Advance to the next page of playlists, if available
      pageToken = data.nextPageToken;
    } while (pageToken);

    return playlists;
  }

  async getPlaylistTracks(
    _token: ProviderAuthToken,
    _playlistId: string,
  ): Promise<ProviderTrack[]> {
    // TODO: GET https://www.googleapis.com/youtube/v3/playlistItems?playlistId=...&part=snippet
    //   Then run each video title through a title-cleaning function
    //   (strip "(Official Video)", "[Lyrics]", "ft. X", etc.) to build
    //   a NormalizedTrack from the raw title.
    throw new Error("YtMusicProvider.getPlaylistTracks not yet implemented");
  }

  async searchTrack(
    _token: ProviderAuthToken,
    _query: NormalizedTrack,
  ): Promise<ProviderTrack[]> {
    // TODO: GET https://www.googleapis.com/youtube/v3/search?type=video&videoCategoryId=10&q=...
    //   videoCategoryId=10 filters to the "Music" category.
    throw new Error("YtMusicProvider.searchTrack not yet implemented");
  }

  async createPlaylist(
    _token: ProviderAuthToken,
    _name: string,
    _description?: string,
  ): Promise<string> {
    // TODO: POST https://www.googleapis.com/youtube/v3/playlists?part=snippet
    throw new Error("YtMusicProvider.createPlaylist not yet implemented");
  }

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[],
  ): Promise<void> {
    // TODO: POST https://www.googleapis.com/youtube/v3/playlistItems?part=snippet
    //   No batch endpoint here — one request per video, so this loop
    //   will need its own rate-limit handling (YouTube quota is tight).
    throw new Error("YtMusicProvider.addTracksToPlaylist not yet implemented");
  }
}
