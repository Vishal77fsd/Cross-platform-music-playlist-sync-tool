"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { TranferJobSummary } from "@/lib/types/domain";

interface ConnectedAccounts {
  spotify?: boolean;
  ytmusic?: boolean;
}

export default function DashboardPage() {
  const [connectAccounts, setConnectedAccounts] = useState<ConnectedAccounts>(
    {},
  );
  const [transferHistory, setTransferHistory] = useState<TranferJobSummary[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  async function getAccount() {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await res.json();
      setConnectedAccounts(data.connected || {});
    } catch (err) {
      console.error("Something went wrong:", err);
      setError("Could not load your connected platforms.");
    }
  }

  async function getTransferHistory() {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) {
        throw new Error("Failed to fetch transfer history");
      }
      const data = await res.json();
      setTransferHistory(data.jobs.slice(0, 5));
    } catch (err) {
      console.error("Something went wrong:", err);
      setError("Could not load tranfer history.");
    }
  }
  useEffect(() => {
    getAccount();
    getTransferHistory();
  }, []);
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Overview</span>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>
          Connect your platforms and start moving playlists.
        </p>
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.grid}>
        {/* Connected platforms */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Connected platforms</h2>
          <div className={styles.platformList}>
            <div className={styles.platformRow}>
              <div className={styles.platformInfo}>
                <span
                  className={styles.platformDot}
                  style={{ background: "#1db954" }}
                />
                <span className={styles.platformName}>Spotify</span>
              </div>
              <span className={styles.platformStatus}>
                {connectAccounts?.spotify ? `Connected` : `Not connected`}
              </span>
            </div>
            <div className={styles.platformRow}>
              <div className={styles.platformInfo}>
                <span
                  className={styles.platformDot}
                  style={{ background: "#ff0033" }}
                />
                <span className={styles.platformName}>YouTube Music</span>
              </div>
              <span className={styles.platformStatus}>
                {connectAccounts?.ytmusic ? `Connected` : `Not connected`}
              </span>
            </div>
          </div>
          <a href="/dashboard/platforms" className={styles.cardLink}>
            Manage platforms →
          </a>
        </div>

        {/* Quick start */}
        <div className={`${styles.card} ${styles.cardAccent}`}>
          <h2 className={styles.cardTitle}>Start a transfer</h2>
          <p className={styles.cardText}>
            Pick a source playlist and destination platform — we'll match every
            track on the other side.
          </p>
          <a href="/dashboard/transfer" className={styles.ctaButton}>
            New transfer
          </a>
        </div>

        {/* Recent activity */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <h2 className={styles.cardTitle}>Recent transfers</h2>
          {transferHistory.length == 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⟳</span>
              <p className={styles.emptyText}>No transfers yet.</p>
              <p className={styles.emptySubtext}>
                Your completed and in-progress transfers will appear here.
              </p>
            </div>
          ) : (
            <div className={styles.historyTable}>
              <div className={styles.historyHeader}>
                <span>Platforms</span>
                <span>Tracks</span>
                <span>Match rate</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              {transferHistory.map((job) => (
                <div key={job.jobId} className={styles.historyRow}>
                  <div className={styles.historyPlatforms}>
                    <span className={styles.platformTag}>
                      {job.sourcePlatform}
                    </span>
                    <span className={styles.historyArrow}>→</span>
                    <span className={styles.platformTag}>
                      {job.destinationPlatform}
                    </span>
                  </div>
                  <span className={styles.historyTracks}>
                    {job.matchedCount}/{job.totalTracks}
                  </span>
                  <div className={styles.historyMatchWrap}>
                    <div className={styles.historyMatchBar}>
                      <div
                        className={styles.historyMatchFill}
                        style={{ width: `${job.totalTracks}%` }}
                      />
                    </div>
                    <span className={styles.historyMatchPercent}>
                      {job.matchedCount}%
                    </span>
                  </div>
                  <span
                    className={`${styles.historyStatus} ${
                      job.status === "completed"
                        ? styles.statusCompleted
                        : job.status === "failed"
                          ? styles.statusFailed
                          : job.status === "running"
                            ? styles.statusRunning
                            : styles.statusPending
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className={styles.historyDate}>
                    {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              <a href="/dashboard/history" className={styles.cardLink}>
                View all transfers →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
