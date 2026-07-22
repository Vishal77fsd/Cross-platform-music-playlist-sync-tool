/**
 * Core domain types shared across every provider adapter.
 * These are intentionally provider-agnostic — a Track looks the same
 * whether it came from Spotify or YouTube Music.
 */

/** A track as understood by our system, independent of source platform. */
export interface NormalizedTrack {
  /** Title with noise stripped: no "(Official Video)", "[Lyrics]", "ft. X", etc. */
  title: string;
  /** Primary artist name, cleaned. */
  artist: string;
  /** Additional featured artists, if parseable. */
  featuredArtists?: string[];
  /** Album name, if known. */
  album?: string;
  /** Track duration in seconds, if known — used as a matching signal. */
  durationSeconds?: number;
  /**
   * International Standard Recording Code. The single most reliable
   * cross-platform identifier when available — an exact ISRC match
   * is treated as ground truth and skips fuzzy matching entirely.
   */
  isrc?: string;
  /** Raw title/string as it appeared on the source platform, kept for debugging unmatched tracks. */
  rawSourceText: string;
}

/** A track as it exists on a specific provider, with that provider's native ID. */
export interface ProviderTrack extends NormalizedTrack {
  /** The ID this provider uses internally for this track (e.g. Spotify track URI, YT Music video ID). */
  providerId: string;
  /** Which provider this track record came from. */
  provider: ProviderName;
}

export interface ProviderPlaylist {
  providerId: string;
  provider: ProviderName;
  name: string;
  description?: string;
  trackCount: number;
  /** Cover art URL, if available — purely cosmetic for the UI. */
  imageUrl?: string;
}

/** Registry of supported provider names. Add new providers here first. */
export type ProviderName = "spotify" | "ytmusic" | "apple_music";

/** OAuth token bundle stored per-user, per-provider. */
export interface ProviderAuthToken {
  provider: ProviderName;
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms when accessToken expires. Adapters use this to decide when to refresh. */
  expiresAt?: number;
  /** Provider-specific extra fields (e.g. Spotify scopes granted). */
  meta?: Record<string, unknown>;
}

/** Result of trying to find a track on the destination provider. */
export interface MatchResult {
  sourceTrack: NormalizedTrack;
  matchedTrack: ProviderTrack | null;
  /** 0-1 confidence score. 1.0 = exact ISRC match. Below ~0.6 should be flagged for manual review. */
  confidence: number;
  matchMethod: "isrc" | "fuzzy" | "none";
}

/** Outcome of migrating one playlist from a source provider to a destination provider. */
export interface TransferJobResult {
  jobId: string;
  sourcePlaylistId: string;
  destinationPlaylistId: string | null;
  totalTracks: number;
  matched: MatchResult[];
  unmatched: MatchResult[];
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}
