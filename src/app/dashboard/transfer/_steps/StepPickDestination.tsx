import styles from "./steps.module.css";
import type { TransferState } from "../page";

const PLATFORMS = [
  { id: "spotify", name: "Spotify", dot: "#1db954" },
  { id: "ytmusic", name: "YouTube Music", dot: "#ff0033" },
];

interface Props {
  transfer: TransferState;
  onSelect: (platform: string) => void;
  onBack: () => void;
}

export default function StepPickDestination({ transfer, onSelect, onBack }: Props) {
  const destinations = PLATFORMS.filter((p) => p.id !== transfer.sourcePlatform);

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Where are you transferring to?</h2>
      <p className={styles.stepSubtitle}>
        We'll recreate{" "}
        <strong className={styles.highlight}>{transfer.playlistName}</strong>{" "}
        on the platform you pick.
      </p>

      <div className={styles.platformGrid}>
        {destinations.map((p) => (
          <button
            key={p.id}
            className={styles.platformCard}
            onClick={() => onSelect(p.id)}
            type="button"
          >
            <span className={styles.platformDot} style={{ background: p.dot }} />
            <span className={styles.platformName}>{p.name}</span>
          </button>
        ))}
      </div>

      <button className={styles.backButton} onClick={onBack} type="button">
        ← Back
      </button>
    </div>
  );
}   