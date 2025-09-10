import React, { useState, useMemo } from 'react';
import styles from './SmartContracts.module.css';
import mainnetArtifacts from '../artifacts/mainnet.json';
import lynxArtifacts from '../artifacts/lynx.json';
import tapirArtifacts from '../artifacts/tapir.json';

const SmartContracts = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContracts, setExpandedContracts] = useState({});

  const networks = {
    mainnet: {
      name: 'Polygon Mainnet',
      data: mainnetArtifacts['137'] || {},  // Use Polygon chain (137)
      chainId: 137,
      explorer: 'https://polygonscan.com',
      color: '#059669'
    },
    lynx: {
      name: 'Lynx Testnet',
      data: lynxArtifacts['80002'] || lynxArtifacts,  // Amoy testnet
      chainId: 80002,
      explorer: 'https://amoy.polygonscan.com',
      color: '#FBBf24'
    },
    tapir: {
      name: 'Tapir Testnet',
      data: tapirArtifacts['80002'] || tapirArtifacts,  // Amoy testnet
      chainId: 80002,
      explorer: 'https://amoy.polygonscan.com',
      color: '#8B5CF6'
    }
  };

  const parseContracts = (artifacts) => {
    const contracts = [];
    
    // Now artifacts is the chain-specific data directly
    Object.entries(artifacts).forEach(([contractName, contractDetails]) => {
      // Skip if not a contract object
      if (!contractDetails || typeof contractDetails !== 'object' || !contractDetails.address) return;
      
      contracts.push({
        name: contractName,
        address: contractDetails.address,
        type: determineContractType(contractName),
        abi: contractDetails.abi || [],
        deployBlock: contractDetails.block || null,
        version: contractDetails.version || null
      });
    });

    return contracts;
  };

  const determineContractType = (name) => {
    // Categorize contracts by their name
    if (name.includes('Application') || name.includes('TACoApplication')) {
      return 'Application';
    } else if (name.includes('Coordinator')) {
      return 'Coordinator';
    } else if (name.includes('Root') || name.includes('Child')) {
      return 'Bridge';
    } else if (name.includes('AllowList')) {
      return 'Access Control';
    } else if (name.includes('Fee') || name.includes('Subscription')) {
      return 'Fee Model';
    } else if (name.includes('Slasher') || name.includes('Infraction')) {
      return 'Security';
    } else if (name.includes('Dispatcher') || name.includes('Registry')) {
      return 'Registry';
    } else {
      return 'Core Contract';
    }
  };

  const contractsData = useMemo(() => {
    const network = networks[selectedNetwork];
    return parseContracts(network.data);
  }, [selectedNetwork]);

  const filteredContracts = useMemo(() => {
    if (!searchTerm) return contractsData;
    
    return contractsData.filter(contract => 
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contractsData, searchTerm]);

  const toggleContract = (contractName) => {
    setExpandedContracts(prev => ({
      ...prev,
      [contractName]: !prev[contractName]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadABI = (contract) => {
    const dataStr = JSON.stringify(contract.abi, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contract.name}_ABI.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Smart Contracts</h1>
        <p className={styles.subtitle}>
          Explore TACo protocol smart contracts across different networks
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.networkTabs}>
          {Object.entries(networks).map(([key, network]) => (
            <button
              key={key}
              className={`${styles.networkTab} ${selectedNetwork === key ? styles.active : ''}`}
              onClick={() => setSelectedNetwork(key)}
              style={{
                borderColor: selectedNetwork === key ? network.color : 'transparent',
                color: selectedNetwork === key ? network.color : undefined
              }}
            >
              <span className={styles.networkName}>{network.name}</span>
              <span className={styles.chainId}>Chain ID: {network.chainId}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search contracts by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button 
              className={styles.clearButton}
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Contracts</span>
          <span className={styles.statValue}>{contractsData.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Network</span>
          <span className={styles.statValue} style={{ color: networks[selectedNetwork].color }}>
            {networks[selectedNetwork].name}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Explorer</span>
          <a 
            href={networks[selectedNetwork].explorer}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.explorerLink}
          >
            {selectedNetwork === 'mainnet' ? 'Polygonscan' : 'Amoy Testnet'}
          </a>
        </div>
      </div>

      <div className={styles.contractsList}>
        {filteredContracts.length > 0 ? (
          filteredContracts.map((contract, index) => (
            <div key={index} className={styles.contractCard}>
              <div 
                className={styles.contractHeader}
                onClick={() => toggleContract(contract.name)}
              >
                <div className={styles.contractMain}>
                  <h3 className={styles.contractName}>{contract.name}</h3>
                  <span className={styles.contractType}>{contract.type}</span>
                </div>
                <div className={styles.contractActions}>
                  {contract.address && (
                    <a
                      href={`${networks[selectedNetwork].explorer}/address/${contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewButton}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Explorer ↗
                    </a>
                  )}
                  <button 
                    className={styles.expandButton}
                    aria-label={expandedContracts[contract.name] ? "Collapse" : "Expand"}
                  >
                    {expandedContracts[contract.name] ? '−' : '+'}
                  </button>
                </div>
              </div>

              {contract.address && (
                <div className={styles.contractAddress}>
                  <span className={styles.addressLabel}>Address:</span>
                  <code className={styles.addressValue}>{contract.address}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(contract.address)}
                    title="Copy address"
                  >
                    📋
                  </button>
                </div>
              )}

              {expandedContracts[contract.name] && (
                <div className={styles.contractDetails}>
                  {contract.deployBlock && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Deploy Block:</span>
                      <a
                        href={`${networks[selectedNetwork].explorer}/block/${contract.deployBlock}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blockLink}
                      >
                        {contract.deployBlock}
                      </a>
                    </div>
                  )}
                  
                  {contract.version && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Version:</span>
                      <span className={styles.detailValue}>{contract.version}</span>
                    </div>
                  )}

                  {contract.abi && contract.abi.length > 0 && (
                    <div className={styles.abiSection}>
                      <div className={styles.abiHeader}>
                        <span className={styles.abiLabel}>
                          ABI ({contract.abi.length} {contract.abi.length === 1 ? 'method' : 'methods'})
                        </span>
                        <button
                          className={styles.downloadButton}
                          onClick={() => downloadABI(contract)}
                        >
                          Download ABI
                        </button>
                      </div>
                      <div className={styles.abiPreview}>
                        <div className={styles.methodsList}>
                          {contract.abi
                            .filter(item => item.type === 'function')
                            .slice(0, 10)
                            .map((func, idx) => (
                              <div key={idx} className={styles.methodItem}>
                                <span className={styles.methodName}>{func.name}</span>
                                <span className={styles.methodType}>
                                  {func.stateMutability || 'nonpayable'}
                                </span>
                              </div>
                            ))}
                          {contract.abi.filter(item => item.type === 'function').length > 10 && (
                            <div className={styles.moreIndicator}>
                              ... and {contract.abi.filter(item => item.type === 'function').length - 10} more functions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <p>No contracts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartContracts;