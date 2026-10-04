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
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    async function fetchJobs() {
      try {
        setIsLoading(true);
        setError("");

        // Pass the current page state to your API endpoint
        const res = await fetch(`/api/history?page=${currentPage}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch history (${res.status})`);
        }

        const data = await res.json();

        if (isMounted) {
          // Adjust paths based on your actual backend response body mapping
          setJobs(data.jobs?.data || []);
          setTotalPages(data.jobs?.meta?.totalPages || 1);
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

    return () => {
      isMounted = false;
    };
  }, [currentPage]); // Re-fetch whenever the page changes

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>History</span>
        <h1 className={styles.title}>Past transfers</h1>
        <p className={styles.subtitle}>
          Every transfer you've run, with match results.
        </p>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Loading your transfers...</p>
        </div>
      ) : error ? (
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
            onClick={() => setCurrentPage(1)}
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
        <>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Playlist</span>
              <span>From → To</span>
              <span>Matched</span>
              <span>Status</span>
              <span>Date</span>
              <span>Remarks</span>
            </div>
            {jobs.map((job, index) => (
              <div key={index} className={styles.tableRow}>
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

          {/* Pagination Controls UI Wrapper */}
          <div className={styles.paginationWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            
            <span style={{ fontSize: '0.95rem' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
