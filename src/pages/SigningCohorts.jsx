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

                                  if (conditionData && typeof conditionData === 'object') {
                                    // Extract condition details
                                    const condition = conditionData.condition || conditionData;
                                    const conditionType = condition.conditionType || 'Complex Condition';
                                    const version = conditionData.version || '';

                                    // Get icon for condition type
                                    const getIcon = (type) => {
                                      const typeLower = type.toLowerCase();
                                      if (typeLower.includes('contract')) return '📜';
                                      if (typeLower.includes('time')) return '⏰';
                                      if (typeLower.includes('compound')) return '🔗';
                                      if (typeLower.includes('signing')) return '✍️';
                                      return '📋';
                                    };

                                    // Get summary details
                                    const getSummary = () => {
                                      // ECDSA conditions
                                      if (condition.verifyingKey) {
                                        return `Key: ${formatString(condition.verifyingKey)}`;
                                      }

                                      // Signing ABI attribute conditions (calldata checks)
                                      if (condition.abiValidation?.allowedAbiCalls) {
                                        const abiCalls = Object.entries(condition.abiValidation.allowedAbiCalls);
                                        if (abiCalls.length > 0) {
                                          const [signature] = abiCalls[0];
                                          const funcMatch = signature.match(/^(\w+)\(/);
                                          const funcName = funcMatch ? funcMatch[1] : signature;

                                          // Describe common patterns
                                          if (funcName === 'transfer' || funcName === 'transferFrom') {
                                            return '💸 Max transfer';
                                          } else if (funcName === 'approve') {
                                            return '✅ Approval limit';
                                          } else if (funcName === 'execute' || funcName === 'execTransaction') {
                                            // Check if there's a value limit in the validations
                                            const [, validations] = abiCalls[0];
                                            const hasValueLimit = validations?.some(v =>
                                              v.indexWithinTuple === 1 || // uint256 value in tuple
                                              (v.parameterIndex === 0 && v.returnValueTest?.comparator === '<') // or limiting the whole param
                                            );
                                            return hasValueLimit ? '💰 Max transaction value' : '🔒 Execute limits';
                                          } else if (funcName.includes('swap')) {
                                            return '🔄 Swap limits';
                                          } else if (funcName === 'withdraw') {
                                            return '🏦 Withdrawal limit';
                                          } else if (funcName === 'stake' || funcName === 'unstake') {
                                            return `🎯 ${funcName} limit`;
                                          } else if (funcName === 'multicall' || funcName === 'batchExecute') {
                                            return '📦 Batch limits';
                                          } else {
                                            return `🔧 ${funcName} limits`;
                                          }
                                        }
                                      }

                                      // Regular signing attribute conditions
                                      if (condition.attributeName) {
                                        const attr = condition.attributeName;
                                        if (attr === 'call_data' && !condition.abiValidation) {
                                          return 'Calldata validation';
                                        }
                                        if (attr === 'balance' && condition.returnValueTest) {
                                          const val = condition.returnValueTest.value;
                                          if (val > 1e15) {
                                            return `ETH ${condition.returnValueTest.comparator} ${(val / 1e18).toFixed(4)}`;
                                          }
                                        }
                                        return `Check: ${attr}`;
                                      }

                                      // Contract function calls
                                      if (condition.functionAbi?.name) {
                                        const funcName = condition.functionAbi.name;
                                        if (funcName === 'balanceOf') {
                                          return 'Token balance check';
                                        } else if (funcName === 'ownerOf') {
                                          return 'NFT ownership check';
                                        } else if (funcName === 'hasRole') {
                                          return 'Role verification';
                                        }
                                        return `${funcName}()`;
                                      }

                                      // Time conditions
                                      if (condition.timeframe) {
                                        if (condition.timeframe.start && condition.timeframe.end) {
                                          return 'Time window';
                                        }
                                        return 'Time check';
                                      }

                                      // Compound conditions
                                      if (condition.operands?.length) {
                                        return `${condition.operator || 'Compound'}: ${condition.operands.length} conditions`;
                                      }

                                      if (condition.endpoint) {
                                        try {
                                          return new URL(condition.endpoint).hostname;
                                        } catch {
                                          return 'API call';
                                        }
                                      }

                                      if (condition.contractAddress) {
                                        return formatString(condition.contractAddress);
                                      }

                                      return null;
                                    };

                                    const summary = getSummary();

                                    return (
                                      <div className={styles.conditionSummary}>
                                        <div className={styles.conditionTypeRow}>
                                          <span className={styles.conditionIcon}>{getIcon(conditionType)}</span>
                                          <span className={styles.conditionType}>{conditionType}</span>
                                        </div>
                                        {summary && (
                                          <div className={styles.conditionDetail}>{summary}</div>
                                        )}
                                        {version && (
                                          <div className={styles.conditionVersion}>v{version}</div>
                                        )}
                                      </div>
                                    );
                                  }

                                  if (typeof conditionData === 'string' && conditionData.length > 0) {
                                    return (
                                      <div className={styles.conditionItem}>
                                        <span className={styles.conditionValue}>{conditionData.slice(0, 50)}...</span>
                                      </div>
                                    );
                                  }

                                  if (chainConditions?.raw && chainConditions.raw !== '0x') {
                                    return (
                                      <div className={styles.conditionItem}>
                                        <span className={styles.conditionValue} style={{fontSize: '10px'}}>
                                          Encrypted conditions
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

      </div>
    </div>
  );
};

export default SigningCohorts;