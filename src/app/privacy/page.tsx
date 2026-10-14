import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how music-migrate collects, uses, and protects account and playlist data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>
          music-migrate
        </Link>
        <Link href="/" className={styles.backLink}>
          Back to home
        </Link>
      </header>

      <article className={styles.policy}>
        <p className={styles.eyebrow}>Legal</p>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: October 14, 2026</p>
        <p className={styles.intro}>
          This Privacy Policy explains how music-migrate (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) handles information when you use
          our website and playlist-transfer service. We use information only
          to provide, maintain, and protect the service you request.
        </p>

        <section>
          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> your name, email address,
              and a password hash when you create an account. We do not store
              your account password in readable form.
            </li>
            <li>
              <strong>Connected music-service information:</strong> when you
              connect a supported service, we receive account identifiers,
              authorization tokens, and the playlist and track information
              needed to carry out the transfer you request. We do not receive
              your Spotify, Google, or other music-service password.
            </li>
            <li>
              <strong>Transfer information:</strong> the selected playlist
              identifiers and names, transfer status and counts, and details
              of tracks that could not be matched. This lets us run transfers,
              show their results, and provide transfer history.
            </li>
            <li>
              <strong>Technical information:</strong> our hosting and
              infrastructure providers may process standard request and
              security logs, such as IP address, browser or device
              information, and request timestamps, to operate and protect the
              service.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use information</h2>
          <p>We use the information above to:</p>
          <ul>
            <li>create and secure your account and keep you signed in;</li>
            <li>connect to music services you choose and transfer playlists;</li>
            <li>show transfer progress, results, and unmatched tracks;</li>
            <li>troubleshoot issues, prevent abuse, and protect the service;</li>
            <li>respond to requests you send to our privacy contact.</li>
          </ul>
          <p>
            We do not sell personal information or use connected playlist
            information for advertising.
          </p>
        </section>

        <section>
          <h2>Music-service connections</h2>
          <p>
            Connecting an account is optional. You authorize the selected
            provider directly and can revoke that authorization through the
            provider&apos;s account settings. We use the resulting access
            credentials only to provide the features you request, such as
            reading playlists and creating or updating a destination playlist.
            We store provider tokens in our application database for those
            purposes; we do not currently encrypt them at the application
            layer.
          </p>
          <p>
            At the time of this update, music-migrate supports connections to
            Spotify and YouTube/YouTube Music. Amazon Music connectivity is
            not currently available. If we add it, access to Amazon Music
            information will require your authorization and will be used only
            to provide the music-transfer features you request, under this
            policy.
          </p>
          <p>
            Music services process information under their own privacy
            policies and terms. We are not responsible for their independent
            data practices.
          </p>
        </section>

        <section>
          <h2>Cookies and similar technology</h2>
          <p>
            We use a necessary, httpOnly session cookie to keep you signed in.
            It expires after seven days. We do not currently use advertising
            cookies or analytics cookies. The site also loads web fonts from
            Google Fonts, which may receive technical connection information
            from your browser when those fonts are requested.
          </p>
        </section>

        <section>
          <h2>When we share information</h2>
          <p>
            We share information only as needed to operate the service:
          </p>
          <ul>
            <li>
              with the music provider you connect, to retrieve or create
              playlists at your direction;
            </li>
            <li>
              with hosting, database, and background-job providers that help
              us run the website and process transfers, subject to their
              service terms and safeguards;
            </li>
            <li>
              when required by law, to respond to valid legal process, or to
              protect the rights, safety, and security of users and the
              service.
            </li>
          </ul>
          <p>We do not otherwise disclose your personal information.</p>
        </section>

        <section>
          <h2>Retention and deletion</h2>
          <p>
            We keep account information while your account is active. We keep
            connected-service tokens while needed to provide the connection
            and transfer features, and transfer records while needed to show
            your transfer history and maintain the service. You may ask us to
            delete your account information and associated transfer data by
            emailing the address below. We will delete or de-identify
            information that is no longer needed, except where retention is
            required by law or reasonably necessary for security, dispute
            resolution, or legitimate service operations. Revoking a
            provider&apos;s authorization does not itself delete information
            already stored by music-migrate; contact us to request deletion.
          </p>
        </section>

        <section>
          <h2>Security</h2>
          <p>
            We use reasonable administrative and technical safeguards to
            protect information. No method of transmission or storage is
            completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Children&apos;s privacy</h2>
          <p>
            music-migrate is not intended for children under 13, and we do not
            knowingly collect personal information from children under 13. If
            you believe a child has provided us information, contact us so we
            can review and remove it.
          </p>
        </section>

        <section>
          <h2>Your choices and privacy rights</h2>
          <p>
            You can stop using the service, revoke a connected provider&apos;s
            authorization in that provider&apos;s settings, or request access
            to, correction of, or deletion of your information by contacting
            us. Depending on where you live, you may have additional privacy
            rights. We will respond to verified requests as required by
            applicable law.
          </p>
        </section>

        <section>
          <h2>International processing</h2>
          <p>
            We and the providers that help operate the service may process
            information in countries other than the one where you live. Those
            countries may have different data-protection laws.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy when the service or our practices
            change. We will post the revised policy on this page and update
            the date above. Material changes will be communicated through the
            service where appropriate.
          </p>
        </section>

        <section>
          <h2>Contact us</h2>
          <p>
            For privacy questions or requests, contact{" "}
            <a href="mailto:vishal77fed@gmail.com">vishal77fed@gmail.com</a>.
          </p>
        </section>
      </article>

      <footer className={styles.footer}>
        <span>© music-migrate</span>
        <Link href="/">Home</Link>
      </footer>
    </main>
  );
}
