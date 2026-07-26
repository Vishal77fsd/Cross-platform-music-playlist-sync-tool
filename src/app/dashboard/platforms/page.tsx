"use client";
import { useSearchParams } from "next/navigation";
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

async function handleConnectClick(platform: (typeof platforms)[number]) {
  if (platform.id === "spotify") {
    // Get the auth URL from our API route — SpotifyProvider stays server-side
    const res = await fetch("/api/auth/spotify/connect");
    const { url, state } = await res.json();
    console.log("spotify url", url, state);
    // Save state to verify when Spotify redirects back
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
    return;
  }
  if (platform.id === "ytmusic") {
    // Get the auth URL from our API route — YouTubeProvider stays server-side
    const res = await fetch("/api/auth/ytmusic/connect");
    const { url, state } = await res.json();
    console.log("ytmusic url", url, state);
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
    return;
  }
}
export default function PlatformsPage() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Platforms</span>
        <h1 className={styles.title}>Connected platforms</h1>
        <p className={styles.subtitle}>
          Connect at least two platforms to start transferring playlists.
        </p>
      </div>

      {/* Connection feedback banners */}
      {connected && (
        <div className={styles.successBanner}>
          🎉 {connected.charAt(0).toUpperCase() + connected.slice(1)} connected
          successfully.
        </div>
      )}
      {error === "access_denied" && (
        <div className={styles.errorBanner}>
          You denied access. Connect a platform to continue.
        </div>
      )}
      {error === "token_exchange_failed" && (
        <div className={styles.errorBanner}>
          Something went wrong connecting. Please try again.
        </div>
      )}
      
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
