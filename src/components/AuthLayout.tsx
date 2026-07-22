import Link from "next/link";
import styles from "./AuthLayout.module.css";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerPrompt: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

/**
 * Shared shell for the login and signup pages: wordmark, headline,
 * the form itself (passed as children), and a footer link to switch
 * between the two. Keeping this as one component means login/signup
 * can never visually drift apart by accident.
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkLabel,
  footerLinkHref,
}: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.wordmark}>
          music-migrate
        </Link>

        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {children}

        <p className={styles.footerPrompt}>
          {footerPrompt}{" "}
          <Link href={footerLinkHref} className={styles.footerLink}>
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
