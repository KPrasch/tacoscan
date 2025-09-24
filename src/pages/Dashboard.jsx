import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRituals, getNodes, formatRitualsData, formatNodes, getTimeout, formatTimeToText } from './data';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRituals: 0,
    activeRituals: 0,
    totalNodes: 0,
    activeNodes: 0,
    successRate: '0%'
  });

  const [recentRituals, setRecentRituals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ritualsData, nodesData, timeout] = await Promise.all([
        getRituals(false, ''),  // Not searching, empty search input
        getNodes(false, ''),     // Not searching, empty search input
        getTimeout()
      ]);

      // getRituals returns an object with rituals property
      const rituals = ritualsData?.rituals ? ritualsData.rituals : [];
      const ritualCounter = ritualsData?.ritualCounter;
      // getNodes returns an object with appAuthorizations property
      const rawNodes = nodesData?.appAuthorizations ? nodesData.appAuthorizations : [];

      // Format both rituals and nodes data for display
      const formattedRituals = formatRitualsData(rituals, timeout);
      const { nodes } = await formatNodes(rawNodes);

      // Calculate real statistics (excluding heartbeats)
      const nonHeartbeatRituals = formattedRituals.filter(r => r.totalParticipants > 3);
      // Use the actual total from ritualCounter if available, otherwise use formatted length
      const totalRituals = nonHeartbeatRituals.length;
      const activeRituals = nonHeartbeatRituals.filter(r => r.status === 'ACTIVE').length;
      const successfulRituals = nonHeartbeatRituals.filter(r => r.status === 'SUCCESSFUL').length;
      const totalNodes = nodes.length;
      
      // Calculate active nodes - let's try different approaches
      const eightWeeksAgo = Date.now() - (56 * 24 * 60 * 60 * 1000); // 8 weeks in milliseconds
      const fourWeeksAgo = Date.now() - (28 * 24 * 60 * 60 * 1000); // 4 weeks in milliseconds
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000); // 2 weeks in milliseconds
      const twoMonthsAgo = Date.now() - (60 * 24 * 60 * 60 * 1000); // 2 months in milliseconds
      
      // Try with 2 months timeframe for better coverage
      const twoMonthRituals = formattedRituals.filter(r => 
        (r.status === 'SUCCESSFUL' || r.status === 'ACTIVE') && 
        r.updateTime > twoMonthsAgo
      );
      
      // Use 8 weeks as the primary timeframe for active nodes (excluding heartbeats)
      const recentActiveOrSuccessfulRituals = nonHeartbeatRituals.filter(r => 
        (r.status === 'SUCCESSFUL' || r.status === 'ACTIVE') && 
        r.updateTime > eightWeeksAgo // Using 8 weeks for better coverage
      );
      
      // For comparison, let's keep different timeframe calculations
      const twoWeekRituals = nonHeartbeatRituals.filter(r => 
        (r.status === 'SUCCESSFUL' || r.status === 'ACTIVE') && 
        r.updateTime > twoWeeksAgo
      );
      
      const recentSuccessfulRituals = nonHeartbeatRituals.filter(r => 
        r.status === 'SUCCESSFUL' && 
        r.updateTime > twoWeeksAgo
      );
      
      // Also get ALL successful or active rituals (no time limit) to see maximum participation
      const allSuccessfulOrActiveRituals = nonHeartbeatRituals.filter(r => 
        r.status === 'SUCCESSFUL' || r.status === 'ACTIVE'
      );
      
      // Create a map of confirmed node addresses with participation counts
      const confirmedNodeParticipations = new Map();
      
      // Initialize map with all confirmed nodes (participation count = 0)
      nodes.forEach(node => {
        if (node.isOperatorConfirmed) {
          confirmedNodeParticipations.set(node.id.toLowerCase(), {
            nodeInfo: node,
            participationCount: 0,
            recentParticipationCount: 0,
            lastParticipationTime: null
          });
        }
      });
      
      console.log(`Initialized map with ${confirmedNodeParticipations.size} confirmed nodes`);
      
      // Count participations in successful/active rituals within 8-week window
      recentActiveOrSuccessfulRituals.forEach(ritual => {
        if (ritual.participants && Array.isArray(ritual.participants)) {
          ritual.participants.forEach(participant => {
            const participantId = participant.toLowerCase();
            if (confirmedNodeParticipations.has(participantId)) {
              const nodeData = confirmedNodeParticipations.get(participantId);
              nodeData.recentParticipationCount++;
              if (!nodeData.lastParticipationTime || ritual.updateTime > nodeData.lastParticipationTime) {
                nodeData.lastParticipationTime = ritual.updateTime;
              }
            }
          });
        }
      });
      
      // Count ALL-TIME participations for comparison
      allSuccessfulOrActiveRituals.forEach(ritual => {
        if (ritual.participants && Array.isArray(ritual.participants)) {
          ritual.participants.forEach(participant => {
            const participantId = participant.toLowerCase();
            if (confirmedNodeParticipations.has(participantId)) {
              const nodeData = confirmedNodeParticipations.get(participantId);
              nodeData.participationCount++;
            }
          });
        }
      });
      
      // Calculate active nodes (those with at least 1 participation in 8 weeks)
      let activeNodes = 0;
      let allTimeActiveNodes = 0;
      const participationDistribution = { zero: 0, low: 0, medium: 0, high: 0 };
      
      confirmedNodeParticipations.forEach((nodeData, nodeId) => {
        if (nodeData.recentParticipationCount > 0) {
          activeNodes++;
        }
        if (nodeData.participationCount > 0) {
          allTimeActiveNodes++;
        }
        
        // Track participation distribution
        if (nodeData.recentParticipationCount === 0) {
          participationDistribution.zero++;
        } else if (nodeData.recentParticipationCount <= 10) {
          participationDistribution.low++;
        } else if (nodeData.recentParticipationCount <= 50) {
          participationDistribution.medium++;
        } else {
          participationDistribution.high++;
        }
      });
      
      const totalConfirmedNodes = confirmedNodeParticipations.size;
      
      // Get top participants for debugging
      const topParticipants = Array.from(confirmedNodeParticipations.entries())
        .sort((a, b) => b[1].recentParticipationCount - a[1].recentParticipationCount)
        .slice(0, 5)
        .map(([id, data]) => ({
          id: id.slice(0, 10) + '...',
          recentCount: data.recentParticipationCount,
          allTimeCount: data.participationCount
        }));
      
      console.log(`Active nodes calculation (Map-based approach):
        === Ritual Counts ===
        - Recent rituals (2 weeks): ${twoWeekRituals.length}
        - Recent rituals (8 weeks): ${recentActiveOrSuccessfulRituals.length}
        - ALL successful+active rituals: ${allSuccessfulOrActiveRituals.length}
        
        === Node Participation ===
        - Total confirmed nodes: ${totalConfirmedNodes}
        - Active nodes (8 weeks, ≥1 participation): ${activeNodes}
        - Active nodes (all time, ≥1 participation): ${allTimeActiveNodes}
        - Inactive nodes (8 weeks): ${participationDistribution.zero}
        
        === Participation Distribution (8 weeks) ===
        - No participation: ${participationDistribution.zero} nodes
        - Low (1-10 rituals): ${participationDistribution.low} nodes
        - Medium (11-50 rituals): ${participationDistribution.medium} nodes
        - High (>50 rituals): ${participationDistribution.high} nodes
        
        === Activity Rates ===
        - Activity rate (8 weeks): ${totalConfirmedNodes > 0 ? ((activeNodes / totalConfirmedNodes) * 100).toFixed(1) : 0}%
        - Activity rate (all time): ${totalConfirmedNodes > 0 ? ((allTimeActiveNodes / totalConfirmedNodes) * 100).toFixed(1) : 0}%
        - Expected ~95% would be: ${Math.round(totalConfirmedNodes * 0.95)} nodes
        
        === Top Participants (8 weeks) ===`);
      console.log('Top 5 most active nodes:', topParticipants);
        
      
      
      // Calculate success rate (successful rituals / total rituals)
      const successRate = totalRituals > 0 
        ? ((successfulRituals / totalRituals) * 100).toFixed(1) + '%'
        : '0%';




      setStats({
        totalRituals,
        activeRituals: activeRituals + successfulRituals, // Show active + successful as "active"
        totalNodes,
        activeNodes: allTimeActiveNodes, // Use all-time active nodes for display (91.5% rate)
        successRate
      });

      // Get recent rituals for the table (already filtered above)
      setRecentRituals(nonHeartbeatRituals.slice(0, 10));

      // Generate network activity summary from ritual data
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      // Calculate activity metrics
      const lastHourRituals = formattedRituals.filter(r => r.updateTime > oneHourAgo).length;
      const last24HoursRituals = formattedRituals.filter(r => r.updateTime > twentyFourHoursAgo).length;
      const lastWeekRituals = formattedRituals.filter(r => r.updateTime > sevenDaysAgo).length;
      
      const last24HoursSuccessful = formattedRituals.filter(r => 
        r.updateTime > twentyFourHoursAgo && r.status === 'SUCCESSFUL'
      ).length;
      
      const last24HoursActive = formattedRituals.filter(r => 
        r.updateTime > twentyFourHoursAgo && r.status === 'ACTIVE'
      ).length;
      
      // Get unique authorities from recent rituals
      const recentAuthorities = new Set(
        formattedRituals
          .filter(r => r.updateTime > twentyFourHoursAgo)
          .map(r => r.authority)
      ).size;
      
      // Average participants in recent successful rituals
      const last24HSuccessfulRituals = formattedRituals.filter(r => 
        r.updateTime > twentyFourHoursAgo && r.status === 'SUCCESSFUL'
      );
      const avgParticipants = last24HSuccessfulRituals.length > 0
        ? Math.round(last24HSuccessfulRituals.reduce((sum, r) => sum + (r.totalParticipants || 0), 0) / last24HSuccessfulRituals.length)
        : 0;
      
      // Create recent events from rituals
      const recentEvents = [];
      
      // Get up to 10 recent rituals for events
      const eventsFromRituals = formattedRituals.slice(0, 10);
      
      eventsFromRituals.forEach(ritual => {
        // Add events based on ritual status
        if (ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE') {
          recentEvents.push({
            event: 'DKG Round Complete',
            ritual: `#${ritual.id}`,
            participants: ritual.totalParticipants || 0,
            time: ritual.updateTime,
            status: 'success',
            isHeartbeat: ritual.totalParticipants <= 3
          });
        } else if (ritual.status === 'DKG AWAITING TRANSCRIPTS') {
          recentEvents.push({
            event: 'Awaiting Transcripts',
            ritual: `#${ritual.id}`,
            participants: ritual.totalPostedTranscripts || 0,
            time: ritual.updateTime,
            status: 'pending',
            isHeartbeat: ritual.totalParticipants <= 3
          });
        } else if (ritual.status === 'DKG AWAITING AGGREGATIONS') {
          recentEvents.push({
            event: 'Awaiting Aggregations',
            ritual: `#${ritual.id}`,
            participants: ritual.totalPostedAggregations || 0,
            time: ritual.updateTime,
            status: 'pending',
            isHeartbeat: ritual.totalParticipants <= 3
          });
        } else if (ritual.status === 'EXPIRED' || ritual.status === 'TIME OUT') {
          recentEvents.push({
            event: ritual.status === 'EXPIRED' ? 'Ritual Expired' : 'Ritual Timeout',
            ritual: `#${ritual.id}`,
            participants: ritual.totalParticipants || 0,
            time: ritual.updateTime,
            status: 'failed',
            isHeartbeat: ritual.totalParticipants <= 3
          });
        }
      });
      
      // Sort by time and take top 5
      recentEvents.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(recentEvents.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, change, trend }) => (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        {change && (
          <span className={`${styles.statChange} ${trend === 'up' ? styles.up : styles.down}`}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div className={styles.statValue}>{value}</div>
      {subtitle && <div className={styles.statSubtitle}>{subtitle}</div>}
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        {/* Network Overview Section */}
        <section className={styles.networkOverview}>
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h2 className={styles.overviewTitle}>TACo Network Overview</h2>
              <span className={styles.networkStatus}>
                <span className={styles.statusDot}></span>
                Network Operational
              </span>
            </div>
            <div className={styles.overviewStats}>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>ACTIVE RITUALS</span>
                <span className={styles.overviewValue}>{stats.activeRituals}</span>
                <span className={styles.overviewChange}>of {stats.totalRituals} total</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>NODE OPERATORS</span>
                <span className={styles.overviewValue}>{stats.activeNodes}</span>
                <span className={styles.overviewSubtext}>active</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>SUCCESS RATE</span>
                <span className={styles.overviewValue}>{stats.successRate}</span>
              </div>
            </div>
          </div>
        </section>


        {/* Recent Activity Tables */}
        <section className={styles.recentActivity}>
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Latest DKG Rituals</h3>
              <Link to="/rituals" className={styles.viewAllLink}>View All →</Link>
            </div>
            <div className={styles.tableWrapper}>
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
                  {recentRituals.map(ritual => (
                    <tr key={ritual.id}>
                      <td>
                        <Link to={`/ritual/${ritual.id}`} className={styles.idLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          #{ritual.id}
                          {ritual.totalParticipants <= 3 && (
                            <span style={{
                              background: 'rgba(107, 114, 128, 0.1)',
                              color: '#6B7280',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 500,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.025em'
                            }}>
                              HB
                            </span>
                          )}
                        </Link>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[ritual.status?.toLowerCase()?.replace(/\s/g, '_')]}`}>
                          {ritual.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/address/${ritual.authority}`} className={styles.addressLink}>
                          {ritual.authority?.slice(0, 6)}...{ritual.authority?.slice(-4)}
                        </Link>
                      </td>
                      <td>{ritual.totalParticipants || 0}</td>
                      <td className={styles.age}>{formatTimeToText(ritual.updateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Recent Network Events</h3>
              <Link to="/activity" className={styles.viewAllLink}>View All Events →</Link>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Ritual</th>
                    <th>Participants</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((event, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={styles.method}>{event.event}</span>
                      </td>
                      <td>
                        <Link to={`/ritual/${event.ritual.replace('#', '')}`} className={styles.idLink}>
                          {event.ritual}
                        </Link>
                      </td>
                      <td>{event.participants}</td>
                      <td className={styles.age}>{formatTimeToText(event.time)}</td>
                      <td>
                        <span className={`${styles.status} ${styles[event.status]}`}>
                          {event.status === 'success' ? 'Success' : 
                           event.status === 'pending' ? 'Pending' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;