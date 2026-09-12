"use client";

import { useEffect, useState } from "react";
import styles from "./steps.module.css";
import type { TransferState } from "../page";

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  image?: string;
  images?: Object[]; // For Spotify playlists, which have an array of images
}

interface Props {
  transfer: TransferState;
  onSelect: (playlist: Playlist) => void;
  onBack: () => void;
}

export default function StepPickPlaylist({
  transfer,
  onSelect,
  onBack,
}: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/playlists?platform=${transfer.sourcePlatform}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPlaylists(
            data.playlists.map((p: any) => ({
              id: p.providerId || p.id,
              name: p.name,
              trackCount: p.trackCount,
              image: p.imageUrl,
              images: p.images, // For YT playlists, which have an array of images
            })),
          );
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load playlists. Check your connection.");
        setLoading(false);
      });
  }, [transfer.sourcePlatform]);

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Pick a playlist</h2>
      <p className={styles.stepSubtitle}>
        Choosing from{" "}
        <strong className={styles.highlight}>{transfer.sourcePlatform}</strong>.
      </p>

      {loading && <p className={styles.stateText}>Loading your playlists…</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && playlists.length === 0 && (
        <p className={styles.stateText}>No playlists found on this account.</p>
      )}

      {!loading && !error && playlists.length > 0 && (
        <div className={styles.playlistGrid}>
          {playlists.map((p) => (
            <button
              key={p.id}
              className={styles.playlistCard}
              onClick={() => onSelect(p)}
              type="button"
            >
              {Array.isArray(p.images) ? (
                <img
                  src={p?.images[0]?.url}
                  alt={p.name}
                  className={styles.playlistImage}
                />
              ) : p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className={styles.playlistImage}
                />
              ) : (
                <div className={styles.playlistImagePlaceholder} />
              )}
              <div className={styles.playlistInfo}>
                <span className={styles.playlistName}>{p.name}</span>
                <span className={styles.playlistCount}>
                  {p.trackCount} tracks
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <button className={styles.backButton} onClick={onBack} type="button">
        ← Back
      </button>
    </div>
  );
}
