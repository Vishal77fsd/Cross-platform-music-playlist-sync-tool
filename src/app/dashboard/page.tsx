import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Overview</span>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>
          Connect your platforms and start moving playlists.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Connected platforms */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Connected platforms</h2>
          <div className={styles.platformList}>
            <div className={styles.platformRow}>
              <div className={styles.platformInfo}>
                <span className={styles.platformDot} style={{ background: "#1db954" }} />
                <span className={styles.platformName}>Spotify</span>
              </div>
              <span className={styles.platformStatus}>Not connected</span>
            </div>
            <div className={styles.platformRow}>
              <div className={styles.platformInfo}>
                <span className={styles.platformDot} style={{ background: "#ff0033" }} />
                <span className={styles.platformName}>YouTube Music</span>
              </div>
              <span className={styles.platformStatus}>Not connected</span>
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
            Pick a source playlist and destination platform — we'll match
            every track on the other side.
          </p>
          <a href="/dashboard/transfer" className={styles.ctaButton}>
            New transfer
          </a>
        </div>

        {/* Recent activity */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <h2 className={styles.cardTitle}>Recent transfers</h2>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⟳</span>
            <p className={styles.emptyText}>No transfers yet.</p>
            <p className={styles.emptySubtext}>
              Your completed and in-progress transfers will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}