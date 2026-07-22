import Link from "next/link";
import styles from "./layout.module.css";
import DashboardNav from "@/components/DashboardNav";
import LogoutButton from "@/components/LogoutButton";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.wordmark}>
          music-migrate
        </Link>

        <DashboardNav />

        <div className={styles.bottom}>
          <LogoutButton />
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;