import { SessionPayload } from "../auth/session";
import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderName,
  ProviderPlaylist,
  ProviderTrack,
} from "../types/domain";

/**
 * The contract every music platform adapter must implement.
 *
 * This is the seam that makes the app "pluggable" — the core engine
 * (auth manager, matcher, job queue) only ever talks to this interface,
 * never to a provider's raw API. Adding a new platform means writing
 * one new class that implements MusicProvider; nothing else changes.
 */
export interface MusicProvider {
  readonly name: ProviderName;

  /**
   * Build the URL the user is redirected to in order to grant access
   * (OAuth authorization code flow). Returns null for providers that
   * use a different auth scheme (e.g. unofficial APIs with cookie auth).
   */
  getAuthorizationUrl(state: string): string | null;

  /**
   * Exchange an OAuth authorization code (from the redirect callback)
   * for an access/refresh token pair.
   */
  exchangeCodeForToken(code: string): Promise<ProviderAuthToken>;

  /**
   * Refresh an expired access token. Throws if the provider doesn't
   * support refresh or the refresh token is invalid/revoked.
   */
  refreshToken(token: ProviderAuthToken): Promise<ProviderAuthToken>;

  /** List the authenticated user's playlists (metadata only, no tracks). */
  getPlaylists(token: ProviderAuthToken, session:SessionPayload): Promise<ProviderPlaylist[]>;

  /** Fetch all tracks in a given playlist, normalized to our common shape. */
  getPlaylistTracks(token: ProviderAuthToken, playlistId: string): Promise<ProviderTrack[]>;

  /**
   * Search this provider's catalog for a track matching the given
   * normalized track. Returns ranked candidates (best first) — the
   * matcher decides which (if any) candidate is good enough to use.
   */
  searchTrack(token: ProviderAuthToken, query: NormalizedTrack): Promise<ProviderTrack[]>;

  /** Create a new, empty playlist and return its provider-assigned ID. */
  createPlaylist(token: ProviderAuthToken, name: string, description?: string): Promise<string>;

  /**
   * Add tracks to a playlist. Implementations should handle the
   * provider's batch-size limits internally (e.g. Spotify caps at
   * 100 tracks per request) and not require the caller to chunk.
   */
  addTracksToPlaylist(token: ProviderAuthToken, playlistId: string, trackProviderIds: string[]): Promise<void>;
}
