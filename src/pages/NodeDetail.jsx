import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNodeDetail } from './data';
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
    if (!data) return null;
    
    const stakingProvider = data.id?.split('-')[0] || address;
    return {
      id: stakingProvider,
      operator: data.tacoOperator?.operator || '-',
      isConfirmed: data.tacoOperator?.confirmed || false,
      authorizedAmount: parseFloat(data.amount) || 0,
      stakedAmount: parseFloat(data.stake?.stakedAmount) || 0,
      bondedAt: data.tacoOperator?.bondedTimestamp ? new Date(data.tacoOperator.bondedTimestamp * 1000) : null,
      events: data.events || [],
      rituals: data.rituals || []
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
              {nodeData.isConfirmed ? (
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
            {formatWeiDecimal(nodeData.authorizedAmount)} T
          </div>
          <div className={styles.statSubtext}>
            {nodeData.stakedAmount > 0 
              ? `${((nodeData.authorizedAmount / nodeData.stakedAmount) * 100).toFixed(1)}% of stake`
              : '-'
            }
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Staked Amount</div>
          <div className={styles.statValue}>
            {formatWeiDecimal(nodeData.stakedAmount)} T
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Operator Address</div>
          <div className={styles.statValue}>
            <Link to={`/address/${nodeData.operator}`} className={styles.operatorLink}>
              {formatString(nodeData.operator)}
            </Link>
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
                      {nodeData.isConfirmed ? (
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
                      {nodeData.authorizedAmount > 0 ? 'Authorized' : 'Not Authorized'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Staking Details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Total Staked:</span>
                    <span className={styles.infoValue}>{formatWeiDecimal(nodeData.stakedAmount)} T</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Authorized to TACo:</span>
                    <span className={styles.infoValue}>{formatWeiDecimal(nodeData.authorizedAmount)} T</span>
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
                          <td>{formatString(ritual.authority)}</td>
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
                      nodeData.events.map((event, idx) => (
                        <tr key={idx}>
                          <td className={styles.eventType}>{event.type}</td>
                          <td>{event.amount ? `${formatWeiDecimal(event.amount)} T` : '-'}</td>
                          <td>{formatTimeToText(event.timestamp)}</td>
                          <td>
                            <a 
                              href={`https://polygonscan.com/tx/${event.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.txLink}
                            >
                              {formatString(event.txHash)}
                            </a>
                          </td>
                        </tr>
                      ))
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