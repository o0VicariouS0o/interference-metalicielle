import styles from './SiteBackground.module.css';

export function SiteBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.base} />

      <div className={styles.memoryTexture} />

      <div className={styles.documentGrid} />

      <div className={styles.lightLayer} />

      <div className={styles.vignette} />

      <div className={styles.noise} />
    </div>
  );
}