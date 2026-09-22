import styles from "./TransferVisual.module.css";

/**
 * The page's signature element: three playlist rows, each with a small
 * marker that visually sits on the "from" side and is mid-transit toward
 * the "to" side, with a trailing dashed path. This dramatizes the real
 * product mechanic — individual tracks moving and being matched across
 * platforms — instead of an abstract music-note illustration.
 */
export default function TransferVisual() {
  const rows = [
    { title: "Night Drive", artist: "Inner Tide", progress: 0.82 },
    { title: "Static Bloom", artist: "Hollow Wires", progress: 0.55 },
    { title: "Low Country", artist: "Pale Fields", progress: 0.3 },
  ];

  return (
    <div className={styles.wrap} role="img" aria-label="Three tracks shown migrating from one platform to another">
      <div className={styles.columnLabels}>
        <span>Spotify</span>
        <span>YouTube</span>
      </div>
      {rows.map((row) => (
        <div className={styles.row} key={row.title}>
          <div className={styles.meta}>
            <span className={styles.title}>{row.title}</span>
            <span className={styles.artist}>{row.artist}</span>
          </div>
          <div className={styles.track}>
            <div className={styles.trackLine} />
            <div className={styles.trackFill} style={{ width: `${row.progress * 100}%` }} />
            <div
              className={styles.marker}
              style={{ left: `${row.progress * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
