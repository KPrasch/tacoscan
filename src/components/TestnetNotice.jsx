import React from 'react';
import { getCurrentNetwork } from '../utils/dataSource';
import styles from './TestnetNotice.module.css';

const TestnetNotice = () => {
  const network = getCurrentNetwork();

  // Only show for testnets
  if (network === 'mainnet' || network === 'polygon') {
    return null;
  }

  const networkNames = {
    lynx: 'Lynx Testnet',
    tapir: 'Tapir Testnet'
  };

  const networkName = networkNames[network] || network;

  return (
    <div className={styles.testnetBanner} data-network={network}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>{networkName}</span>
          <span className={styles.message}>
            Connected to {networkName}. Data indexed via Goldsky subgraphs.
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestnetNotice;