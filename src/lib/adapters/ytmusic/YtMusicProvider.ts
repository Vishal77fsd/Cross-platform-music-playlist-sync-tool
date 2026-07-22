import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
} from "../../types/domain";
import type { MusicProvider } from "../../core/MusicProvider";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

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
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/ytmusic/callback";

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
    // TODO: POST to https://oauth2.googleapis.com/token
    //   body: grant_type=authorization_code, code, redirect_uri, client_id, client_secret
    throw new Error("YtMusicProvider.exchangeCodeForToken not yet implemented");
  }

  async refreshToken(_token: ProviderAuthToken): Promise<ProviderAuthToken> {
    // TODO: POST to https://oauth2.googleapis.com/token
    //   body: grant_type=refresh_token, refresh_token, client_id, client_secret
    throw new Error("YtMusicProvider.refreshToken not yet implemented");
  }

  async getPlaylists(_token: ProviderAuthToken): Promise<ProviderPlaylist[]> {
    // TODO: GET https://www.googleapis.com/youtube/v3/playlists?mine=true&part=snippet,contentDetails
    throw new Error("YtMusicProvider.getPlaylists not yet implemented");
  }

  async getPlaylistTracks(_token: ProviderAuthToken, _playlistId: string): Promise<ProviderTrack[]> {
    // TODO: GET https://www.googleapis.com/youtube/v3/playlistItems?playlistId=...&part=snippet
    //   Then run each video title through a title-cleaning function
    //   (strip "(Official Video)", "[Lyrics]", "ft. X", etc.) to build
    //   a NormalizedTrack from the raw title.
    throw new Error("YtMusicProvider.getPlaylistTracks not yet implemented");
  }

  async searchTrack(_token: ProviderAuthToken, _query: NormalizedTrack): Promise<ProviderTrack[]> {
    // TODO: GET https://www.googleapis.com/youtube/v3/search?type=video&videoCategoryId=10&q=...
    //   videoCategoryId=10 filters to the "Music" category.
    throw new Error("YtMusicProvider.searchTrack not yet implemented");
  }

  async createPlaylist(_token: ProviderAuthToken, _name: string, _description?: string): Promise<string> {
    // TODO: POST https://www.googleapis.com/youtube/v3/playlists?part=snippet
    throw new Error("YtMusicProvider.createPlaylist not yet implemented");
  }

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[]
  ): Promise<void> {
    // TODO: POST https://www.googleapis.com/youtube/v3/playlistItems?part=snippet
    //   No batch endpoint here — one request per video, so this loop
    //   will need its own rate-limit handling (YouTube quota is tight).
    throw new Error("YtMusicProvider.addTracksToPlaylist not yet implemented");
  }
}
