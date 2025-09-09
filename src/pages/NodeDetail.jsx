import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNodeDetail, getTimeout } from './data';
import { formatString, formatWeiDecimal, formatTimeToText } from './data';
import styles from './NodeDetail.module.css';

const NodeDetail = () => {
  const { address } = useParams();
  const [loading, setLoading] = useState(true);
  const [nodeData, setNodeData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const data = await getNodeDetail(address);
        if (data) {
          const formatted = formatNodeDetail(data);
          
          // Also fetch rituals for this node and timeout value
          try {
            const [ritualsResponse, timeout] = await Promise.all([
              fetch('https://gateway-arbitrum.network.thegraph.com/api/f49026e5653284c96b9798f93567eaa1/subgraphs/id/6VFbgC6JWwPQkqCxdVDNSieW8bwLdoVBtimVm3F2WV86', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: `
                    query GetRitualsForNode($node: String!) {
                      rituals(where: { participants_contains: [$node] }, first: 100) {
                        id
                        initTimestamp
                        endTimestamp
                        authority
                        dkgSize
                        dkgStatus
                        participants
                      }
                    }
                  `,
                  variables: { node: address.toLowerCase() }
                })
              }),
              getTimeout()
            ]);
            
            const ritualsData = await ritualsResponse.json();
            if (ritualsData?.data?.rituals) {
              const timeoutMs = parseFloat(timeout) * 1000;
              const currentTimestamp = Date.now();
              
              formatted.rituals = ritualsData.data.rituals.map(r => {
                const initTimestampMs = parseInt(r.initTimestamp) * 1000;
                const timeoutStamp = initTimestampMs + timeoutMs;
                
                // Determine status based on dkgStatus and timeout
                let status;
                if (r.dkgStatus === 'SUCCESSFUL') {
                  status = 'SUCCESSFUL';
                } else if (r.dkgStatus === 'DKG_RITUAL_FINALIZED') {
                  status = 'FINALIZED';
                } else if (r.dkgStatus === 'DKG_INVALID' || r.dkgStatus === 'INVALID') {
                  status = 'INVALID';
                } else if ((r.dkgStatus === 'DKG_AWAITING_AGGREGATIONS' || 
                            r.dkgStatus === 'DKG_AWAITING_TRANSCRIPTS') && 
                           timeoutStamp < currentTimestamp) {
                  status = 'EXPIRED';
                } else if (r.dkgStatus === 'DKG_TIMEOUT' || r.dkgStatus === 'TIMEOUT') {
                  status = 'TIMEOUT';
                } else {
                  status = 'PENDING';
                }
                
                return {
                  id: r.id,
                  status: status,
                  authority: r.authority,
                  participants: r.dkgSize,
                  updateTime: (r.endTimestamp || r.initTimestamp) ? parseInt(r.endTimestamp || r.initTimestamp) * 1000 : Date.now()
                };
              });
            }
          } catch (err) {
            console.error('Error fetching rituals:', err);
          }
          
          setNodeData(formatted);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching node details:', error);
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [address]);

  const formatNodeDetail = (data) => {
    if (!data || !data.appAuthorization) return null;
    
    const auth = data.appAuthorization;
    const stakingProvider = auth.id?.split('-')[0] || address;
    
    // Use BigInt for accurate wei to token conversion
    const formatAmount = (weiAmount) => {
      if (!weiAmount) return 0;
      try {
        const wei = BigInt(weiAmount.toString());
        const divisor = BigInt('1000000000000000000'); // 10^18
        return Number(wei / divisor);
      } catch {
        return 0;
      }
    };
    
    // Check if node is deauthorized (had stake before but now has 0)
    const hasBeenDeauthorized = auth.stake?.stakeHistory?.some(event => 
      event.eventType === 'Unstaked' || event.eventType === 'AuthorizationDecreaseApproved'
    );
    
    // Get the last staked amount from history if current is 0
    const getHistoricalStake = () => {
      if (auth.stake?.stakeHistory) {
        const stakedEvents = auth.stake.stakeHistory.filter(e => e.eventType === 'Staked');
        if (stakedEvents.length > 0) {
          return formatAmount(stakedEvents[0].eventAmount);
        }
      }
      return 0;
    };
    
    return {
      id: stakingProvider,
      operator: auth.tacoOperator?.operator || '-',
      isConfirmed: auth.tacoOperator?.confirmed || false,
      authorizedAmount: formatAmount(auth.amount),
      stakedAmount: formatAmount(auth.stake?.stakedAmount),
      historicalStake: getHistoricalStake(),
      isDeauthorized: hasBeenDeauthorized && formatAmount(auth.amount) === 0,
      bondedAt: auth.tacoOperator?.bondedTimestamp ? new Date(auth.tacoOperator.bondedTimestamp * 1000) : null,
      events: [...(data.appAuthHistories || []), ...(auth.stake?.stakeHistory || [])].map(event => ({
        type: event.eventType,
        amount: event.eventAmount || event.amount,
        timestamp: event.timestamp ? parseInt(event.timestamp) * 1000 : Date.now(),
        blockNumber: event.blockNumber,
        txHash: event.txHash || null
      })).sort((a, b) => b.timestamp - a.timestamp),
      stakeHistory: auth.stake?.stakeHistory || [],
      rituals: []
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading node details...</div>
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Node not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section - Etherscan Style */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Node Operator</h1>
            <div className={styles.badge}>
              {nodeData.isDeauthorized ? (
                <span className={styles.deauthorizedBadge}>Deauthorized</span>
              ) : nodeData.isConfirmed ? (
                <span className={styles.confirmedBadge}>✓ Confirmed</span>
              ) : (
                <span className={styles.unconfirmedBadge}>Unconfirmed</span>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.addressSection}>
          <span className={styles.addressLabel}>Staking Provider:</span>
          <span className={styles.address}>{address}</span>
          <button 
            className={styles.copyButton}
            onClick={() => copyToClipboard(address)}
            title="Copy address"
          >
            📋
          </button>
          <a 
            href={`https://polygonscan.com/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.etherscanLink}
          >
            View on Polygonscan ↗
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Authorized Amount</div>
          <div className={styles.statValue}>
            {new Intl.NumberFormat().format(nodeData.authorizedAmount)} T
          </div>
          <div className={styles.statSubtext} style={{ color: nodeData.isDeauthorized ? '#059669' : undefined }}>
            {nodeData.stakedAmount > 0 
              ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(1)}% of stake`
              : nodeData.isDeauthorized ? 'Deauthorized' : '-'
            }
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Staked Amount</div>
          <div className={styles.statValue}>
            {new Intl.NumberFormat().format(nodeData.stakedAmount)} T
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Operator Address</div>
          <div className={styles.statValue}>
            {nodeData.operator && nodeData.operator !== '-' ? (
              <a 
                href={`https://polygonscan.com/address/${nodeData.operator}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.operatorLink}
              >
                {formatString(nodeData.operator)}
              </a>
            ) : (
              '-'
            )}
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bonded Since</div>
          <div className={styles.statValue}>
            {nodeData.bondedAt ? formatTimeToText(nodeData.bondedAt.getTime()) : 'Not bonded'}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rituals' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('rituals')}
          >
            DKG Rituals
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Node Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status:</span>
                    <span className={styles.infoValue}>
                      {nodeData.isDeauthorized ? (
                        <span className={styles.statusInactive}>Deauthorized</span>
                      ) : nodeData.isConfirmed ? (
                        <span className={styles.statusActive}>Active</span>
                      ) : (
                        <span className={styles.statusInactive}>Inactive</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Network:</span>
                    <span className={styles.infoValue}>Polygon</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Protocol:</span>
                    <span className={styles.infoValue}>TACo</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Authorization Status:</span>
                    <span className={styles.infoValue}>
                      {nodeData.isDeauthorized ? 'Deauthorized' : (nodeData.authorizedAmount > 0 ? 'Authorized' : 'Not Authorized')}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Staking Details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Total Staked:</span>
                    <span className={styles.infoValue}>{new Intl.NumberFormat().format(nodeData.stakedAmount)} T</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Authorized to TACo:</span>
                    <span className={styles.infoValue}>{new Intl.NumberFormat().format(nodeData.authorizedAmount)} T</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Authorization Rate:</span>
                    <span className={styles.infoValue}>
                      {nodeData.stakedAmount > 0 
                        ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(2)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rituals' && (
            <div className={styles.ritualsContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Ritual ID</th>
                      <th>Status</th>
                      <th>Authority</th>
                      <th>Participants</th>
                      <th>Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.rituals.length > 0 ? (
                      nodeData.rituals.map(ritual => (
                        <tr key={ritual.id}>
                          <td>
                            <Link to={`/ritual/${ritual.id}`} className={styles.idLink}>
                              #{ritual.id}
                            </Link>
                          </td>
                          <td>
                            <span className={`${styles.status} ${styles[ritual.status?.toLowerCase()]}`}>
                              {ritual.status}
                            </span>
                          </td>
                          <td>
                            <a 
                              href={`https://polygonscan.com/address/${ritual.authority}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.addressLink}
                            >
                              {formatString(ritual.authority)}
                            </a>
                          </td>
                          <td>{ritual.participants || 0}</td>
                          <td>{formatTimeToText(ritual.updateTime)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className={styles.noData}>No rituals found for this node</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className={styles.eventsContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Time</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeData.events.length > 0 ? (
                      nodeData.events.map((event, idx) => {
                        // Format amount using BigInt for accuracy
                        const formatEventAmount = (amount) => {
                          if (!amount) return '0';
                          try {
                            const wei = BigInt(amount.toString());
                            const divisor = BigInt('1000000000000000000');
                            const tokens = Number(wei / divisor);
                            return new Intl.NumberFormat().format(tokens);
                          } catch {
                            return '0';
                          }
                        };
                        
                        return (
                          <tr key={idx}>
                            <td className={styles.eventType}>{event.type || 'Unknown'}</td>
                            <td>{event.amount ? `${formatEventAmount(event.amount)} T` : '-'}</td>
                            <td>{formatTimeToText(event.timestamp)}</td>
                            <td>
                              {event.blockNumber ? (
                                <a 
                                  href={`https://polygonscan.com/block/${event.blockNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.txLink}
                                >
                                  Block #{event.blockNumber}
                                </a>
                              ) : (
                                <span className={styles.pending}>Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className={styles.noData}>No events found for this node</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;