import React from 'react';
import styles from './FormationTimeline.module.css';

const FormationTimeline = ({ transactions = [] }) => {
  const formatTxHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getDotClass = (eventType) => {
    if (eventType?.includes('Initiate Ritual')) return styles.dotPurple;
    if (eventType?.includes('Start Ritual')) return styles.dotBlue;
    if (eventType?.includes('Posted Transcripts')) return styles.dotGreen;
    if (eventType?.includes('Posted Aggregations')) return styles.dotGreen;
    return styles.dotGray;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className={styles.emptyState}>No transactions recorded</div>
    );
  }

  return (
    <div className={styles.timeline}>
      {transactions.map((tx, index) => {
        const eventType = tx.description || tx.eventName || 'Transaction';
        const dotClass = getDotClass(eventType);

        return (
          <div key={index} className={styles.timelineRow}>
            <div className={`${styles.dot} ${dotClass}`} />
            <span className={styles.eventName}>{eventType}</span>
            {tx.txHash ? (
              <a
                href={`https://polygonscan.com/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                {formatTxHash(tx.txHash)}
              </a>
            ) : <span />}
            {tx.from ? (
              <span className={styles.addressText}>{formatAddress(tx.from)}</span>
            ) : <span />}
            <span className={styles.eventTime}>{formatDateTime(tx.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default FormationTimeline;
