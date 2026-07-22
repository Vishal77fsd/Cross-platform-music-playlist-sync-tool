"use client";

import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import styles from "./page.module.css";

const platforms = [
  {
    id: "spotify",
    name: "Spotify",
    dot: "#1db954",
    description: "Connect to read and write your Spotify playlists.",
  },
  {
    id: "ytmusic",
    name: "YouTube Music",
    dot: "#ff0033",
    description: "Connect to access your YouTube Music library.",
  },
  {
    id: "youtube",
    name: "YouTube",
    dot: "#ff0033",
    description:
      "Extract tracks from any public YouTube playlist — no account needed.",
  },
];

function handleConnectClick(platform: (typeof platforms)[number]) {
  const state = crypto.randomUUID();

  // 1. Save the state locally so you can verify it when the user returns
  sessionStorage.setItem("oauth_state", state);

  if (platform.id === "spotify") {
    const spotifyProvider = new SpotifyProvider();
    const redirectUrl = spotifyProvider.getAuthorizationUrl(state);

    // 2. Redirect the current tab entirely
    window.location.href = redirectUrl;
  }
}
export default function PlatformsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Platforms</span>
        <h1 className={styles.title}>Connected platforms</h1>
        <p className={styles.subtitle}>
          Connect at least two platforms to start transferring playlists.
        </p>
      </div>

      <div className={styles.list}>
        {platforms.map((p) => (
          <div key={p.id} className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.dot} style={{ background: p.dot }} />
              <div className={styles.meta}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.description}>{p.description}</span>
              </div>
            </div>
            <div className={styles.cardRight}>
              {p.id === "youtube" ? (
                <span className={styles.publicBadge}>Public playlists</span>
              ) : (
                <>
                  <span className={styles.statusBadge}>Not connected</span>
                  <button
                    className={styles.connectButton}
                    type="button"
                    onClick={() => handleConnectClick(p)}
                  >
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.note}>
        More platforms coming soon — Apple Music, Tidal, Deezer.
      </p>
    </div>
  );
}
