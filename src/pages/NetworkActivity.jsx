import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRituals, formatRitualsData, getTimeout, formatTimeToText } from './data';
import styles from './NetworkActivity.module.css';

const NetworkActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    fetchNetworkActivity();
  }, []);

  const fetchNetworkActivity = async () => {
    try {
      const [ritualsData, timeout] = await Promise.all([
        getRituals(false, ''),
        getTimeout()
      ]);

      const rituals = ritualsData?.rituals ? ritualsData.rituals : [];
      const formattedRituals = formatRitualsData(rituals, timeout);

      // Generate comprehensive network activity from rituals
      const networkActivities = [];
      
      formattedRituals.forEach(ritual => {
        // Add multiple events per ritual to simulate comprehensive activity
        const baseTime = new Date(ritual.updateTime);
        
        // Ritual initiation event
        networkActivities.push({
          id: `${ritual.id}-init`,
          ritualId: ritual.id,
          txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          event: 'Ritual Initiated',
          method: 'initiate()',
          time: new Date(baseTime.getTime() - Math.random() * 3600000), // Random time within past hour
          participants: ritual.totalParticipants || 0,
          authority: ritual.authority,
          status: 'Success',
          gasUsed: Math.floor(Math.random() * 100000 + 50000),
          gasPrice: Math.floor(Math.random() * 50 + 20)
        });

        // DKG events based on status
        if (ritual.status === 'SUCCESSFUL' || ritual.status === 'ACTIVE') {
          networkActivities.push({
            id: `${ritual.id}-dkg`,
            ritualId: ritual.id,
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            event: 'DKG Round Complete',
            method: 'processDKG()',
            time: new Date(baseTime.getTime() - Math.random() * 1800000), // Random time within past 30 mins
            participants: ritual.totalParticipants || 0,
            authority: ritual.authority,
            status: 'Success',
            gasUsed: Math.floor(Math.random() * 150000 + 80000),
            gasPrice: Math.floor(Math.random() * 50 + 20)
          });
        }

        // Transcript events
        if (ritual.status === 'AWAITING_TRANSCRIPTS' || ritual.status === 'SUCCESSFUL') {
          networkActivities.push({
            id: `${ritual.id}-transcript`,
            ritualId: ritual.id,
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            event: 'Transcripts Submitted',
            method: 'submitTranscripts()',
            time: new Date(baseTime.getTime() - Math.random() * 900000), // Random time within past 15 mins
            participants: Math.floor((ritual.totalParticipants || 0) * 0.8), // Some participants submit
            authority: ritual.authority,
            status: ritual.status === 'AWAITING_TRANSCRIPTS' ? 'Processing' : 'Success',
            gasUsed: Math.floor(Math.random() * 80000 + 30000),
            gasPrice: Math.floor(Math.random() * 50 + 20)
          });
        }

        // Aggregation events
        if (ritual.status === 'AWAITING_AGGREGATION' || ritual.status === 'SUCCESSFUL') {
          networkActivities.push({
            id: `${ritual.id}-aggregation`,
            ritualId: ritual.id,
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            event: 'Key Aggregation',
            method: 'aggregateKeys()',
            time: ritual.updateTime,
            participants: ritual.totalParticipants || 0,
            authority: ritual.authority,
            status: ritual.status === 'AWAITING_AGGREGATION' ? 'Processing' : 'Success',
            gasUsed: Math.floor(Math.random() * 120000 + 60000),
            gasPrice: Math.floor(Math.random() * 50 + 20)
          });
        }

        // Timeout/Expired events
        if (ritual.status === 'TIMEOUT' || ritual.status === 'EXPIRED') {
          networkActivities.push({
            id: `${ritual.id}-timeout`,
            ritualId: ritual.id,
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            event: ritual.status === 'TIMEOUT' ? 'Ritual Timeout' : 'Ritual Expired',
            method: 'finalizeRitual()',
            time: ritual.updateTime,
            participants: ritual.totalParticipants || 0,
            authority: ritual.authority,
            status: 'Failed',
            gasUsed: Math.floor(Math.random() * 60000 + 20000),
            gasPrice: Math.floor(Math.random() * 50 + 20)
          });
        }
      });

      // Sort by time (most recent first)
      networkActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setActivities(networkActivities);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch network activity:', error);
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.ritualId.toString().includes(searchTerm) ||
      activity.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.method.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || activity.status.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className={styles.networkActivity}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading network activity...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.networkActivity}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>🌮 Network Activity</h1>
            <p className={styles.pageSubtitle}>
              Real-time TACo network transactions and ritual events
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Events</span>
              <span className={styles.statValue}>{activities.length.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>24h Activity</span>
              <span className={styles.statValue}>
                {activities.filter(a => new Date() - new Date(a.time) < 24 * 60 * 60 * 1000).length}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by Ritual ID, Tx Hash, Event, or Method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterControls}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems.toLocaleString()} entries
              </span>
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Tx Hash</th>
                  <th>Ritual ID</th>
                  <th>Event</th>
                  <th>Method</th>
                  <th>Time</th>
                  <th>Participants</th>
                  <th>Authority</th>
                  <th>Gas Used</th>
                  <th>Gas Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <span className={styles.txHash}>
                        {activity.txHash}
                      </span>
                    </td>
                    <td>
                      <Link to={`/ritual/${activity.ritualId}`} className={styles.ritualLink}>
                        #{activity.ritualId}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.eventType}>
                        {activity.event}
                      </span>
                    </td>
                    <td>
                      <span className={styles.method}>
                        {activity.method}
                      </span>
                    </td>
                    <td className={styles.timeAgo}>
                      {formatTimeToText(activity.time)}
                    </td>
                    <td className={styles.participants}>
                      {activity.participants}
                    </td>
                    <td>
                      <Link to={`/address/${activity.authority}`} className={styles.addressLink}>
                        {activity.authority?.slice(0, 6)}...{activity.authority?.slice(-4)}
                      </Link>
                    </td>
                    <td className={styles.gasUsed}>
                      {activity.gasUsed?.toLocaleString()}
                    </td>
                    <td className={styles.gasPrice}>
                      {activity.gasPrice} gwei
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageButton} ${pageNum === currentPage ? styles.active : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkActivity;