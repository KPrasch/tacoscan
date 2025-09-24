import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './SigningCohortDetail.module.css';
import { formatString, formatDate, calculateTimeMoment } from './data';
import { getSigningCohortDetails } from '../utils/contractReader';
import { getCurrentNetwork } from '../utils/dataSource';

// Helper function to render condition details
const renderConditionDetails = (conditionData) => {
  if (!conditionData) return null;

  // If it has a condition property (from ConditionExpression)
  if (conditionData.condition) {
    return renderConditionObject(conditionData.condition);
  }

  // Otherwise render the object directly
  return renderConditionObject(conditionData);
};

// Recursively render condition objects
const renderConditionObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return <span className={styles.conditionValue}>{String(obj)}</span>;
  }

  // Special handling for known condition types
  if (obj.conditionType) {
    return (
      <div className={styles.conditionBlock}>
        <div className={styles.conditionType}>Type: {obj.conditionType}</div>
        {obj.chain && <div className={styles.conditionField}>Chain ID: {obj.chain}</div>}
        {obj.contractAddress && (
          <div className={styles.conditionField}>
            Contract: {formatString(obj.contractAddress)}
          </div>
        )}
        {obj.functionAbi && (
          <div className={styles.conditionField}>
            Function: {obj.functionAbi.name || 'Unknown'}
          </div>
        )}
        {obj.parameters && (
          <div className={styles.conditionField}>
            Parameters: {JSON.stringify(obj.parameters)}
          </div>
        )}
        {obj.returnValueTest && (
          <div className={styles.conditionField}>
            Test: {obj.returnValueTest.comparator} {obj.returnValueTest.value}
          </div>
        )}
        {obj.operands && (
          <div className={styles.conditionField}>
            <div>Operands:</div>
            {obj.operands.map((operand, idx) => (
              <div key={idx} className={styles.nestedCondition}>
                {renderConditionObject(operand)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default object rendering
  return (
    <div className={styles.conditionsList}>
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className={styles.conditionItem}>
          <span className={styles.conditionKey}>{key}:</span>
          {typeof value === 'object' ? (
            <div className={styles.nestedValue}>
              {renderConditionObject(value)}
            </div>
          ) : (
            <span className={styles.conditionValue}>{String(value)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

const SigningCohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState({});

  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        const network = getCurrentNetwork();
        console.log(`Fetching cohort ${id} details for ${network}...`);

        const cohortData = await getSigningCohortDetails(id, network);

        if (!cohortData) {
          setError('Cohort not found');
        } else {
          setCohort(cohortData);
        }
      } catch (error) {
        console.error('Error fetching cohort details:', error);
        setError('Failed to load cohort details');
      } finally {
        setLoading(false);
      }
    };

    fetchCohortDetails();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.cohortDetail}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading cohort details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.cohortDetail}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/cohorts')} className={styles.backButton}>
              Back to Cohorts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cohortDetail}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <a href="/cohorts" className={styles.breadcrumbLink}>Signing Cohorts</a>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Cohort #{id}</span>
            </div>
            <h1 className={styles.title}>Signing Cohort #{id}</h1>
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>Status</span>
                <span className={`${styles.status} ${cohort?.isActive ? styles.active : styles.inactive}`}>
                  {cohort?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>State</span>
                <span className={styles.headerStatValue}>{cohort?.state || 'Unknown'}</span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>Threshold</span>
                <span className={styles.headerStatValue}>
                  {cohort?.threshold} of {cohort?.signersCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Overview Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Overview</h2>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Cohort ID</span>
                  <span className={styles.infoValue}>{cohort?.id}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Total Signers</span>
                  <span className={styles.infoValue}>{cohort?.signersCount}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Signature Threshold</span>
                  <span className={styles.infoValue}>{cohort?.threshold}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Active Status</span>
                  <span className={styles.infoValue}>
                    {cohort?.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chains Card */}
          {cohort?.chains && cohort.chains.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Supported Chains</h2>
              <div className={styles.cardContent}>
                <div className={styles.chainsList}>
                  {cohort.chains.map((chain, index) => (
                    <div key={index} className={styles.chainItem}>
                      <span className={styles.chainId}>Chain ID: {chain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conditions Card */}
          {cohort?.conditions && Object.keys(cohort.conditions).length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>On-Chain Conditions</h2>
                <button
                  className={styles.globalJsonToggle}
                  onClick={() => {
                    const allChainIds = Object.keys(cohort.conditions);
                    const allShowing = allChainIds.every(id => showRawJson[id]);
                    const newState = {};
                    allChainIds.forEach(id => {
                      newState[id] = !allShowing;
                    });
                    setShowRawJson(newState);
                  }}
                  title="Toggle all JSON views"
                >
                  <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  {Object.values(showRawJson).some(v => v) ? 'Hide All JSON' : 'Show All JSON'}
                </button>
              </div>
              <div className={styles.cardContent}>
                {Object.entries(cohort.conditions).map(([chainId, chainConditions]) => {
                  const chainName =
                    chainId === '11155111' ? 'Sepolia' :
                    chainId === '80002' ? 'Polygon Amoy' :
                    chainId === '84532' ? 'Base Sepolia' :
                    chainId === '1' ? 'Ethereum Mainnet' :
                    `Chain ${chainId}`;

                  return (
                    <div key={chainId} className={styles.chainConditions}>
                      <div className={styles.chainConditionsHeader}>
                        <h3 className={styles.chainTitle}>{chainName}</h3>
                        {chainConditions?.decoded && (
                          <button
                            className={styles.jsonToggle}
                            onClick={() => setShowRawJson(prev => ({
                              ...prev,
                              [chainId]: !prev[chainId]
                            }))}
                            title={showRawJson[chainId] ? "Show formatted view" : "Show raw JSON"}
                          >
                            {showRawJson[chainId] ? (
                              <>
                                <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                </svg>
                                View
                              </>
                            ) : (
                              <>
                                <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                                JSON
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className={styles.conditionsContainer}>
                        {(() => {
                          const conditionData = chainConditions?.decoded || chainConditions;

                          // Show raw JSON if toggle is active
                          if (showRawJson[chainId] && conditionData) {
                            // Format JSON with custom replacer for better readability
                            const formatJSON = (obj) => {
                              const json = JSON.stringify(obj, null, 2);
                              // Highlight property names and values
                              return json
                                .replace(/"([^"]+)":/g, '<span class="' + styles.jsonKey + '">"$1"</span>:')
                                .replace(/:"([^"]+)"/g, ': <span class="' + styles.jsonString + '">"$1"</span>')
                                .replace(/:(\d+)/g, ': <span class="' + styles.jsonNumber + '">$1</span>')
                                .replace(/:(true|false)/g, ': <span class="' + styles.jsonBoolean + '">$1</span>')
                                .replace(/:(null)/g, ': <span class="' + styles.jsonNull + '">$1</span>');
                            };

                            return (
                              <div className={styles.jsonContainer}>
                                <pre
                                  className={styles.jsonContent}
                                  dangerouslySetInnerHTML={{ __html: formatJSON(conditionData) }}
                                />
                              </div>
                            );
                          }

                          // Show formatted view
                          if (conditionData && typeof conditionData === 'object') {
                            return renderConditionDetails(conditionData);
                          }

                          if (typeof conditionData === 'string' && conditionData.length > 0) {
                            // If it's a string, display it
                            return (
                              <div className={styles.conditionsRaw}>
                                <pre>{conditionData}</pre>
                              </div>
                            );
                          }

                          if (chainConditions?.raw && chainConditions.raw !== '0x') {
                            // If we only have raw hex data, display it
                            return (
                              <div className={styles.conditionsRaw}>
                                <pre>{chainConditions.raw.slice(0, 100)}...</pre>
                              </div>
                            );
                          }

                          return <div className={styles.noData}>No conditions set</div>;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signers Table */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Signers ({cohort?.signersCount || 0})</h2>
            <div className={styles.cardContent}>
              {cohort?.signers && cohort.signers.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Provider</th>
                        <th>Operator</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohort.signers.map((signer, index) => (
                        <tr key={index}>
                          <td className={styles.indexCell}>{index + 1}</td>
                          <td className={styles.addressCell}>
                            <a
                              href={`/address/${signer.provider || signer.address || signer}`}
                              className={styles.addressLink}
                            >
                              {formatString(signer.provider || signer.address || signer)}
                            </a>
                          </td>
                          <td className={styles.addressCell}>
                            {signer.operator ? (
                              <a
                                href={`/address/${signer.operator}`}
                                className={styles.addressLink}
                              >
                                {formatString(signer.operator)}
                              </a>
                            ) : (
                              <span className={styles.noData}>-</span>
                            )}
                          </td>
                          <td className={styles.statusCell}>
                            <span className={styles.signerStatus}>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.noData}>No signers found</div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Technical Details</h2>
            <div className={styles.cardContent}>
              <div className={styles.technicalDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cohort State</span>
                  <span className={styles.detailValue}>{cohort?.state}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Is Active</span>
                  <span className={styles.detailValue}>{String(cohort?.isActive)}</span>
                </div>
                {cohort?.dataHash && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data Hash</span>
                    <span className={styles.detailValue}>{cohort.dataHash}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className={styles.footer}>
          <button onClick={() => navigate('/cohorts')} className={styles.backButton}>
            ← Back to Cohorts
          </button>
        </div>
      </div>
    </div>
  );
};

export default SigningCohortDetail;