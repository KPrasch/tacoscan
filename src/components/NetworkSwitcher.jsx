import React from 'react';
import styles from './NetworkSwitcher.module.css';

const NetworkSwitcher = () => {
  const currentHost = window.location.hostname;
  
  // Determine current network based on subdomain
  const getCurrentNetwork = () => {
    if (currentHost.includes('lynx')) return 'lynx';
    if (currentHost.includes('tapir')) return 'tapir';
    return 'mainnet';
  };
  
  const currentNetwork = getCurrentNetwork();
  
  const networks = [
    {
      name: 'Lynx',
      url: 'https://lynx.tacoscan.io',
      color: '#FBBf24',
      description: 'Lynx Testnet'
    },
    {
      name: 'Tapir',
      url: 'https://tapir.tacoscan.io', 
      color: '#8B5CF6',
      description: 'Tapir Testnet'
    }
  ];
  
  const handleNetworkSwitch = (url) => {
    window.location.href = url;
  };
  
  // Don't show on testnet pages
  if (currentNetwork !== 'mainnet') {
    return null;
  }
  
  return (
    <div className={styles.networkSwitcher}>
      <div className={styles.label}>Testnets:</div>
      {networks.map((network) => (
        <button
          key={network.name}
          className={styles.networkButton}
          onClick={() => handleNetworkSwitch(network.url)}
          title={network.description}
          style={{
            '--network-color': network.color
          }}
        >
          <span className={styles.dot} style={{ backgroundColor: network.color }} />
          {network.name}
        </button>
      ))}
    </div>
  );
};

export default NetworkSwitcher;