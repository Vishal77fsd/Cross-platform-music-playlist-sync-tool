import Link from "next/link";
import Nav from "@/components/Nav";
import TransferVisual from "@/components/TransferVisual";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Nav />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>
            Your playlists shouldn&apos;t be stuck on one platform.
          </h1>
          <p className={styles.heroSub}>
            Connect two music accounts, pick a playlist, and music-migrate
            matches every track on the other side — by exact recording
            where it can, by title and artist where it has to.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryCta}>
              Get started free
            </Link>
            <Link href="/login" className={styles.secondaryCta}>
              I already have an account
            </Link>
          </div>
        </div>

        <TransferVisual />
      </section>

      <section className={styles.steps}>
        <h2 className={styles.sectionLabel}>How a transfer works</h2>
        <ol className={styles.stepList}>
          <li>
            <span className={styles.stepIndex}>01</span>
            <div>
              <h3>Connect both accounts</h3>
              <p>Sign in to your source and destination platforms. We only ever ask for playlist access, never your password.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepIndex}>02</span>
            <div>
              <h3>Pick a playlist</h3>
              <p>Choose any playlist from the source account and see every track listed before anything moves.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepIndex}>03</span>
            <div>
              <h3>Review the matches</h3>
              <p>We build the playlist on the other platform and flag anything we couldn&apos;t confidently match, so you decide what to do with it.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.platforms}>
        <h2 className={styles.sectionLabel}>Works with</h2>
        <div className={styles.platformList}>
          <span className={styles.platformBadge}>Spotify</span>
          <span className={styles.platformBadge}>YouTube Music</span>
          <span className={styles.platformBadgeMuted}>More on the way</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>music-migrate</span>
        <span className={styles.footerDim}>Built for moving playlists, not building lock-in.</span>
      </footer>
    </div>
  );
}
