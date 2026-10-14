import Link from "next/link";
import Nav from "@/components/Nav";
import TransferVisual from "@/components/TransferVisual";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Free to use · No credit card required
          </div>
          <h1>
            Your playlists shouldn&apos;t be stuck on one platform.
          </h1>
          <p className={styles.heroSub}>
            music-migrate moves your playlists between Spotify and YouTube
            in minutes — matching every track by exact recording where it
            can, by title and artist where it has to. Nothing gets left
            behind without you knowing.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryCta}>
              Move my playlists →
            </Link>
            <Link href="/login" className={styles.secondaryCta}>
              I already have an account
            </Link>
          </div>
          <p className={styles.heroNote}>
            Takes about 2 minutes to connect your accounts. A 50-track
            playlist transfers in under 30 seconds.
          </p>
        </div>

        <TransferVisual />
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>95%</span>
          <span className={styles.statLabel}>Average match rate</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>&lt; 30s</span>
          <span className={styles.statLabel}>Per 50-track playlist</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>2</span>
          <span className={styles.statLabel}>Platforms supported</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Tracks silently dropped</span>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className={styles.steps}>
        <span className={styles.sectionLabel}>How it works</span>
        <h2 className={styles.sectionTitle}>
          Three steps. No spreadsheets.
        </h2>
        <ol className={styles.stepList}>
          <li>
            <span className={styles.stepIndex}>01</span>
            <div>
              <h3>Connect both platforms</h3>
              <p>
                Sign in to your source and destination platforms via
                OAuth — we ask only for playlist access, never your
                password. Your credentials never touch our servers.
              </p>
            </div>
          </li>
          <li>
            <span className={styles.stepIndex}>02</span>
            <div>
              <h3>Pick a playlist to move</h3>
              <p>
                Browse all your playlists and pick the one you want
                transferred. See the full track list before anything moves.
                No surprises.
              </p>
            </div>
          </li>
          <li>
            <span className={styles.stepIndex}>03</span>
            <div>
              <h3>Review matches and confirm</h3>
              <p>
                We find every track on the destination platform and flag
                anything we couldn&apos;t match with confidence — so you
                decide what to do with the edge cases, not us.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ── Why music-migrate ────────────────────────────────────────────── */}
      <section className={styles.why}>
        <span className={styles.sectionLabel}>Why music-migrate</span>
        <h2 className={styles.sectionTitle}>
          Built differently from other tools.
        </h2>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <span className={styles.whyIcon}>⟳</span>
            <h3>Nothing silently dropped</h3>
            <p>
              Most tools skip unmatched tracks without telling you. We
              show you every track that didn&apos;t make it and why, so
              your playlist is complete or you know exactly what&apos;s
              missing.
            </p>
          </div>
          <div className={styles.whyCard}>
            <span className={styles.whyIcon}>◎</span>
            <h3>ISRC matching first</h3>
            <p>
              Tracks have an International Standard Recording Code — a
              unique fingerprint for each recording. We match on that
              first, before falling back to title and artist, so covers
              and live versions don&apos;t get confused with originals.
            </p>
          </div>
          <div className={styles.whyCard}>
            <span className={styles.whyIcon}>⚡</span>
            <h3>Concurrent, not sequential</h3>
            <p>
              Instead of searching for tracks one at a time, we run
              searches in parallel batches. A 100-track playlist that
              would take two minutes sequentially finishes in under
              thirty seconds.
            </p>
          </div>
          <div className={styles.whyCard}>
            <span className={styles.whyIcon}>⬡</span>
            <h3>Pluggable by design</h3>
            <p>
              The platform adapter architecture means adding Apple Music,
              Tidal, or Deezer is a matter of writing one new adapter —
              not rewiring the whole app. More platforms are coming.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platforms ────────────────────────────────────────────────────── */}
      <section className={styles.platforms}>
        <span className={styles.sectionLabel}>Works with</span>
        <h2 className={styles.sectionTitle}>Supported platforms</h2>
        <div className={styles.platformGrid}>
          <div className={styles.platformCard}>
            <span
              className={styles.platformCardDot}
              style={{ background: "#1db954" }}
            />
            <div className={styles.platformCardBody}>
              <span className={styles.platformCardName}>Spotify</span>
              <span className={styles.platformCardDesc}>
                Read and write playlists via OAuth
              </span>
            </div>
            <span className={styles.platformCardBadge}>Live</span>
          </div>
          <div className={styles.platformCard}>
            <span
              className={styles.platformCardDot}
              style={{ background: "#ff0033" }}
            />
            <div className={styles.platformCardBody}>
              <span className={styles.platformCardName}>YouTube</span>
              <span className={styles.platformCardDesc}>
                Full library access via YouTube Data API
              </span>
            </div>
            <span className={styles.platformCardBadge}>Live</span>
          </div>
          <div className={`${styles.platformCard} ${styles.platformCardSoon}`}>
            <span
              className={styles.platformCardDot}
              style={{ background: "#fc3c44" }}
            />
            <div className={styles.platformCardBody}>
              <span className={styles.platformCardName}>Apple Music</span>
              <span className={styles.platformCardDesc}>
                MusicKit integration in progress
              </span>
            </div>
            <span className={styles.platformCardBadgeSoon}>Soon</span>
          </div>
          <div className={`${styles.platformCard} ${styles.platformCardSoon}`}>
            <span
              className={styles.platformCardDot}
              style={{ background: "#01FF9B" }}
            />
            <div className={styles.platformCardBody}>
              <span className={styles.platformCardName}>Tidal</span>
              <span className={styles.platformCardDesc}>
                HiFi library transfer planned
              </span>
            </div>
            <span className={styles.platformCardBadgeSoon}>Soon</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className={styles.faq}>
        <span className={styles.sectionLabel}>FAQ</span>
        <h2 className={styles.sectionTitle}>Common questions</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQ}>
              Does music-migrate store my Spotify or YouTube password?
            </h3>
            <p className={styles.faqA}>
              Never. We use OAuth — you log in directly on Spotify or
              Google&apos;s own pages and grant us a limited access token.
              We store that token (encrypted) to make API calls on your
              behalf. We never see or store your password.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQ}>
              What happens to tracks that don&apos;t match?
            </h3>
            <p className={styles.faqA}>
              After the transfer, we show you a full list of every track
              that couldn&apos;t be found on the destination platform.
              The playlist is still created with everything that did match
              — nothing is silently dropped.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQ}>
              Does it handle large playlists?
            </h3>
            <p className={styles.faqA}>
              Yes. Transfers run as background jobs — you don&apos;t need
              to keep the tab open. We paginate through playlists of any
              size and search in parallel batches, so even a 500-track
              library playlist finishes in a few minutes.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQ}>
              Will it transfer playlist order and metadata?
            </h3>
            <p className={styles.faqA}>
              Yes — tracks are added to the destination playlist in the
              same order as the source. The playlist name and description
              are also carried over.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQ}>Is it free?</h3>
            <p className={styles.faqA}>
              Yes, completely free while we&apos;re in early access. We
              may introduce limits or a paid tier for very large libraries
              in the future, but core transfers will always have a free
              option.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>
          Ready to move your music?
        </h2>
        <p className={styles.finalCtaSub}>
          Connect your accounts in two minutes. Your playlists follow you
          wherever you go.
        </p>
        <Link href="/signup" className={styles.primaryCta}>
          Get started free →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerWordmark}>music-migrate</span>
          <span className={styles.footerDim}>
            Built for moving playlists, not building lock-in.
          </span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/login" className={styles.footerLink}>Log in</Link>
          <Link href="/signup" className={styles.footerLink}>Sign up</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}