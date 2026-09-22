"use client";

import { Suspense, useEffect, useState } from "react";
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
    dot: "#ff6b6b",
    description:
      "Extract tracks from any public YouTube playlist — no account needed.",
  },
];

type ConnectedMap = Record<string, boolean>;

async function handleConnectClick(platformId: string) {
  if (platformId === "spotify") {
    const res = await fetch("/api/auth/spotify/connect");
    const { url, state } = await res.json();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
  }

  if (platformId === "ytmusic") {
    const res = await fetch("/api/auth/ytmusic/connect");
    const { url, state } = await res.json();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
  }
}

async function handleDisconnectClick(platformId: string) {
  await fetch(`/api/accounts?platform=${platformId}`, { method: "DELETE" });
  // Reload to reflect the change
  window.location.reload();
}

function PlatformsPageInner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  const [connectedMap, setConnectedMap] = useState<ConnectedMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        setConnectedMap(data.connected ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Platforms</span>
        <h1 className={styles.title}>Connected platforms</h1>
        <p className={styles.subtitle}>
          Connect at least two platforms to start transferring playlists.
        </p>
      </div>

      {connected && (
        <div className={styles.successBanner}>
          🎉 {connected.charAt(0).toUpperCase() + connected.slice(1)} connected
          successfully.
        </div>
      )}
      {error === "access_denied" && (
        <div className={styles.errorBanner}>You denied access. Try again.</div>
      )}
      {error === "token_exchange_failed" && (
        <div className={styles.errorBanner}>
          Something went wrong. Please try again.
        </div>
      )}

      <div className={styles.list}>
        {platforms.map((p) => {
          const isConnected = p.id === "youtube" ? true : connectedMap[p.id];

          return (
            <div
              key={p.id}
              className={`${styles.card} ${isConnected ? styles.cardConnected : ""}`}
            >
              <div className={styles.cardLeft}>
                <span className={styles.dot} style={{ background: p.dot }} />
                <div className={styles.meta}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{p.name}</span>
                    {!loading && isConnected && p.id !== "youtube" && (
                      <span className={styles.connectedBadge}>● Connected</span>
                    )}
                  </div>
                  <span className={styles.description}>{p.description}</span>
                </div>
              </div>

              <div className={styles.cardRight}>
                {p.id === "youtube" ? (
                  <span className={styles.publicBadge}>Public playlists</span>
                ) : loading ? (
                  <span className={styles.statusBadge}>Checking...</span>
                ) : isConnected ? (
                  <button
                    className={styles.disconnectButton}
                    type="button"
                    onClick={() => handleDisconnectClick(p.id)}
                  >
                    Disconnect
                  </button>
                ) : (
                  <>
                    <span className={styles.statusBadge}>Not connected</span>
                    <button
                      className={styles.connectButton}
                      type="button"
                      onClick={() => handleConnectClick(p.id)}
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.note}>
        More platforms coming soon — Apple Music, Tidal, Deezer.
      </p>
    </div>
  );
}

export default function PlatformsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlatformsPageInner />
    </Suspense>
  );
}