import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SigningCohorts.module.css';
import { formatString, formatDate, calculateTimeMoment } from './data';
import { getAllSigningCohorts } from '../utils/contractReader';
import { getCurrentNetwork } from '../utils/dataSource';

const SigningCohorts = () => {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedConditions, setExpandedConditions] = useState({});

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const network = getCurrentNetwork();
        console.log(`Fetching signing cohorts for ${network}...`);

        const cohortsData = await getAllSigningCohorts(network);

        // Transform the data for display
        const transformedCohorts = cohortsData.map(cohort => ({
          id: cohort.id,
          name: `Cohort #${cohort.id}`,
          signers: cohort.signers || [],
          threshold: cohort.threshold,
          isActive: cohort.isActive,
          state: cohort.state,
          signersCount: cohort.signersCount || 0,
          conditions: cohort.conditions
        }));

        setCohorts(transformedCohorts);
      } catch (error) {
        console.error('Error fetching cohorts:', error);
        setCohorts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCohorts();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedCohorts = [...cohorts].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (sortBy === 'signers') {
      const aLen = a.signersCount;
      const bLen = b.signersCount;
      return sortOrder === 'asc' ? aLen - bLen : bLen - aLen;
    }

    if (typeof aVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (typeof aVal === 'boolean') {
      return sortOrder === 'asc'
        ? (aVal === bVal ? 0 : aVal ? -1 : 1)
        : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }

    return sortOrder === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading signing cohorts...</div>
      </div>
    );
  }

  return (
    <div className={styles.signingCohorts}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Signing Cohorts</h1>
            <p className={styles.subtitle}>
              Groups of nodes authorized to perform threshold signing operations
            </p>
          </div>
        </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{cohorts.length}</div>
          <div className={styles.statLabel}>Total Cohorts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {cohorts.filter(c => c.isActive).length}
          </div>
          <div className={styles.statLabel}>Active Cohorts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {cohorts.reduce((sum, c) => sum + c.signersCount, 0)}
          </div>
          <div className={styles.statLabel}>Total Signers</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className={styles.sortable}>
                ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} className={styles.sortable}>
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('signers')} className={styles.sortable}>
                Signers {sortBy === 'signers' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('threshold')} className={styles.sortable}>
                Threshold {sortBy === 'threshold' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('state')} className={styles.sortable}>
                State {sortBy === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Conditions</th>
              <th onClick={() => handleSort('isActive')} className={styles.sortable}>
                Status {sortBy === 'isActive' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCohorts.map((cohort) => (
              <tr
                key={cohort.id}
                onClick={() => navigate(`/cohort/${cohort.id}`)}
                className={styles.clickableRow}
              >
                <td className={styles.idCell}>{cohort.id}</td>
                <td className={styles.nameCell}>{cohort.name}</td>
                <td className={styles.membersCell}>
                  <span className={styles.memberCount}>{cohort.signersCount} signers</span>
                </td>
                <td className={styles.thresholdCell}>
                  {cohort.threshold}/{cohort.signersCount}
                </td>
                <td className={styles.stateCell}>
                  {cohort.state || 'Unknown'}
                </td>
                <td className={styles.conditionsCell}>
                  {cohort.conditions && typeof cohort.conditions === 'object' && Object.keys(cohort.conditions).length > 0 ? (
                    <div className={styles.conditionsWrapper}>
                      <button
                        className={styles.conditionsToggle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedConditions(prev => ({
                            ...prev,
                            [cohort.id]: !prev[cohort.id]
                          }));
                        }}
                      >
                        <span className={styles.conditionsBadge}>
                          {Object.keys(cohort.conditions).length} chain{Object.keys(cohort.conditions).length !== 1 ? 's' : ''}
                        </span>
                        <span className={styles.expandIcon}>
                          {expandedConditions[cohort.id] ? '▼' : '▶'}
                        </span>
                      </button>
                      {expandedConditions[cohort.id] && (
                        <div className={styles.conditionsDropdown}>
                          {Object.entries(cohort.conditions).map(([chainId, chainConditions]) => {
                            const chainName =
                              chainId === '11155111' ? 'Sepolia' :
                              chainId === '80002' ? 'Polygon Amoy' :
                              chainId === '84532' ? 'Base Sepolia' :
                              chainId === '1' ? 'Ethereum' :
                              `Chain ${chainId}`;

                            return (
                              <div key={chainId} className={styles.chainConditionGroup}>
                                <div className={styles.chainConditionHeader}>{chainName}</div>
                                {(() => {
                                  const conditionData = chainConditions?.decoded || chainConditions;

                                  if (typeof conditionData === 'object' && conditionData !== null) {
                                    const entries = Object.entries(conditionData).filter(([key]) => key !== 'raw');
                                    if (entries.length > 0) {
                                      return entries.map(([key, value]) => (
                                        <div key={key} className={styles.conditionItem}>
                                          <span className={styles.conditionKey}>{key}:</span>
                                          <span className={styles.conditionValue}>
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ));
                                    }
                                  }

                                  if (typeof conditionData === 'string' && conditionData.length > 0) {
                                    return (
                                      <div className={styles.conditionItem}>
                                        <span className={styles.conditionValue}>{conditionData}</span>
                                      </div>
                                    );
                                  }

                                  if (chainConditions?.raw && chainConditions.raw !== '0x') {
                                    return (
                                      <div className={styles.conditionItem}>
                                        <span className={styles.conditionValue} style={{fontSize: '10px'}}>
                                          {chainConditions.raw.slice(0, 20)}...
                                        </span>
                                      </div>
                                    );
                                  }

                                  return <span className={styles.noConditions}>No data</span>;
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={styles.noConditions}>None</span>
                  )}
                </td>
                <td className={styles.statusCell}>
                  <span className={`${styles.status} ${cohort.isActive ? styles.active : styles.inactive}`}>
                    {cohort.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.info}>
        <p>
          Signing cohorts are groups of node operators authorized to perform threshold
          signing operations. Each cohort consists of nodes that can collaborate to
          produce valid signatures using their individual key shares, without requiring
          a DKG ritual.
        </p>
      </div>
      </div>
    </div>
  );
};

export default SigningCohorts;