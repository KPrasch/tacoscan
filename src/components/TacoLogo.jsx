import React from 'react';
import styles from './TacoLogo.module.css';

const TacoLogo = ({ showText = true }) => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoBox}>
        <span className={styles.logoLetter}>T</span>
      </div>
      {showText && (
        <span className={styles.logoText}>
          <span className={styles.taco}>TACo</span>
          <span className={styles.scan}>SCAN</span>
        </span>
      )}
    </div>
  );
};

export default TacoLogo;