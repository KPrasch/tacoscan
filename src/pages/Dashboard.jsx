import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRituals, getNodes, formatRitualsData, getTimeout, formatTimeToText } from './data';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRituals: 0,
    activeRituals: 0,
    totalNodes: 0,
    activeNodes: 0,
    successRate: '98.5%',
    avgResponseTime: '120ms',
    networkUptime: '99.9%',
    totalAuthorized: '1.2M'
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
      // getNodes returns an object with appAuthorizations property
      const nodes = nodesData?.appAuthorizations ? nodesData.appAuthorizations : [];

      // Format rituals data for display
      const formattedRituals = formatRitualsData(rituals, timeout);

      setStats(prev => ({
        ...prev,
        totalRituals: formattedRituals.length,
        activeRituals: formattedRituals.filter(r => r.status === 'ACTIVE' || r.status === 'SUCCESSFUL').length,
        totalNodes: nodes.length,
        activeNodes: nodes.filter(n => n.tacoOperator?.confirmed).length
      }));

      // Get recent rituals for the table
      setRecentRituals(formattedRituals.slice(0, 10));

      // Mock recent network activity (would come from real API)
      setRecentActivity([
        { id: '1205', event: 'Ritual Started', time: '2 mins ago', participants: 7, authority: '0x123...abc', status: 'Active' },
        { id: '1204', event: 'DKG Complete', time: '5 mins ago', participants: 7, authority: '0x456...def', status: 'Success' },
        { id: '1203', event: 'Transcripts Posted', time: '8 mins ago', participants: 5, authority: '0x789...ghi', status: 'Processing' },
        { id: '1202', event: 'Aggregation Complete', time: '12 mins ago', participants: 7, authority: '0x012...jkl', status: 'Success' },
        { id: '1201', event: 'Ritual Expired', time: '15 mins ago', participants: 3, authority: '0x345...mno', status: 'Expired' }
      ]);

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
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>NETWORK UPTIME</span>
                <span className={styles.overviewValue}>{stats.networkUptime}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Grid */}
        <section className={styles.statsGrid}>
          <StatCard 
            title="Total Rituals" 
            value={stats.totalRituals.toLocaleString()}
            subtitle={`${stats.activeRituals} active`}
            change="12.5%"
            trend="up"
          />
          <StatCard 
            title="Node Operators" 
            value={stats.totalNodes.toLocaleString()}
            subtitle={`${stats.activeNodes} confirmed`}
            change="3.2%"
            trend="up"
          />
          <StatCard 
            title="Total Authorized" 
            value={stats.totalAuthorized}
            subtitle="Staking amount"
          />
          <StatCard 
            title="Avg Response Time" 
            value={stats.avgResponseTime}
            subtitle="Network latency"
          />
        </section>

        {/* Recent Activity Tables */}
        <section className={styles.recentActivity}>
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Latest Rituals</h3>
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
                        <Link to={`/ritual/${ritual.id}`} className={styles.idLink}>
                          #{ritual.id}
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
              <h3 className={styles.tableTitle}>Recent Network Activity</h3>
              <Link to="/activity" className={styles.viewAllLink}>View All →</Link>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Ritual ID</th>
                    <th>Event</th>
                    <th>Time</th>
                    <th>Participants</th>
                    <th>Authority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity, idx) => (
                    <tr key={idx}>
                      <td>
                        <Link to={`/ritual/${activity.id}`} className={styles.idLink}>
                          #{activity.id}
                        </Link>
                      </td>
                      <td>
                        <span className={styles.method}>{activity.event}</span>
                      </td>
                      <td className={styles.age}>{activity.time}</td>
                      <td>{activity.participants}</td>
                      <td>
                        <Link to={`/address/${activity.authority}`} className={styles.addressLink}>
                          {activity.authority}
                        </Link>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[activity.status?.toLowerCase()]}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Network Activity Chart Placeholder */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Network Activity (14 Days)</h3>
          <div className={styles.chartPlaceholder}>
            <div className={styles.chartBar} style={{height: '60%'}}></div>
            <div className={styles.chartBar} style={{height: '75%'}}></div>
            <div className={styles.chartBar} style={{height: '65%'}}></div>
            <div className={styles.chartBar} style={{height: '80%'}}></div>
            <div className={styles.chartBar} style={{height: '70%'}}></div>
            <div className={styles.chartBar} style={{height: '85%'}}></div>
            <div className={styles.chartBar} style={{height: '90%'}}></div>
            <div className={styles.chartBar} style={{height: '75%'}}></div>
            <div className={styles.chartBar} style={{height: '80%'}}></div>
            <div className={styles.chartBar} style={{height: '85%'}}></div>
            <div className={styles.chartBar} style={{height: '95%'}}></div>
            <div className={styles.chartBar} style={{height: '88%'}}></div>
            <div className={styles.chartBar} style={{height: '92%'}}></div>
            <div className={styles.chartBar} style={{height: '100%'}}></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;