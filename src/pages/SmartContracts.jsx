import React, { useState, useMemo } from 'react';
import styles from './SmartContracts.module.css';
import mainnetArtifacts from '../artifacts/mainnet.json';
import lynxArtifacts from '../artifacts/lynx.json';
import tapirArtifacts from '../artifacts/tapir.json';

const SmartContracts = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContracts, setExpandedContracts] = useState({});

  // TACo domains encompass multiple blockchains
  const networks = {
    mainnet: {
      name: 'Mainnet Domain',
      data: mainnetArtifacts,  // Contains both Ethereum (1) and Polygon (137)
      color: '#059669',
      chains: {
        '1': { name: 'Ethereum', explorer: 'https://etherscan.io' },
        '137': { name: 'Polygon', explorer: 'https://polygonscan.com' }
      }
    },
    lynx: {
      name: 'Lynx Testnet',
      data: lynxArtifacts,
      color: '#FBBf24',
      chains: {
        '11155111': { name: 'Ethereum Sepolia', explorer: 'https://sepolia.etherscan.io' },
        '80002': { name: 'Polygon Amoy', explorer: 'https://amoy.polygonscan.com' }
      }
    },
    tapir: {
      name: 'Tapir Testnet',
      data: tapirArtifacts,
      color: '#8B5CF6',
      chains: {
        '11155111': { name: 'Ethereum Sepolia', explorer: 'https://sepolia.etherscan.io' },
        '80002': { name: 'Polygon Amoy', explorer: 'https://amoy.polygonscan.com' }
      }
    }
  };

  const parseContracts = (artifacts, networkConfig) => {
    const contracts = [];
    
    // Parse contracts from all chains in the domain
    Object.entries(artifacts).forEach(([chainId, chainData]) => {
      // Skip if not a valid chain object
      if (!chainData || typeof chainData !== 'object') return;
      
      const chainInfo = networkConfig.chains?.[chainId];
      if (!chainInfo) return; // Skip unknown chains
      
      Object.entries(chainData).forEach(([contractName, contractDetails]) => {
        // Skip if not a contract object
        if (!contractDetails || typeof contractDetails !== 'object' || !contractDetails.address) return;
        
        contracts.push({
          name: contractName,
          address: contractDetails.address,
          type: determineContractType(contractName),
          abi: contractDetails.abi || [],
          deployBlock: contractDetails.block || null,
          version: contractDetails.version || null,
          chainId: chainId,
          chainName: chainInfo.name,
          explorer: chainInfo.explorer
        });
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
    return parseContracts(network.data, network);
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
              <span className={styles.chainId}>
                {Object.values(network.chains).map(chain => chain.name).join(' + ')}
              </span>
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
          <span className={styles.statLabel}>Domain</span>
          <span className={styles.statValue} style={{ color: networks[selectedNetwork].color }}>
            {networks[selectedNetwork].name}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Chains</span>
          <span className={styles.statValue}>
            {Object.keys(networks[selectedNetwork].chains).length} 
            {Object.keys(networks[selectedNetwork].chains).length === 1 ? ' Chain' : ' Chains'}
          </span>
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
                  <div className={styles.contractInfo}>
                    <h3 className={styles.contractName}>{contract.name}</h3>
                    <div className={styles.contractMeta}>
                      <span className={styles.contractType}>{contract.type}</span>
                      <span className={styles.contractChain}>{contract.chainName}</span>
                    </div>
                  </div>
                  <div className={styles.contractActions}>
                    {contract.address && (
                      <a
                        href={`${contract.explorer}/address/${contract.address}`}
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
                    Copy
                  </button>
                </div>
              )}

              {expandedContracts[contract.name] && (
                <div className={styles.contractDetails}>
                  {contract.deployBlock && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Deploy Block:</span>
                      <a
                        href={`${contract.explorer}/block/${contract.deployBlock}`}
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
                                <div className={styles.methodInfo}>
                                  <span className={styles.methodName}>{func.name}</span>
                                  <span className={styles.methodType}>
                                    {func.stateMutability || 'nonpayable'}
                                  </span>
                                </div>
                                <button
                                  className={styles.copyFunctionBtn}
                                  onClick={() => copyToClipboard(JSON.stringify(func, null, 2))}
                                  title="Copy function ABI"
                                >
                                  Copy
                                </button>
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