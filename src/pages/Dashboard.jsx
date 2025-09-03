import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRituals, getNodes } from './data';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRituals: 0,
    activeRituals: 0,
    totalNodes: 0,
    activeNodes: 0,
    totalTransactions: '2,451,234',
    avgBlockTime: '2.0s',
    tacoPrice: 0.042,
    marketCap: '42,000,000',
    latestBlock: '19234567',
    networkUtilization: '67.8%'
  });

  const [recentRituals, setRecentRituals] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ritualsData, nodesData] = await Promise.all([
        getRituals(false, ''),  // Not searching, empty search input
        getNodes(false, '')     // Not searching, empty search input
      ]);

      // Ensure we have arrays before filtering
      const rituals = Array.isArray(ritualsData) ? ritualsData : [];
      // getNodes returns an object with appAuthorizations property
      const nodes = nodesData?.appAuthorizations ? nodesData.appAuthorizations : [];

      setStats(prev => ({
        ...prev,
        totalRituals: rituals.length,
        activeRituals: rituals.filter(r => r.status === 'ACTIVE' || r.status === 'SUCCESSFUL').length,
        totalNodes: nodes.length,
        activeNodes: nodes.filter(n => n.tacoOperator?.confirmed).length
      }));

      // Get recent rituals for the table
      setRecentRituals(rituals.slice(0, 10));

      // Mock recent transactions (would come from real API)
      setRecentTransactions([
        { hash: '0xabc123...', method: 'startRitual', block: '19234567', age: '2 secs ago', from: '0x123...abc', to: 'Coordinator', value: '100 TACO', fee: '0.002' },
        { hash: '0xdef456...', method: 'postTranscript', block: '19234566', age: '5 secs ago', from: '0x456...def', to: 'Ritual #1205', value: '0', fee: '0.001' },
        { hash: '0xghi789...', method: 'postAggregation', block: '19234565', age: '8 secs ago', from: '0x789...ghi', to: 'Ritual #1204', value: '0', fee: '0.001' },
        { hash: '0xjkl012...', method: 'nodeRegister', block: '19234564', age: '12 secs ago', from: '0x012...jkl', to: 'StakeManager', value: '50000 TACO', fee: '0.003' },
        { hash: '0xmno345...', method: 'withdraw', block: '19234563', age: '15 secs ago', from: '0x345...mno', to: 'RewardPool', value: '250 TACO', fee: '0.001' }
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
                <span className={styles.overviewLabel}>TACO PRICE</span>
                <span className={styles.overviewValue}>${stats.tacoPrice}</span>
                <span className={styles.overviewChange}>+5.2%</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>MARKET CAP</span>
                <span className={styles.overviewValue}>${stats.marketCap}</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>LATEST BLOCK</span>
                <span className={styles.overviewValue}>#{stats.latestBlock}</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>NETWORK UTILIZATION</span>
                <span className={styles.overviewValue}>{stats.networkUtilization}</span>
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
            subtitle={`${stats.activeNodes} active`}
            change="3.2%"
            trend="up"
          />
          <StatCard 
            title="Total Transactions" 
            value={stats.totalTransactions}
            subtitle="All time"
            change="8.1%"
            trend="up"
          />
          <StatCard 
            title="Avg Block Time" 
            value={stats.avgBlockTime}
            subtitle="Last 1000 blocks"
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
                    <tr key={ritual.ritualId}>
                      <td>
                        <Link to={`/ritual/${ritual.ritualId}`} className={styles.idLink}>
                          #{ritual.ritualId}
                        </Link>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[ritual.status?.toLowerCase()]}`}>
                          {ritual.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/address/${ritual.authority}`} className={styles.addressLink}>
                          {ritual.authority?.slice(0, 6)}...{ritual.authority?.slice(-4)}
                        </Link>
                      </td>
                      <td>{ritual.totalParticipants || 0}</td>
                      <td className={styles.age}>{ritual.timestamp || '2 mins ago'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Latest Transactions</h3>
              <Link to="/transactions" className={styles.viewAllLink}>View All →</Link>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Txn Hash</th>
                    <th>Method</th>
                    <th>Block</th>
                    <th>Age</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Value</th>
                    <th>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>
                        <Link to={`/tx/${tx.hash}`} className={styles.hashLink}>
                          {tx.hash}
                        </Link>
                      </td>
                      <td>
                        <span className={styles.method}>{tx.method}</span>
                      </td>
                      <td>
                        <Link to={`/block/${tx.block}`} className={styles.blockLink}>
                          {tx.block}
                        </Link>
                      </td>
                      <td className={styles.age}>{tx.age}</td>
                      <td>
                        <Link to={`/address/${tx.from}`} className={styles.addressLink}>
                          {tx.from}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/address/${tx.to}`} className={styles.addressLink}>
                          {tx.to}
                        </Link>
                      </td>
                      <td>{tx.value}</td>
                      <td className={styles.fee}>{tx.fee}</td>
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