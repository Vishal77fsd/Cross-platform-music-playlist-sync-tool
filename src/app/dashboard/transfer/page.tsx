import styles from "./page.module.css";

export default function TransferPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Transfer</span>
        <h1 className={styles.title}>New transfer</h1>
        <p className={styles.subtitle}>
          Choose a source playlist and where you want it moved.
        </p>
      </div>

      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepNumber}>01</div>
          <div className={styles.stepBody}>
            <h2 className={styles.stepTitle}>Connect your platforms</h2>
            <p className={styles.stepText}>
              You need at least two platforms connected before you can transfer.
            </p>
            <a href="/dashboard/platforms" className={styles.stepLink}>
              Connect platforms →
            </a>
          </div>
        </div>

        <div className={`${styles.step} ${styles.stepLocked}`}>
          <div className={styles.stepNumber}>02</div>
          <div className={styles.stepBody}>
            <h2 className={styles.stepTitle}>Pick a playlist</h2>
            <p className={styles.stepText}>
              Choose which playlist to move and from which platform.
            </p>
          </div>
        </div>

        <div className={`${styles.step} ${styles.stepLocked}`}>
          <div className={styles.stepNumber}>03</div>
          <div className={styles.stepBody}>
            <h2 className={styles.stepTitle}>Choose destination</h2>
            <p className={styles.stepText}>
              Pick which platform to move it to. We'll match every track.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}