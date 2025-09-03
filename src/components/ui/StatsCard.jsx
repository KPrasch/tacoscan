import React from 'react';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, subtitle, loading = false }) => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>
        {loading ? (
          <span className={styles.loading}>Loading...</span>
        ) : (
          value
        )}
      </div>
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
    </div>
  );
};

export default StatsCard;