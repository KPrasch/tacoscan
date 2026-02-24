import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRituals, getTimeout, formatRitualsData, detectHeartbeatGroups, formatString, formatDate, calculateTimeMoment } from './data';
import styles from './HeartbeatGroupDetail.module.css';

const HeartbeatGroupDetail = () => {
  const { weekId } = useParams(); // weekId format: "2025-03-17" (Monday date)
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [violatingNodes, setViolatingNodes] = useState([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        
        // Fetch all rituals and timeout
        const [ritualsData, timeout] = await Promise.all([
          getRituals(),
          getTimeout()
        ]);
        
        if (ritualsData?.rituals) {
          // Format rituals and detect heartbeat groups
          const formattedRituals = formatRitualsData(ritualsData.rituals, timeout);
          const heartbeatGroups = detectHeartbeatGroups(formattedRituals, timeout);
          
          // Find the specific group by Monday date
          const targetDate = new Date(weekId + 'T00:00:00Z');
          const group = heartbeatGroups.find(g => {
            const groupMonday = new Date(g.mondayMidnight);
            return groupMonday.toISOString().split('T')[0] === weekId;
          });
          
          if (group) {
            // Analyze violating nodes
            const nodeViolations = {};
            
            group.rituals.forEach(ritual => {
              // Get nodes that didn't post transcripts
              const pendingTranscripts = ritual.participants.filter(
                participant => !ritual.transcripts?.includes(participant)
              );
              
              pendingTranscripts.forEach(node => {
                if (!nodeViolations[node]) {
                  nodeViolations[node] = {
                    address: node,
                    failedRituals: [],
                    totalRituals: 0
                  };
                }
                nodeViolations[node].failedRituals.push({
                  id: ritual.id,
                  status: ritual.status,
                  timestamp: ritual.initTimeStamp
                });
              });
              
              // Count total rituals for each participant
              ritual.participants.forEach(node => {
                if (!nodeViolations[node]) {
                  nodeViolations[node] = {
                    address: node,
                    failedRituals: [],
                    totalRituals: 0
                  };
                }
                nodeViolations[node].totalRituals++;
              });
            });
            
            // Convert to array and calculate violation rates
            const violators = Object.values(nodeViolations)
              .filter(node => node.failedRituals.length > 0)
              .map(node => ({
                ...node,
                violationRate: ((node.failedRituals.length / node.totalRituals) * 100).toFixed(1)
              }))
              .sort((a, b) => b.failedRituals.length - a.failedRituals.length);
            
            setGroupData(group);
            setViolatingNodes(violators);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching heartbeat group data:', error);
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [weekId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading heartbeat details...</div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Heartbeat not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          onClick={() => navigate('/heartbeats')}
          className={styles.backButton}
        >
          ← Back to Rituals
        </button>
        
        <h1 className={styles.title}>
          Heartbeat - Monday, {new Date(groupData.mondayMidnight).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            timeZone: 'UTC'
          })}
        </h1>
        
        <div className={styles.subtitle}>
          {groupData.weekNumber === 0 ? 'This Week' : 
           groupData.weekNumber === 1 ? 'Last Week' :
           `${groupData.weekNumber} Weeks Ago`}
        </div>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Rituals</div>
          <div className={styles.statValue}>{groupData.stats.total}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Successful</div>
          <div className={styles.statValue} style={{ color: '#059669' }}>
            {groupData.stats.successful}
          </div>
          <div className={styles.statSubtext}>
            {groupData.stats.successRate}% success rate
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Failed</div>
          <div className={styles.statValue} style={{ color: '#DC2626' }}>
            {groupData.stats.failed}
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Violating Nodes</div>
          <div className={styles.statValue} style={{ color: violatingNodes.length > 0 ? '#DC2626' : '#059669' }}>
            {violatingNodes.length}
          </div>
          <div className={styles.statSubtext}>
            {groupData.uniqueParticipants.length} total participants
          </div>
        </div>
      </div>

      {/* Execution Timeline */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Execution Timeline</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <strong>Start:</strong> {new Date(groupData.rituals[0]?.initTimeStamp).toLocaleString('en-US', {
              timeZone: 'UTC',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </div>
          <div className={styles.timelineItem}>
            <strong>End:</strong> {new Date(groupData.rituals[groupData.rituals.length - 1]?.initTimeStamp).toLocaleString('en-US', {
              timeZone: 'UTC',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </div>
          <div className={styles.timelineItem}>
            <strong>Duration:</strong> {
              Math.round((groupData.rituals[groupData.rituals.length - 1]?.initTimeStamp - 
                         groupData.rituals[0]?.initTimeStamp) / 60000)
            } minutes
          </div>
        </div>
      </div>

      {/* Violating Nodes */}
      {violatingNodes.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Violating Nodes ({violatingNodes.length})
          </h2>
          <div className={styles.violatorsTable}>
            <div className={styles.tableHeader}>
              <div>Node Address</div>
              <div>Details</div>
            </div>
            {violatingNodes.map((node, idx) => (
              <div key={idx} className={styles.tableRow}>
                <div className={styles.nodeAddress}>
                  <a 
                    href={`/node/${node.address}`}
                    className={styles.link}
                  >
                    {formatString(node.address)}
                  </a>
                </div>
                <div>
                  <span className={styles.failedCount}>
                    {node.failedRituals.length} ritual{node.failedRituals.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Rituals in Group */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          All Rituals ({groupData.rituals.length})
        </h2>
        <div className={styles.ritualsGrid}>
          {groupData.rituals.map(ritual => (
            <div key={ritual.id} className={styles.ritualCard}>
              <div className={styles.ritualHeader}>
                <a 
                  href={`/ritual/${ritual.id}`}
                  className={styles.ritualId}
                >
                  #{ritual.id}
                </a>
                <span className={`${styles.ritualStatus} ${
                  ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE' ? styles.success :
                  ritual.status.includes('TIME OUT') || ritual.status === 'EXPIRED' ? styles.failed :
                  styles.pending
                }`}>
                  {ritual.status}
                </span>
              </div>
              <div className={styles.ritualDetails}>
                <div>{ritual.totalParticipants} participants</div>
                <div>{calculateTimeMoment(ritual.initTimeStamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeartbeatGroupDetail;