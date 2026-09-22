"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { TranferJobSummary } from "@/lib/types/domain";

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "short",
    timeStyle: "short",
  });
}
export default function HistoryPage() {
  const [jobs, setJobs] = useState<TranferJobSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // A flag to prevent setting state if the component unmounts during the API call
    let isMounted = true;

    async function fetchJobs() {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(`/api/history`);

        if (!res.ok) {
          throw new Error(`Failed to fetch history (${res.status})`);
        }

        const data = await res.json();

        if (isMounted) {
          setJobs(data.jobs || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchJobs();

    // Clean-up function sets the flag to false if user leaves the page early
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>History</span>
        <h1 className={styles.title}>Past transfers</h1>
        <p className={styles.subtitle}>
          Every transfer you've run, with match results.
        </p>
      </div>

      {/* 3. Handle loading state cleanly */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Loading your transfers...</p>
        </div>
      ) : error ? (
        /* 4. Handle error state cleanly */
        <div className={styles.emptyState}>
          <span
            className={styles.emptyIcon}
            style={{ color: "var(--error-color, #ef4444)" }}
          >
            ⚠️
          </span>
          <p className={styles.emptyText}>Something went wrong</p>
          <p className={styles.emptySubtext}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.emptyLink}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            Try again ↻
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⟳</span>
          <p className={styles.emptyText}>No transfers yet</p>
          <p className={styles.emptySubtext}>
            Once you run a transfer it'll appear here with full match results.
          </p>
          <a href="/dashboard/transfer" className={styles.emptyLink}>
            Start your first transfer →
          </a>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Playlist</span>
            <span>From → To</span>
            <span>Matched</span>
            <span>Status</span>
            <span>Date</span>
            <span>Remarks</span>
          </div>
          {jobs.map((job) => (
            <div key={job.jobId} className={styles.tableRow}>
              <span className={styles.playlistName}>{job?.playlistName}</span>
              <span className={styles.historyPlatforms}>
                <span className={styles.platformTag}>{job.sourcePlatform}</span>
                <span className={styles.historyArrow}>→</span>
                <span className={styles.platformTag}>
                  {job.destinationPlatform}
                </span>
              </span>
              <span className={styles.matched}>
                {job.matchedCount}/{job.totalTracks}
              </span>
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
              <span className={styles.date}>{formatDate(job.createdAt)}</span>
              <span className={styles.date}>{job.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
