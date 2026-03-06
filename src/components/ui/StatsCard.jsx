import React from 'react';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, subtitle, loading = false, tooltip }) => {
  return (
    <div className={styles.statsCard} title={tooltip}>
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