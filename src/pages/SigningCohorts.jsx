import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SigningCohorts.module.css';
import { formatString, formatDate, calculateTimeMoment, getSigningCohortsFromSubgraph } from './data';

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
        console.log('Fetching signing cohorts from v2 subgraph...');
        const cohortsData = await getSigningCohortsFromSubgraph();

        const transformedCohorts = cohortsData.map(cohort => ({
          id: cohort.id,
          name: `Cohort #${cohort.id}`,
          signers: cohort.signers || cohort.participants || [],
          threshold: cohort.threshold || 0,
          isActive: cohort.status === 'DEPLOYED' || cohort.status === 'CONDITIONS_SET',
          state: cohort.status?.replace(/_/g, ' ') || 'Unknown',
          signersCount: (cohort.signers || cohort.participants || []).length,
          conditions: cohort.conditions,
          // V2 fields
          authority: cohort.authority,
          chainId: cohort.chainId,
          isDeployed: cohort.isDeployed,
          deployedAt: cohort.deployedAt,
          multisigAddress: cohort.multisigAddress,
          signatureCount: (cohort.signatures || []).length,
          createdAt: cohort.createdAt,
          // Multisig summary
          executionCount: cohort.multisig?.executionCount || 0,
          totalValue: cohort.multisig?.totalValue || '0',
          lastExecutedAt: cohort.multisig?.lastExecutedAt,
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
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {cohorts.filter(c => c.isDeployed).length}
          </div>
          <div className={styles.statLabel}>Deployed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {cohorts.reduce((sum, c) => sum + (c.signatureCount || 0), 0)}
          </div>
          <div className={styles.statLabel}>Total Signatures</div>
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
              <th onClick={() => handleSort('executionCount')} className={styles.sortable}>
                Executions {sortBy === 'executionCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalValue')} className={styles.sortable}>
                Total Value {sortBy === 'totalValue' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
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
                <td className={styles.numericCell}>
                  {cohort.executionCount > 0 ? (
                    <span className={styles.executionBadge}>{cohort.executionCount}</span>
                  ) : (
                    <span className={styles.zeroValue}>0</span>
                  )}
                </td>
                <td className={styles.numericCell}>
                  {cohort.totalValue !== '0' ? (
                    <span className={styles.valueAmount}>{cohort.totalValue}</span>
                  ) : (
                    <span className={styles.zeroValue}>0</span>
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

      </div>
    </div>
  );
};

export default SigningCohorts;