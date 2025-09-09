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

  const getEventDotClass = (eventType) => {
    if (eventType?.includes('Initiate Ritual')) return styles.dotPurple;
    if (eventType?.includes('Start Ritual')) return styles.dotBlue;
    if (eventType?.includes('Posted Transcripts')) return styles.dotGreen;
    if (eventType?.includes('Posted Aggregations')) return styles.dotGreen;
    return styles.dotGray;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No transactions recorded yet</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {transactions.map((tx, index) => {
        const eventType = tx.description || tx.eventName || 'Transaction';
        const dotClass = getEventDotClass(eventType);
        
        return (
          <div key={index} className={styles.timelineCard}>
            <div className={`${styles.cardIndicator} ${dotClass}`}></div>
            
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.eventLeft}>
                  <div className={`${styles.eventDot} ${dotClass}`}></div>
                  <span className={styles.eventTitle}>{eventType}</span>
                </div>
                <span className={styles.eventTime}>
                  {formatDateTime(tx.timestamp)}
                </span>
              </div>
              
              <div className={styles.cardDetails}>
                {tx.txHash && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tx Hash:</span>
                    <a 
                      href={`https://polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.detailValue}
                    >
                      {formatTxHash(tx.txHash)}
                    </a>
                  </div>
                )}
                
                {tx.from && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>From:</span>
                    <a 
                      href={`https://polygonscan.com/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.detailValue}
                    >
                      {formatAddress(tx.from)}
                    </a>
                  </div>
                )}
                
                {tx.to && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>To:</span>
                    <a 
                      href={`https://polygonscan.com/address/${tx.to}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.detailValue}
                    >
                      {formatAddress(tx.to)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormationTimeline;