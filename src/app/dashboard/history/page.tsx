import styles from "./page.module.css";

// Placeholder type — replace with real DB query later
interface TransferJob {
  id: string;
  from: string;
  to: string;
  playlist: string;
  matched: number;
  total: number;
  status: "completed" | "partial" | "failed";
  date: string;
}

const EMPTY: TransferJob[] = [];

export default function HistoryPage() {
  const jobs = EMPTY;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>History</span>
        <h1 className={styles.title}>Past transfers</h1>
        <p className={styles.subtitle}>
          Every transfer you've run, with match results.
        </p>
      </div>

      {jobs.length === 0 ? (
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
          </div>
          {jobs.map((job) => (
            <div key={job.id} className={styles.tableRow}>
              <span className={styles.playlistName}>{job.playlist}</span>
              <span className={styles.route}>
                {job.from} → {job.to}
              </span>
              <span className={styles.matched}>
                {job.matched}/{job.total}
              </span>
              <span className={`${styles.status} ${styles[job.status]}`}>
                {job.status}
              </span>
              <span className={styles.date}>{job.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}