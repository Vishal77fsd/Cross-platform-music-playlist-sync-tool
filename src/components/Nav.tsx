import Link from "next/link";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.wordmark}>
        music-migrate
      </Link>
      <div className={styles.links}>
        <Link href="/login" className={styles.loginLink}>
          Log in
        </Link>
        <Link href="/signup" className={styles.signupButton}>
          Sign up
        </Link>
      </div>
    </nav>
  );
}
