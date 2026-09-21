import type {
  NormalizedTrack,
  ProviderAuthToken,
  ProviderPlaylist,
  ProviderTrack,
} from "../../types/domain";
import type { MusicProvider } from "../../core/MusicProvider";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://googleapis.com";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
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
    if (!_playlistId) {
      throw new Error("Playlist ID not found.");
    }

    const tracks: ProviderTrack[] = [];
    let pageToken: string | undefined;

    do {
      const queryParams = new URLSearchParams({
        playlistId: _playlistId,
        part: "snippet",
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${queryParams.toString()}`,
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
          "YtMusicProvider.getPlaylistTracks error response:",
          errorText,
        );
        throw new Error(
          `YouTube API returned status ${res.status}: ${errorText}`,
        );
      }

      const data = await res.json();

      for (const item of data.items ?? []) {
        const snippet = item.snippet ?? {};
        const rawTitle: string = snippet.title ?? "";
        const videoId: string = snippet.resourceId?.videoId ?? "";
        const description: string = snippet.description ?? "";

        // Skip deleted/private videos — YouTube leaves them in playlists with the title "Deleted video" or "Private video"
        if (
          !videoId ||
          rawTitle === "Deleted video" ||
          rawTitle === "Private video"
        ) {
          continue;
        }

        // Clean the channel name — YouTube Music auto-channels
        // end with " - Topic", strip that for a clean artist name
        let channelArtist: string =
          snippet.videoOwnerChannelTitle ?? "Unknown Artist";
        channelArtist = channelArtist.replace(/\s*-\s*Topic$/i, "").trim();

        // ── Case 1: Jukebox / compilation ──────────────────────────────────────
        if (this.isJukebox(rawTitle)) {
          const jukeboxTracks = this.parseJukeboxDescription(
            description,
            channelArtist,
            videoId,
          );

          if (jukeboxTracks.length > 0) {
            tracks.push(...jukeboxTracks);
            continue;
          }
        }

        // ── Case 2: Normal video (possibly messy title) ─────────────────────────
        const { title, artist } = this.parseTitle(rawTitle, channelArtist);

        tracks.push({
          providerId: videoId,
          provider: "ytmusic",
          title,
          artist,
          rawSourceText: rawTitle,
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return tracks;
  }

  async searchTrack(
    _token: ProviderAuthToken,
    _query: NormalizedTrack,
  ): Promise<ProviderTrack[]> {
    const searchQuery = _query.artist
      ? `${_query.title} ${_query.artist}`
      : `${_query.title}`;
    const url = `${YOUTUBE_API_BASE}/search?type=video&videoCategoryId=10&part=snippet&q=${searchQuery}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${_token.accessToken}`,
          Accept: "application/json",
          "Content-type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Youtube API responded with status ${res.status}:${JSON.stringify(errorData)}`,
        );
      }
      const data = await res.json();

      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }

      return data.items.map((item: any) => {
        const rawArtist = item.snippet.channelTitle || "";
        const cleanedArtist = rawArtist.endsWith("VEVO")
          ? rawArtist.slice(0, -4)
          : rawArtist;

        return {
          provider: "ytmusic",
          providerId: item.id.videoId,
          title: item.snippet.title,
          artist: cleanedArtist || _query.artist,
          rawSourceText: item.snippet.title,
        };
      });
    } catch (err: any) {
      console.error(
        "Error occurred while searching track in YT:",
        err.message || err,
      );
      throw new Error(
        `Error Occurred while fetching from YouTube: ${err.message || err}`,
      );
    }
  }

  async createPlaylist(
    _token: ProviderAuthToken,
    _name: string,
    _description?: string,
  ): Promise<string> {
    const url = `${YOUTUBE_API_BASE}/playlists?part=snippet`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${_token.accessToken}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: _name,
            description: _description || "",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("YouTube API Error:", data.error?.message || data);
        throw new Error(data.error?.message || "Failed to create playlist");
      }

      console.log("DDATAA", data);
      return data.id;
    } catch (err: any) {
      console.error(
        "Error occurred while creating playlist on YT:",
        err.message || err,
      );
      throw new Error(
        `Error occurred while creating playlist on YT: ${err.message || err}`,
      );
    }
  }
  // Helper utility to pause execution between requests to respect rate limits
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async addTracksToPlaylist(
    _token: ProviderAuthToken,
    _playlistId: string,
    _trackProviderIds: string[],
  ): Promise<void> {
    if (!_playlistId) {
      throw new Error("Playlist ID not provided.");
    }

    if (!_trackProviderIds || _trackProviderIds.length === 0) {
      console.warn("No tracks provided to add to the playlist.");
      return;
    }

    const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet`;

    for (const trackId of _trackProviderIds) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${_token.accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            snippet: {
              playlistId: _playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: trackId,
              },
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `YouTube API responded with status ${response.status}: ${
              errorData.error?.message || response.statusText
            }`,
          );
        }

        // Optional: Wait 200ms between requests to avoid hitting rate limits too quickly
        await this.sleep(200);
      } catch (err: any) {
        console.error(
          `Error occurred while adding track ${trackId} to YT playlist:`,
          err.message || err,
        );
        // Decide if you want to fail the whole operation or continue with the remaining tracks
        throw new Error(`Failed to populate playlist: ${err.message || err}`);
      }
    }
    console.log(
      `Successfully added ${_trackProviderIds.length} tracks to playlist: ${_playlistId}`,
    );
  }

  /** HELPERS FUNCTION **/

  /**
   * Detects if a video is a jukebox/compilation/full album.
   * Checks the title for known keywords.
   */
  private isJukebox(title: string): boolean {
    const JUKEBOX_KEYWORDS = [
      /jukebox/i,
      /full\s*album/i,
      /audio\s*jukebox/i,
      /all\s*songs/i,
      /complete\s*album/i,
      /non\s*stop/i,
      /mashup/i,
      /medley/i,
    ];

    return JUKEBOX_KEYWORDS.some((pattern) => pattern.test(title));
  }

  /**
   * Parses a jukebox video description to extract individual tracks
   * from timestamp lines like:
   *   00:00 Ghodey Pe Sawaar
   *   03:09 Rubaaiyaan
   *   15:20 Nirbhau Nirvair - Sireesha Bhagavatula
   */
  private parseJukeboxDescription(
    description: string,
    channelArtist: string,
    videoId: string,
  ): ProviderTrack[] {
    // Matches: optional hours, minutes, seconds, then the song title
    // e.g. "00:00 Song Name", "1:03:22 Another Song"
    const TIMESTAMP_LINE = /^(?:\d{1,2}:)?\d{1,2}:\d{2}\s+[-–—]?\s*(.+)$/gm;

    const tracks: ProviderTrack[] = [];
    let match: RegExpExecArray | null;

    while ((match = TIMESTAMP_LINE.exec(description)) !== null) {
      const rawSongText = match[1].trim();

      if (!rawSongText) continue;

      // Each timestamp line can itself have "Song - Artist" format
      const { title, artist } = this.parseTitle(rawSongText, channelArtist);

      // Filter out non-song lines that happen to match the pattern
      // e.g. "Subscribe to our channel" after a timestamp

      if (this.looksLikeSongTitle(title)) {
        tracks.push({
          // Use videoId + index so each "track" has a unique ID
          providerId: `${videoId}_t${tracks.length}`,
          provider: "ytmusic",
          title,
          artist,
          rawSourceText: rawSongText,
        });
      }
    }

    return tracks;
  }
  /**
   * Filters out description lines that aren't actual song titles.
   * Rejects lines that look like channel plugs, hashtag lines, URLs etc.
   */
  private looksLikeSongTitle(text: string): boolean {
    if (text.length < 2 || text.length > 120) return false;
    if (/^#/.test(text)) return false; // hashtag lines
    if (/https?:\/\//.test(text)) return false; // URLs
    if (/subscribe/i.test(text)) return false; // subscribe plugs
    if (/follow us/i.test(text)) return false; // social plugs
    if (/facebook|twitter|instagram/i.test(text)) return false;
    return true;
  }

  /**
   * Cleans a raw YouTube video title into a usable track title and artist.
   *
   * YouTube titles follow no standard format. Common patterns:
   *   "Artist - Song Title (Official Video)"
   *   "Song Title | Artist"
   *   "Artist "Song Title" (Lyrics)"
   *   "Song Title (ft. Other Artist) [Official Audio]"
   */
  private parseTitle(
    rawTitle: string,
    channelArtist: string,
  ): { title: string; artist: string } {
    const NOISE = [
      /\(official\s*(music\s*)?video\)/gi,
      /\(official\s*audio\)/gi,
      /\[official\s*(music\s*)?video\]/gi,
      /\[official\s*audio\]/gi,
      /\(lyrics?\s*(video)?\)/gi,
      /\[lyrics?\s*(video)?\]/gi,
      /\(audio\)/gi,
      /\[audio\]/gi,
      /\(hd\)/gi,
      /\[hd\]/gi,
      /\(4k\)/gi,
      /\[4k\]/gi,
      /\(visualizer\)/gi,
      /\(lyric\s*video\)/gi,
      /karaoke\s*(songs?)?/gi,
      /\d{4}\s*remaster(ed)?/gi,
      /\(full\s*(song|audio|video)\)/gi,
      /\[full\s*(song|audio|video)\]/gi,
    ];

    let cleaned = rawTitle;
    for (const pattern of NOISE) {
      cleaned = cleaned.replace(pattern, "");
    }
    cleaned = cleaned.trim();

    // Pattern 1: "Artist - Title"
    const dashMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashMatch) {
      const left = dashMatch[1].trim();
      const right = dashMatch[2].trim();

      // Messy titles like "Sub Kuchh Seekha Humne - Mukesh - Anari - Raj Kapoor"
      // have multiple dashes — in that case the first segment is the song title
      // and the rest is noise we don't need
      const rightHasAnotherDash = /[-–—]/.test(right);
      if (rightHasAnotherDash) {
        // Take only the first segment after the dash as artist
        const firstPart = right.split(/\s*[-–—]\s*/)[0];
        return { title: left, artist: firstPart.trim() };
      }

      return { title: right, artist: left };
    }

    // Pattern 2: "Title | Artist"
    const pipeMatch = cleaned.match(/^(.+?)\s*\|\s*(.+)$/);
    if (pipeMatch) {
      return {
        title: pipeMatch[1].trim(),
        artist: pipeMatch[2].trim(),
      };
    }

    // Pattern 3: No clear separator — use title as-is, channel as artist
    return { title: cleaned, artist: channelArtist };
  }
}
