import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Data from './data';
import styles from './RitualDetail.module.css';
import Loader from '../components/loader';
import { RitualManagement } from '../components/RitualManagement';
import FormationTimeline from '../components/FormationTimeline';

const RitualDetail = () => {
  const { id } = useParams();
  const [ritual, setRitual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchRitualData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching ritual with ID:", id);
        
        const data = await Data.getRituals(true, id);
        
        if (data?.rituals && data.rituals.length > 0) {
          const timeout = await Data.getTimeout();
          const formattedRitual = Data.formatRitualsData(data.rituals, timeout)[0];
          
          // Fetch feeModel for the specific ritual detail view
          const feeModel = await Data.getRitualFeeModel(id);
          formattedRitual.feeModel = feeModel;
          
          // Don't add duplicate initiation transaction - the real one with txHash is already in the data
          
          setRitual(formattedRitual);
        } else {
          console.log("No ritual found with ID:", id);
          setRitual(null);
        }
      } catch (error) {
        console.error("Error fetching ritual details:", error);
        setRitual(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRitualData();
    }
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'ACTIVE': '#96FF5E',
      'SUCCESSFUL': '#10B981',
      'DKG AWAITING TRANSCRIPTS': '#FBBf24',
      'DKG AWAITING AGGREGATIONS': '#3B82F6',
      'EXPIRED': '#6B7280',
      'TIME OUT': '#EF4444'
    };
    return statusMap[status?.toUpperCase()] || '#6B7280';
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loader />
        </div>
      </div>
    );
  }

  if (!ritual) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>Ritual Not Found</h2>
          <p>The ritual with ID #{id} could not be found.</p>
          <Link to="/rituals" className={styles.backLink}>← Back to Rituals</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>
                DKG Ritual <span className={styles.ritualId}>#{ritual.id}</span>
                {ritual.totalParticipants <= 3 && (
                  <span style={{
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: '#6B7280',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.025em',
                    marginLeft: '12px',
                    verticalAlign: 'middle'
                  }}>
                    Heartbeat
                  </span>
                )}
              </h1>
              <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(ritual.status) }}>
                {ritual.status}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'participants' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants ({ritual.totalParticipants})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'formation' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('formation')}
          >
            Formation
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'subscription' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'authorizations' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('authorizations')}
          >
            Authorizations
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'handovers' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('handovers')}
          >
            Handovers
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              {/* Main Info Card */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Ritual Information</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Ritual ID:</span>
                  <span className={styles.value}>{ritual.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Authority:</span>
                  <div className={styles.addressValue}>
                    <a 
                      href={`https://polygonscan.com/address/${ritual.authority}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.addressLink}
                    >
                      {ritual.authority}
                    </a>
                    <button 
                      onClick={() => copyToClipboard(ritual.authority)}
                      className={styles.copyBtn}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>
                {/* Authority is the v2 native field (replaces legacy initiator) */}
                <div className={styles.infoRow}>
                  <span className={styles.label}>Status:</span>
                  <span className={styles.value}>
                    <span className={styles.statusDot} style={{ backgroundColor: getStatusColor(ritual.status) }}></span>
                    {ritual.status}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Created:</span>
                  <span className={styles.value}>
                    {new Date(ritual.initTimeStamp).toLocaleString()}
                  </span>
                </div>
                {ritual.endTimeStamp > 0 && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Ended:</span>
                    <span className={styles.value}>
                      {new Date(ritual.endTimeStamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* DKG Parameters Card */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>DKG Parameters</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Threshold:</span>
                  <span className={styles.value}>{ritual.threshold}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>DKG Size:</span>
                  <span className={styles.value}>{ritual.dkgSize}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Total Participants:</span>
                  <span className={styles.value}>{ritual.totalParticipants}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Transcripts Posted:</span>
                  <span className={styles.value}>
                    {ritual.totalPostedTranscripts} / {ritual.totalParticipants}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Aggregations Posted:</span>
                  <span className={styles.value}>
                    {ritual.totalPostedAggregations} / {ritual.totalParticipants}
                  </span>
                </div>
              </div>

              {/* Access Control Card */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Access Control</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Access Controller:</span>
                  <div className={styles.addressValue}>
                    {ritual.accessController ? (
                      <>
                        <a 
                          href={`https://polygonscan.com/address/${ritual.accessController}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.addressLink}
                        >
                          {ritual.accessController}
                        </a>
                        <button 
                          onClick={() => copyToClipboard(ritual.accessController)}
                          className={styles.copyBtn}
                          title="Copy address"
                        >
                          📋
                        </button>
                      </>
                    ) : (
                      <span className={styles.nullValue}>Not Set</span>
                    )}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Fee Model:</span>
                  <div className={styles.addressValue}>
                    {ritual.feeModel ? (
                      <>
                        <a 
                          href={`https://polygonscan.com/address/${ritual.feeModel}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.addressLink}
                        >
                          {ritual.feeModel}
                        </a>
                        <button 
                          onClick={() => copyToClipboard(ritual.feeModel)}
                          className={styles.copyBtn}
                          title="Copy address"
                        >
                          📋
                        </button>
                      </>
                    ) : (
                      <span className={styles.nullValue}>Not Set</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Public Key Card */}
              {ritual.publicKey && (
                <div className={styles.infoCard}>
                  <h3 className={styles.cardTitle}>Public Key</h3>
                  <div className={styles.publicKeyWrapper}>
                    <code className={styles.publicKey}>{ritual.publicKey}</code>
                    <button 
                      onClick={() => copyToClipboard(ritual.publicKey)}
                      className={styles.copyBtn}
                      title="Copy public key"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className={styles.participantsSection}>
              <table className={styles.participantsTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participant Address</th>
                    <th>Operator Address</th>
                    <th>Transcript</th>
                    <th>Aggregation</th>
                  </tr>
                </thead>
                <tbody>
                  {ritual.participants?.map((participant, index) => {
                    const hasTranscript = ritual.transcripts?.includes(participant);
                    const hasAggregation = ritual.aggregations?.includes(participant);
                    const operatorAddress = ritual.operatorAddresses?.[participant];
                    
                    return (
                      <tr key={participant}>
                        <td>{index + 1}</td>
                        <td>
                          <Link to={`/address/${participant}`} className={styles.addressLink}>
                            {formatAddress(participant)}
                          </Link>
                        </td>
                        <td>
                          {operatorAddress && operatorAddress !== '-' ? (
                            <Link to={`/address/${operatorAddress}`} className={styles.addressLink}>
                              {formatAddress(operatorAddress)}
                            </Link>
                          ) : (
                            <span className={styles.nullValue}>-</span>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusIcon} ${hasTranscript ? styles.success : styles.pending}`}>
                            {hasTranscript ? '✓' : '○'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusIcon} ${hasAggregation ? styles.success : styles.pending}`}>
                            {hasAggregation ? '✓' : '○'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'formation' && (
            <div className={styles.timelineSection}>
              <h3 className={styles.sectionTitle}>Formation History</h3>
              <FormationTimeline transactions={ritual.transactions || []} />
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className={styles.timelineSection}>
              <RitualManagement ritual={ritual} defaultTab="subscription" />
            </div>
          )}

          {activeTab === 'authorizations' && (
            <div className={styles.timelineSection}>
              <RitualManagement ritual={ritual} defaultTab="encryptors" />
            </div>
          )}

          {activeTab === 'handovers' && (
            <div className={styles.timelineSection}>
              <h3 className={styles.sectionTitle}>Participant Handovers</h3>
              {ritual.handovers && ritual.handovers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Departing</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Incoming</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Requested</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Finalized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ritual.handovers.map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #F3F4F6' }}>
                          <Link to={`/address/${h.departingParticipant}`} className={styles.addressLink}>
                            {formatAddress(h.departingParticipant)}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #F3F4F6' }}>
                          <Link to={`/address/${h.incomingParticipant}`} className={styles.addressLink}>
                            {formatAddress(h.incomingParticipant)}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #F3F4F6' }}>
                          <span style={{
                            color: h.status === 'FINALIZED' ? '#10B981' : h.status === 'CANCELED' ? '#EF4444' : '#F59E0B',
                            fontWeight: 500
                          }}>
                            {h.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}>
                          {h.requestedAt ? new Date(parseInt(h.requestedAt) * 1000).toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}>
                          {h.finalizedAt ? new Date(parseInt(h.finalizedAt) * 1000).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#6B7280', padding: '24px 0' }}>No handovers for this ritual.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RitualDetail;