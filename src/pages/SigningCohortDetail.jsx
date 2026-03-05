import React, { useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./SigningCohortDetail.module.css";
import { formatString, formatDate, calculateTimeMoment, formatTimeToText, getSigningCohortDetail, getOpExecutionsByDomain } from "./data";
import PolicyComposer from "../components/PolicyComposer";
import ConditionRenderer from "../components/ConditionRenderer";

const SigningCohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [showPolicyComposer, setShowPolicyComposer] = useState(false);
  const [opExecutions, setOpExecutions] = useState([]);

  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        console.log(`Fetching cohort ${id} details from v2 subgraph...`);
        const cohortData = await getSigningCohortDetail(id);

        if (!cohortData) {
          setError("Cohort not found");
        } else {
          // Transform to expected format
          const resolvedSigners = cohortData.signers?.length
            ? cohortData.signers
            : (cohortData.participants || []);

          const decodeConditions = (hex) => {
            if (!hex || hex === '0x') return null;
            try {
              const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
              const bytes = new Uint8Array(raw.match(/.{1,2}/g).map(b => parseInt(b, 16)));
              return JSON.parse(new TextDecoder().decode(bytes));
            } catch {
              return null;
            }
          };

          const conditionsDecoded = decodeConditions(cohortData.conditions);
          const transformed = {
            id: cohortData.id,
            signers: resolvedSigners.map(addr => ({ provider: addr, address: addr })),
            signersCount: resolvedSigners.length,
            threshold: cohortData.multisig?.threshold || cohortData.threshold || 0,
            isActive: cohortData.status === 'DEPLOYED' || cohortData.status === 'CONDITIONS_SET',
            state: cohortData.status?.replace(/_/g, ' ') || 'Unknown',
            conditions: conditionsDecoded
              ? { [cohortData.chainId]: { decoded: conditionsDecoded, raw: cohortData.conditions } }
              : (cohortData.conditions ? { [cohortData.chainId]: cohortData.conditions } : {}),
            chains: cohortData.chainId ? [cohortData.chainId.toString()] : [],
            // V2 extended data
            authority: cohortData.authority,
            isDeployed: cohortData.isDeployed,
            deployedAt: cohortData.deployedAt,
            multisigAddress: cohortData.multisigAddress,
            signatures: cohortData.signatures || [],
            multisig: cohortData.multisig,
            createdAt: cohortData.createdAt,
            updatedAt: cohortData.updatedAt,
          };
          setCohort(transformed);

          // Fetch op executions by domain
          if (cohortData.domain) {
            const opExecs = await getOpExecutionsByDomain(cohortData.domain);
            setOpExecutions(opExecs);
          }
        }
      } catch (error) {
        console.error("Error fetching cohort details:", error);
        setError("Failed to load cohort details");
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
            <button
              onClick={() => navigate("/cohorts")}
              className={styles.backButton}
            >
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
              <a href="/cohorts" className={styles.breadcrumbLink}>
                Signing Cohorts
              </a>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Cohort #{id}</span>
            </div>
            <h1 className={styles.title}>Signing Cohort #{id}</h1>
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>Status</span>
                <span
                  className={`${styles.status} ${cohort?.isActive ? styles.active : styles.inactive}`}
                >
                  {cohort?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>State</span>
                <span className={styles.headerStatValue}>
                  {cohort?.state || "Unknown"}
                </span>
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

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tab} ${activeTab === "overview" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === "multisig" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("multisig")}
          >
            Multisig Activity
            {cohort?.multisig?.executions?.length > 0 && (
              <span className={styles.tabBadge}>{cohort.multisig.executions.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "executions" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("executions")}
          >
            Executions
            {opExecutions.length > 0 && (
              <span className={styles.tabBadge}>{opExecutions.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "policies" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("policies")}
          >
            Policies
            {cohort?.conditions &&
              Object.keys(cohort.conditions).length > 0 && (
                <span className={styles.tabBadge}>
                  {Object.keys(cohort.conditions).length}
                </span>
              )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "signatures" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("signatures")}
          >
            Signatures
            {cohort?.signatures?.length > 0 && (
              <span className={styles.tabBadge}>{cohort.signatures.length}</span>
            )}
          </button>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Overview Tab Content */}
          {activeTab === "overview" && (
            <>
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
                      <span className={styles.infoValue}>
                        {cohort?.signersCount}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>
                        Signature Threshold
                      </span>
                      <span className={styles.infoValue}>
                        {cohort?.threshold}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Active Status</span>
                      <span className={styles.infoValue}>
                        {cohort?.isActive ? "Yes" : "No"}
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
                          <span className={styles.chainId}>
                            Chain ID: {chain}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Signers Table */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  Signers ({cohort?.signersCount || 0})
                </h2>
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
                                  {formatString(
                                    signer.provider || signer.address || signer,
                                  )}
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
                      <span className={styles.detailValue}>
                        {cohort?.state}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Deployed</span>
                      <span className={styles.detailValue}>
                        {cohort?.isDeployed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {cohort?.authority && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Authority</span>
                        <a href={`/address/${cohort.authority}`} className={styles.addressLink}>
                          {formatString(cohort.authority)}
                        </a>
                      </div>
                    )}
                    {cohort?.multisigAddress && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Multisig Address</span>
                        <span className={styles.detailValue} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {cohort.multisigAddress}
                        </span>
                      </div>
                    )}
                    {cohort?.deployedAt && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Deployed At</span>
                        <span className={styles.detailValue}>
                          {new Date(parseInt(cohort.deployedAt) * 1000).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {cohort?.createdAt && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created</span>
                        <span className={styles.detailValue}>
                          {formatTimeToText(parseInt(cohort.createdAt) * 1000)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Policies Tab Content */}
          {activeTab === "policies" && (
            <>
              {/* Add New Policy Section */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Add New Policy</h2>
                  <button
                    className={styles.toggleButton}
                    onClick={() => setShowPolicyComposer(!showPolicyComposer)}
                    title={showPolicyComposer ? "Collapse" : "Expand"}
                  >
                    <svg
                      className={styles.toggleIcon}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      {showPolicyComposer ? (
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                  </button>
                </div>
                {showPolicyComposer && (
                  <PolicyComposer
                    onSave={(policyData) => {
                      console.log("New policy created:", policyData);
                      // TODO: Send to blockchain or save to state
                      setShowPolicyComposer(false);
                    }}
                    chainId={cohort?.chains?.[0] || "11155111"}
                  />
                )}
              </div>

              {/* Existing Policies */}
              {cohort?.conditions &&
                Object.keys(cohort.conditions).length > 0 && (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>Existing Policies</h2>
                      <button
                        className={styles.globalJsonToggle}
                        onClick={() => {
                          const allChainIds = Object.keys(cohort.conditions);
                          const allShowing = allChainIds.every(
                            (id) => showRawJson[id],
                          );
                          const newState = {};
                          allChainIds.forEach((id) => {
                            newState[id] = !allShowing;
                          });
                          setShowRawJson(newState);
                        }}
                        title="Toggle all JSON views"
                      >
                        <svg
                          className={styles.jsonIcon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {Object.values(showRawJson).some((v) => v)
                          ? "Hide All JSON"
                          : "Show All JSON"}
                      </button>
                    </div>
                    <div className={styles.cardContent}>
                      {Object.entries(cohort.conditions).map(
                        ([chainId, chainConditions]) => {
                          const chainName =
                            chainId === "11155111"
                              ? "Sepolia"
                              : chainId === "80002"
                                ? "Polygon Amoy"
                                : chainId === "84532"
                                  ? "Base Sepolia"
                                  : chainId === "1"
                                    ? "Ethereum Mainnet"
                                    : `Chain ${chainId}`;

                          return (
                            <div key={chainId} className={styles.chainSection}>
                              <div className={styles.chainHeader}>
                                <span className={styles.chainLabel}>
                                  {chainName.toUpperCase()}
                                </span>
                                {chainConditions?.decoded && (
                                  <button
                                    className={styles.jsonToggle}
                                    onClick={() =>
                                      setShowRawJson((prev) => ({
                                        ...prev,
                                        [chainId]: !prev[chainId],
                                      }))
                                    }
                                    title={
                                      showRawJson[chainId]
                                        ? "Show formatted view"
                                        : "Show raw JSON"
                                    }
                                  >
                                    {showRawJson[chainId] ? (
                                      <>
                                        <svg
                                          className={styles.jsonIcon}
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path
                                            fillRule="evenodd"
                                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        View
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className={styles.jsonIcon}
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        JSON
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className={styles.conditionsContainer}>
                                {(() => {
                                  const conditionData =
                                    chainConditions?.decoded || chainConditions;

                                  // Show raw JSON if toggle is active
                                  if (showRawJson[chainId] && conditionData) {
                                    return (
                                      <div className={styles.jsonContainer}>
                                        <div className={styles.jsonHeader}>
                                          <button
                                            className={styles.copyJsonButton}
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                JSON.stringify(
                                                  conditionData,
                                                  null,
                                                  2,
                                                ),
                                              );
                                            }}
                                            title="Copy JSON to clipboard"
                                          >
                                            Copy JSON
                                          </button>
                                        </div>
                                        <pre className={styles.jsonContent}>
                                          {JSON.stringify(
                                            conditionData,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </div>
                                    );
                                  }

                                  // Show formatted view
                                  if (
                                    conditionData &&
                                    typeof conditionData === "object"
                                  ) {
                                    return (
                                      <ConditionRenderer
                                        conditionData={conditionData}
                                      />
                                    );
                                  }

                                  if (
                                    typeof conditionData === "string" &&
                                    conditionData.length > 0
                                  ) {
                                    // If it's a string, display it
                                    return (
                                      <div className={styles.conditionsRaw}>
                                        <pre>{conditionData}</pre>
                                      </div>
                                    );
                                  }

                                  if (
                                    chainConditions?.raw &&
                                    chainConditions.raw !== "0x"
                                  ) {
                                    // If we only have raw hex data, display it
                                    return (
                                      <div className={styles.conditionsRaw}>
                                        <pre>
                                          {chainConditions.raw.slice(0, 100)}...
                                        </pre>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className={styles.noData}>
                                      No conditions set
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

              {/* Empty state - only show when no existing policies */}
              {(!cohort?.conditions ||
                Object.keys(cohort.conditions).length === 0) && (
                <div className={styles.card}>
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>
                      No existing policies
                    </p>
                    <p className={styles.emptyStateDescription}>
                      Use the form above to create transaction limits and access
                      controls for this cohort.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Signatures Tab */}
          {activeTab === "signatures" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Signatures ({cohort?.signatures?.length || 0})</h2>
              <div className={styles.cardContent}>
                {cohort?.signatures?.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Provider</th>
                          <th>Signer</th>
                          <th>Time</th>
                          <th>Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohort.signatures.map((sig, idx) => (
                          <tr key={idx}>
                            <td className={styles.addressCell}>
                              <a href={`/address/${sig.provider}`} className={styles.addressLink}>
                                {formatString(sig.provider)}
                              </a>
                            </td>
                            <td className={styles.addressCell}>
                              {formatString(sig.signer)}
                            </td>
                            <td>{sig.timestamp ? formatTimeToText(parseInt(sig.timestamp) * 1000) : '-'}</td>
                            <td>
                              {sig.transactionHash ? (
                                <a
                                  href={`https://basescan.org/tx/${sig.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.addressLink}
                                >
                                  {formatString(sig.transactionHash)}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.noData}>No signatures recorded</div>
                )}
              </div>
            </div>
          )}

          {/* Multisig Activity Tab */}
          {activeTab === "multisig" && (
            <>
              {cohort?.multisig ? (
                <>
                  {/* Multisig Clone Info */}
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Multisig Clone</h2>
                    <div className={styles.cardContent}>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Clone Address</span>
                          <a
                            href={`https://basescan.org/address/${cohort.multisig.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.addressLink}
                            style={{ fontSize: '12px' }}
                          >
                            {cohort.multisig.id}
                          </a>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Threshold</span>
                          <span className={styles.infoValue}>
                            {cohort.multisig.threshold} of {cohort.multisig.signers?.length || cohort?.signersCount}
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Execution Count</span>
                          <span className={styles.infoValue}>{cohort.multisig.executionCount}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Total Value</span>
                          <span className={styles.infoValue}>{cohort.multisig.totalValue || '0'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Cleared</span>
                          <span className={styles.infoValue}>{cohort.multisig.isCleared ? 'Yes' : 'No'}</span>
                        </div>
                        {cohort.multisig.lastExecutedAt && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Last Executed</span>
                            <span className={styles.infoValue}>
                              {formatTimeToText(parseInt(cohort.multisig.lastExecutedAt) * 1000)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Signers list */}
                      {cohort.multisig.signers?.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <span className={styles.infoLabel}>Signers</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            {cohort.multisig.signers.map((signer, idx) => (
                              <a
                                key={idx}
                                href={`https://basescan.org/address/${signer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.addressLink}
                                style={{ fontSize: '11px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}
                              >
                                {formatString(signer)}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multisig Executions Table */}
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                      Multisig Executions ({cohort.multisig.executions?.length || 0})
                    </h2>
                    <div className={styles.cardContent}>
                      {cohort.multisig.executions?.length > 0 ? (
                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>Nonce</th>
                                <th>Executor</th>
                                <th>Target</th>
                                <th>Value</th>
                                <th>Gas</th>
                                <th>Time</th>
                                <th>Tx Hash</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cohort.multisig.executions.map((exec, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600 }}>{exec.nonce}</td>
                                  <td className={styles.addressCell}>
                                    <a href={`https://basescan.org/address/${exec.sender}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                      {formatString(exec.sender)}
                                    </a>
                                  </td>
                                  <td className={styles.addressCell}>
                                    <a href={`https://basescan.org/address/${exec.destination}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                      {formatString(exec.destination)}
                                    </a>
                                  </td>
                                  <td>{exec.value || '0'}</td>
                                  <td style={{ color: '#6b7280', fontSize: '11px' }}>{exec.gasUsed || '-'}</td>
                                  <td>{exec.timestamp ? formatTimeToText(parseInt(exec.timestamp) * 1000) : '-'}</td>
                                  <td>
                                    {exec.transactionHash ? (
                                      <a href={`https://basescan.org/tx/${exec.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                        {formatString(exec.transactionHash)}
                                      </a>
                                    ) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={styles.noData}>No executions recorded</div>
                      )}
                    </div>
                  </div>

                  {/* Signer Events */}
                  {cohort.multisig.signerEvents?.length > 0 && (
                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>Signer Events</h2>
                      <div className={styles.cardContent}>
                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>Event</th>
                                <th>Signer</th>
                                <th>New Signer</th>
                                <th>Time</th>
                                <th>Tx Hash</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cohort.multisig.signerEvents.map((evt, idx) => (
                                <tr key={idx}>
                                  <td>{evt.eventType?.replace(/_/g, ' ')}</td>
                                  <td className={styles.addressCell}>
                                    <a href={`https://basescan.org/address/${evt.signer}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                      {formatString(evt.signer)}
                                    </a>
                                  </td>
                                  <td className={styles.addressCell}>
                                    {evt.newSigner ? (
                                      <a href={`https://basescan.org/address/${evt.newSigner}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                        {formatString(evt.newSigner)}
                                      </a>
                                    ) : '-'}
                                  </td>
                                  <td>{evt.timestamp ? formatTimeToText(parseInt(evt.timestamp) * 1000) : '-'}</td>
                                  <td>
                                    {evt.transactionHash ? (
                                      <a href={`https://basescan.org/tx/${evt.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                        {formatString(evt.transactionHash)}
                                      </a>
                                    ) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.card}>
                  <div className={styles.noData}>No multisig deployed for this cohort</div>
                </div>
              )}
            </>
          )}

          {/* Executions Tab (Op Executions - Base L2) */}
          {activeTab === "executions" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                Op Executions — Base L2 ({opExecutions.length})
              </h2>
              <div className={styles.cardContent}>
                {opExecutions.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Target</th>
                          <th>Result</th>
                          <th>Gas</th>
                          <th>Time</th>
                          <th>Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opExecutions.map((exec, idx) => (
                          <tr key={idx}>
                            <td className={styles.addressCell}>
                              <a href={`https://basescan.org/address/${exec.target}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                {formatString(exec.target)}
                              </a>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: exec.result === 'true' || exec.result === '1' ? '#d1fae5' : '#fee2e2',
                                color: exec.result === 'true' || exec.result === '1' ? '#059669' : '#dc2626',
                              }}>
                                {exec.result === 'true' || exec.result === '1' ? 'Success' : exec.result || 'Unknown'}
                              </span>
                            </td>
                            <td style={{ color: '#6b7280', fontSize: '11px' }}>{exec.gasUsed || '-'}</td>
                            <td>{exec.timestamp ? formatTimeToText(parseInt(exec.timestamp) * 1000) : '-'}</td>
                            <td>
                              {exec.transactionHash ? (
                                <a href={`https://basescan.org/tx/${exec.transactionHash}`} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                                  {formatString(exec.transactionHash)}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.noData}>No op executions found for this cohort's domain</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className={styles.footer}>
          <button
            onClick={() => navigate("/cohorts")}
            className={styles.backButton}
          >
            ← Back to Cohorts
          </button>
        </div>
      </div>
    </div>
  );
};

export default SigningCohortDetail;
