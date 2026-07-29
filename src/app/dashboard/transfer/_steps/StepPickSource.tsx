import styles from "./steps.module.css";

const PLATFORMS = [
  {
    id: "spotify",
    name: "Spotify",
    dot: "#1db954",
    description: "Transfer from your Spotify playlists.",
  },
  {
    id: "ytmusic",
    name: "YouTube Music",
    dot: "#ff0033",
    description: "Transfer from your YouTube Music library.",
  },
];

interface Props {
  onSelect: (platform: string) => void;
}

export default function StepPickSource({ onSelect }: Props) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Where are you transferring from?</h2>
      <p className={styles.stepSubtitle}>
        Pick the platform that has the playlist you want to move.
      </p>

      <div className={styles.platformGrid}>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            className={styles.platformCard}
            onClick={() => onSelect(p.id)}
            type="button"
          >
            <span className={styles.platformDot} style={{ background: p.dot }} />
            <span className={styles.platformName}>{p.name}</span>
            <span className={styles.platformDesc}>{p.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}