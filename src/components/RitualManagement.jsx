import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent, useAccount } from 'wagmi';
import { standardSubscriptionAbi, erc20Abi, accessControllerAbi } from '../config/contracts';
import { formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';
import styles from './RitualManagement.module.css';
import { getFeeModelInfo, getAccessControllerInfo } from '../utils/contractRegistry';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return 'Expired';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const short = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-';

export const RitualManagement = ({ ritual, defaultTab = null, section = null }) => {
  const { address: connectedAddress } = useAccount();
  const [currentPeriodSlots, setCurrentPeriodSlots] = useState('');
  const [nextPeriodSlots, setNextPeriodSlots] = useState('');
  const [encryptorList, setEncryptorList] = useState(['']);
  const [error, setError] = useState('');
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab || 'subscription');
  
  // If defaultTab is subscription, show both subscription and timeline content
  const showSubscriptionTimeline = defaultTab === 'subscription';
  
  // Get fee model address
  const feeModelAddress = ritual?.feeModel;
  
  // Detect access controller contract type
  const accessControllerInfo = useMemo(() => {
    if (!ritual?.accessController) return null;
    return getAccessControllerInfo(ritual.accessController, 'polygon');
  }, [ritual?.accessController]);
  
  const contractInterface = useMemo(() => {
    if (!accessControllerInfo) return null;
    return {
      canManageAccess: accessControllerInfo.type === 'managed_allow_list',
      isPublic: accessControllerInfo.type === 'global_allow_list' || accessControllerInfo.type === 'open_access'
    };
  }, [accessControllerInfo]);
  
  // Detect fee model contract type
  const feeModelInfo = useMemo(() => {
    if (!feeModelAddress) return null;
    return getFeeModelInfo(feeModelAddress, 'polygon');
  }, [feeModelAddress]);
  
  const feeModelInterface = useMemo(() => {
    if (!feeModelInfo) return null;
    return {
      hasPeriodicPayments: feeModelInfo.type === 'subscription',
      hasTimeline: feeModelInfo.type === 'subscription'
    };
  }, [feeModelInfo]);
  
  // Primary contract reads
  const { data: startOfSubscription } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'startOfSubscription',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: subscriptionDuration } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'subscriptionPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: yellowDuration } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'yellowPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: redDuration } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'redPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: maxNodes } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'maxNodes',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: encryptorFeeRate } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFeeRate',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: usedSlots } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'usedEncryptorSlots',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: endOfCurrentPeriod } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'endOfCurrentPeriod',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: billingInfo } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'billingInfo',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: currentPeriod } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'getCurrentPeriod',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: baseFeeRate } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'baseFeeRate',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: feeToken } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'feeToken',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: paymentMade } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'paymentMade',
    args: currentPeriod ? [currentPeriod] : undefined,
    enabled: Boolean(feeModelAddress && currentPeriod),
    chainId: polygon.id,
  });

  const { data: tokenAllowance } = useReadContract({
    address: feeToken,
    abi: erc20Abi,
    functionName: 'allowance',
    args: connectedAddress && feeModelAddress ? [connectedAddress, feeModelAddress] : undefined,
    enabled: Boolean(connectedAddress && feeToken && feeModelAddress),
    chainId: polygon.id,
  });

  const { data: currentPeriodFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'feeForEncryptorSlots',
    args: currentPeriodSlots ? [BigInt(currentPeriodSlots), BigInt(subscriptionDuration || 0)] : undefined,
    enabled: Boolean(feeModelAddress && currentPeriodSlots && subscriptionDuration),
    chainId: polygon.id,
  });

  const { data: nextPeriodBaseFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'feeForEncryptorSlots',
    args: [0n, BigInt(subscriptionDuration || 0)],
    enabled: Boolean(feeModelAddress && subscriptionDuration),
    chainId: polygon.id,
  });

  const { data: nextPeriodSlotFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'feeForEncryptorSlots',
    args: nextPeriodSlots ? [BigInt(nextPeriodSlots), BigInt(subscriptionDuration || 0)] : undefined,
    enabled: Boolean(feeModelAddress && nextPeriodSlots && subscriptionDuration),
    chainId: polygon.id,
  });

  const { writeContract, isPending } = useWriteContract();

  const nextPeriod = currentPeriod ? currentPeriod + 1n : 0n;
  const isCurrentPeriodPaid = paymentMade || false;
  
  const { data: nextPaymentMade } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'paymentMade',
    args: [nextPeriod],
    enabled: Boolean(feeModelAddress && nextPeriod),
    chainId: polygon.id,
  });
  
  const isNextPeriodPaid = nextPaymentMade || false;

  const formatFees = (fees) => {
    if (!fees) return '0';
    return formatUnits(fees, 18);
  };

  const canManage = connectedAddress && 
    connectedAddress.toLowerCase() === (ritual?.authority || ritual?.initiator)?.toLowerCase();

  const handlePayment = async (isNextPeriod) => {
    try {
      setError('');
      setIsPaymentPending(true);
      
      const slots = isNextPeriod ? nextPeriodSlots : currentPeriodSlots;
      const period = isNextPeriod ? nextPeriod : currentPeriod;
      
      if (!slots || !period) {
        throw new Error('Invalid slots or period');
      }

      const slotsAmount = BigInt(slots);
      
      const fees = await writeContract({
        address: feeModelAddress,
        abi: standardSubscriptionAbi,
        functionName: 'payForSubscription',
        args: [slotsAmount, period],
      });

      if (isNextPeriod) {
        setNextPeriodSlots('');
      } else {
        setCurrentPeriodSlots('');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setError(error.message || 'Payment failed');
    } finally {
      setIsPaymentPending(false);
    }
  };

  const handleApproveToken = async () => {
    try {
      setError('');
      const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      
      await writeContract({
        address: feeToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [feeModelAddress, maxApproval],
      });
    } catch (error) {
      console.error('Approval failed:', error);
      setError(error.message || 'Approval failed');
    }
  };

  const handleAddEncryptor = (index, value) => {
    const newList = [...encryptorList];
    newList[index] = value;
    setEncryptorList(newList);
  };

  const addNewEncryptorField = () => {
    setEncryptorList([...encryptorList, '']);
  };

  const removeEncryptorField = (index) => {
    const newList = encryptorList.filter((_, i) => i !== index);
    if (newList.length === 0) newList.push('');
    setEncryptorList(newList);
  };

  const handleEncryptors = async (isAdding) => {
    try {
      setError('');
      const validAddresses = encryptorList
        .filter(addr => addr && addr.trim())
        .map(addr => addr.trim());

      if (validAddresses.length === 0) {
        throw new Error('Please enter at least one address');
      }

      await writeContract({
        address: ritual?.accessController,
        abi: accessControllerAbi,
        functionName: isAdding ? 'authorize' : 'deauthorize',
        args: [validAddresses],
      });

      setEncryptorList(['']);
    } catch (error) {
      console.error('Encryptor management failed:', error);
      setError(error.message || 'Failed to manage encryptors');
    }
  };

  const needsTokenApproval = useMemo(() => {
    if (!tokenAllowance || !currentPeriodFees) return false;
    return tokenAllowance < currentPeriodFees;
  }, [tokenAllowance, currentPeriodFees]);

  const timelineData = useMemo(() => {
    if (!startOfSubscription || !subscriptionDuration || !yellowDuration || !redDuration) {
      return null;
    }
    
    const current = Math.floor(Date.now() / 1000);
    const start = Number(startOfSubscription);
    // If endOfCurrentPeriod is 0 or not set, calculate it from start + duration
    const end = endOfCurrentPeriod && Number(endOfCurrentPeriod) > 0 
      ? Number(endOfCurrentPeriod)
      : start + Number(subscriptionDuration);
    const yellowEnd = end + Number(yellowDuration);
    const redEnd = yellowEnd + Number(redDuration);
    const totalDuration = redEnd - start;
    
    // Calculate progress percentages
    const greenDuration = end - start;
    const yellowDurationNum = yellowEnd - end;
    const redDurationNum = redEnd - yellowEnd;
    
    const greenProgress = (greenDuration / totalDuration) * 100;
    const yellowProgress = (yellowDurationNum / totalDuration) * 100;
    const redProgress = (redDurationNum / totalDuration) * 100;
    
    // Calculate current position
    const elapsed = Math.min(Math.max(current - start, 0), totalDuration);
    const totalProgress = (elapsed / totalDuration) * 100;
    
    // Determine status text
    let statusText = 'Active';
    if (current >= redEnd) {
      statusText = 'Expired';
    } else if (current >= yellowEnd) {
      statusText = 'Critical';
    } else if (current >= end) {
      statusText = 'Warning';
    }
    
    return {
      current,
      start,
      end,
      yellowStart: end,
      redStart: yellowEnd,
      yellowEnd,
      redEnd,
      totalDuration,
      greenProgress,
      yellowProgress,
      redProgress,
      totalProgress,
      statusText,
      isInYellow: current >= end && current < yellowEnd,
      isInRed: current >= yellowEnd && current < redEnd,
      isExpired: current >= redEnd,
      timeUntilYellow: end - current,
      timeUntilRed: yellowEnd - current,
      timeUntilExpiry: redEnd - current,
    };
  }, [startOfSubscription, subscriptionDuration, yellowDuration, redDuration, endOfCurrentPeriod]);

  // ── Section-only renders (used when embedded in grid cards) ──────────
  if (section === 'feeModel') {
    return (
      <div className={styles.container}>
        {feeModelAddress ? (
          <div className={styles.cardContent}>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Contract:</span>
              <span className={styles.value}>{feeModelInfo?.displayName || 'Free Fee Model'}</span>
            </div>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Address:</span>
              <div className={styles.addressContainer}>
                <a href={`https://polygonscan.com/address/${feeModelAddress}`} target="_blank" rel="noopener noreferrer" className={styles.contractLink}>{short(feeModelAddress)}</a>
                <button className={styles.copyButton} onClick={() => navigator.clipboard.writeText(feeModelAddress)} title="Copy address">Copy</button>
              </div>
            </div>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Description:</span>
              <span className={styles.value}>{feeModelInfo?.description || 'No fees required'}</span>
            </div>
            {feeModelInterface?.hasPeriodicPayments && (
              <>
                <div className={styles.contractInfo}>
                  <span className={styles.label}>Billing:</span>
                  <span className={styles.value}>{subscriptionDuration ? formatDuration(Number(subscriptionDuration)) : 'N/A'}</span>
                </div>
                <div className={styles.contractInfo}>
                  <span className={styles.label}>Slots:</span>
                  <span className={styles.value}>{usedSlots !== undefined && maxNodes ? `${Number(usedSlots)} / ${Number(maxNodes)}` : 'N/A'}</span>
                </div>
                <div className={styles.contractInfo}>
                  <span className={styles.label}>Fee Rate:</span>
                  <span className={styles.value}>{encryptorFeeRate ? `${formatUnits(encryptorFeeRate, 18)} ${feeModelInfo?.paymentToken || 'DAI'}/slot` : 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.noFeeModel}><p>No fee model configured.</p></div>
        )}
      </div>
    );
  }

  if (section === 'encryptors') {
    return (
      <div className={styles.container}>
        {ritual?.accessController ? (
          <div className={styles.cardContent}>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Contract:</span>
              <span className={styles.value}>
                {accessControllerInfo?.displayName || 'Unknown'}
                {accessControllerInfo?.isProxy && ' (Proxy)'}
              </span>
            </div>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Address:</span>
              <div className={styles.addressContainer}>
                <a href={`https://polygonscan.com/address/${ritual.accessController}`} target="_blank" rel="noopener noreferrer" className={styles.contractLink}>{short(ritual.accessController)}</a>
                <button className={styles.copyButton} onClick={() => navigator.clipboard.writeText(ritual.accessController)} title="Copy address">Copy</button>
              </div>
            </div>
            <div className={styles.contractInfo}>
              <span className={styles.label}>Access:</span>
              <span className={styles.value}>
                {contractInterface?.isPublic !== undefined ? (contractInterface.isPublic ? 'Public' : 'Restricted') : 'Public'}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.noAccessController}><p>No access controller configured.</p></div>
        )}
      </div>
    );
  }

  if (section === 'timeline') {
    return (
      <div className={styles.container}>
        {timelineData && feeModelInterface?.hasTimeline && (
          <div className={styles.timelineSection}>
            <h3 className={styles.sectionTitle}>Subscription Timeline</h3>
            <div className={styles.timelineStats}>
              <div className={styles.timelineStat}>
                <span className={styles.statLabel}>Current Status</span>
                <span className={`${styles.statValue} ${timelineData.isExpired ? styles.expired : timelineData.isInRed ? styles.critical : timelineData.isInYellow ? styles.warning : styles.active}`}>{timelineData.statusText}</span>
              </div>
              <div className={styles.timelineStat}>
                <span className={styles.statLabel}>Time Remaining</span>
                <span className={styles.statValue}>{timelineData.isExpired ? 'Expired' : formatDuration(timelineData.timeUntilExpiry)}</span>
              </div>
            </div>
            <div className={styles.timelineBar}>
              <div className={`${styles.progressBar} ${styles.greenBar}`} style={{ width: `${timelineData.greenProgress}%` }} />
              <div className={`${styles.progressBar} ${styles.yellowBar}`} style={{ width: `${timelineData.yellowProgress}%`, left: `${timelineData.greenProgress}%` }} />
              <div className={`${styles.progressBar} ${styles.redBar}`} style={{ width: `${timelineData.redProgress}%`, left: `${timelineData.greenProgress + timelineData.yellowProgress}%` }} />
              <div className={styles.currentIndicator} style={{ left: `${timelineData.totalProgress}%` }} />
            </div>
            <div className={styles.timelineLabels}>
              <div className={styles.timelineLabel} style={{ left: '0%' }}>
                <span className={styles.labelTitle}>Start</span>
                <span className={styles.labelDate}>{formatTimestamp(startOfSubscription)}</span>
              </div>
              <div className={styles.timelineLabel} style={{ left: `${timelineData.greenProgress}%` }}>
                <span className={styles.labelTitle}>Yellow</span>
                <span className={styles.labelDate}>{formatTimestamp(timelineData.yellowStart)}</span>
              </div>
              <div className={styles.timelineLabel} style={{ left: `${timelineData.greenProgress + timelineData.yellowProgress}%` }}>
                <span className={styles.labelTitle}>Red</span>
                <span className={styles.labelDate}>{formatTimestamp(timelineData.redStart)}</span>
              </div>
              <div className={styles.timelineLabel} style={{ right: '0', left: 'auto' }}>
                <span className={styles.labelTitle}>Expiry</span>
                <span className={styles.labelDate}>{formatTimestamp(timelineData.redEnd)}</span>
              </div>
            </div>
          </div>
        )}

        {feeModelInterface?.hasPeriodicPayments && (
          <div className={styles.periodGrid}>
            <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <div>
                  <h3 className={styles.periodTitle}>Current Period</h3>
                  <span className={styles.periodNumber}>Period {currentPeriod?.toString() || '0'}</span>
                </div>
                <span className={`${styles.statusBadge} ${isCurrentPeriodPaid ? styles.paid : styles.unpaid}`}>
                  {isCurrentPeriodPaid ? '✓ Paid' : '⚠ Unpaid'}
                </span>
              </div>
              <div className={styles.slotMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{usedSlots?.toString() || '0'}</span>
                  <span className={styles.metricLabel}>Used</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{billingInfo?.[1]?.toString() || '0'}</span>
                  <span className={styles.metricLabel}>Paid</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{maxNodes?.toString() || '-'}</span>
                  <span className={styles.metricLabel}>Max</span>
                </div>
              </div>
              {!isCurrentPeriodPaid && !canManage && (
                <div className={styles.notAuthorizedInfo}><p>Connect with the ritual authority wallet to manage payments.</p></div>
              )}
            </div>

            <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <div>
                  <h3 className={styles.periodTitle}>Next Period</h3>
                  <span className={styles.periodNumber}>Period {nextPeriod?.toString() || '1'}</span>
                </div>
                <span className={`${styles.statusBadge} ${isNextPeriodPaid ? styles.paid : styles.available}`}>
                  {isNextPeriodPaid ? '✓ Paid' : 'Available'}
                </span>
              </div>
              {!isNextPeriodPaid && !canManage && (
                <div className={styles.notAuthorizedInfo}><p>Connect with the ritual authority wallet to manage payments.</p></div>
              )}
              {isNextPeriodPaid && (
                <div className={styles.paidInfo}><p>Next period payment has been completed.</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header - only show if no defaultTab is provided */}
      {!defaultTab && (
        <div className={styles.header}>
          <h2 className={styles.title}>Ritual Management</h2>
          <div className={styles.ritualInfo}>
            <span className={styles.label}>Ritual #{ritual?.id}</span>
            <span className={styles.authority}>Authority: {(ritual?.authority || ritual?.initiator)?.slice(0, 6)}...{(ritual?.authority || ritual?.initiator)?.slice(-4)}</span>
          </div>
        </div>
      )}

      {/* Tabs - only show if no defaultTab is provided */}
      {!defaultTab && (
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'subscription' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'encryptors' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('encryptors')}
          >
            Encryptors
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'timeline' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className={styles.subscriptionContent}>
            {/* Fee Model Contract Card */}
            <div className={styles.feeModelCard}>
              <h3 className={styles.cardTitle}>Fee Model Contract</h3>
              {feeModelAddress ? (
                <div className={styles.cardContent}>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Contract:</span>
                    <span className={styles.value}>{feeModelInfo?.displayName || 'Free Fee Model'}</span>
                  </div>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Address:</span>
                    <div className={styles.addressContainer}>
                      <a
                        href={`https://polygonscan.com/address/${feeModelAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.contractLink}
                      >
                        {short(feeModelAddress)}
                      </a>
                      <button
                        className={styles.copyButton}
                        onClick={() => navigator.clipboard.writeText(feeModelAddress)}
                        title="Copy address"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Description:</span>
                    <span className={styles.value}>{feeModelInfo?.description || 'No fees required'}</span>
                  </div>
                  {feeModelInterface?.hasPeriodicPayments && (
                    <>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Billing Period:</span>
                        <span className={styles.value}>
                          {subscriptionDuration ? formatDuration(Number(subscriptionDuration)) : 'N/A'}
                        </span>
                      </div>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Max Nodes:</span>
                        <span className={styles.value}>{maxNodes ? Number(maxNodes) : 'N/A'}</span>
                      </div>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Used Slots:</span>
                        <span className={styles.value}>
                          {usedSlots !== undefined && maxNodes ? 
                            `${Number(usedSlots)} / ${Number(maxNodes)}` : 
                            'N/A'}
                        </span>
                      </div>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Encryptor Fee Rate:</span>
                        <span className={styles.value}>
                          {encryptorFeeRate ? `${formatUnits(encryptorFeeRate, 18)} ${feeModelInfo?.paymentToken || 'tokens'} per slot` : 'N/A'}
                        </span>
                      </div>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Yellow Period:</span>
                        <span className={styles.value}>
                          {yellowDuration ? formatDuration(Number(yellowDuration)) : 'N/A'}
                        </span>
                      </div>
                      <div className={styles.contractInfo}>
                        <span className={styles.label}>Red Period:</span>
                        <span className={styles.value}>
                          {redDuration ? formatDuration(Number(redDuration)) : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.noFeeModel}>
                  <p>No fee model configured for this ritual.</p>
                  <p className={styles.subtext}>A fee model is required for subscription management.</p>
                </div>
              )}
            </div>

            {/* Subscription Timeline - show at top when in subscription tab and has timeline */}
            {showSubscriptionTimeline && timelineData && feeModelInterface?.hasTimeline && (
              <div className={styles.timelineSection}>
                <h3 className={styles.sectionTitle}>Subscription Timeline</h3>
                
                <div className={styles.timelineStats}>
                  <div className={styles.timelineStat}>
                    <span className={styles.statLabel}>Current Status</span>
                    <span className={`${styles.statValue} ${
                      timelineData.isExpired ? styles.expired :
                      timelineData.isInRed ? styles.critical :
                      timelineData.isInYellow ? styles.warning :
                      styles.active
                    }`}>
                      {timelineData.statusText}
                    </span>
                  </div>
                  <div className={styles.timelineStat}>
                    <span className={styles.statLabel}>Time Remaining</span>
                    <span className={styles.statValue}>
                      {timelineData.isExpired ? 'Expired' : formatDuration(timelineData.timeUntilExpiry)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.timelineBar}>
                  <div 
                    className={`${styles.progressBar} ${styles.greenBar}`}
                    style={{ 
                      width: `${timelineData.greenProgress}%`
                    }}
                  />
                  <div 
                    className={`${styles.progressBar} ${styles.yellowBar}`}
                    style={{ 
                      width: `${timelineData.yellowProgress}%`,
                      left: `${timelineData.greenProgress}%`
                    }}
                  />
                  <div 
                    className={`${styles.progressBar} ${styles.redBar}`}
                    style={{ 
                      width: `${timelineData.redProgress}%`,
                      left: `${timelineData.greenProgress + timelineData.yellowProgress}%`
                    }}
                  />
                  <div 
                    className={styles.currentIndicator}
                    style={{ left: `${timelineData.totalProgress}%` }}
                  />
                </div>
                
                <div className={styles.timelineLabels}>
                  <div className={styles.timelineLabel} style={{ left: '0%' }}>
                    <span className={styles.labelTitle}>Start</span>
                    <span className={styles.labelDate}>
                      {formatTimestamp(startOfSubscription)}
                    </span>
                  </div>
                  <div className={styles.timelineLabel} style={{ left: `${timelineData.greenProgress}%` }}>
                    <span className={styles.labelTitle}>Yellow Period</span>
                    <span className={styles.labelDate}>
                      {formatTimestamp(timelineData.yellowStart)}
                    </span>
                  </div>
                  <div className={styles.timelineLabel} style={{ left: `${timelineData.greenProgress + timelineData.yellowProgress}%` }}>
                    <span className={styles.labelTitle}>Red Period</span>
                    <span className={styles.labelDate}>
                      {formatTimestamp(timelineData.redStart)}
                    </span>
                  </div>
                  <div className={styles.timelineLabel} style={{ right: '0', left: 'auto' }}>
                    <span className={styles.labelTitle}>Expiry</span>
                    <span className={styles.labelDate}>
                      {formatTimestamp(timelineData.redEnd)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Period Card - only show for subscription models */}
            {feeModelInterface?.hasPeriodicPayments && (
              <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <div>
                  <h3 className={styles.periodTitle}>Current Period</h3>
                  <span className={styles.periodNumber}>Period {currentPeriod?.toString() || '0'}</span>
                </div>
                <span className={`${styles.statusBadge} ${isCurrentPeriodPaid ? styles.paid : styles.unpaid}`}>
                  {isCurrentPeriodPaid ? '✓ Paid' : '⚠ Unpaid'}
                </span>
              </div>

              <div className={styles.slotMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{usedSlots?.toString() || '0'}</span>
                  <span className={styles.metricLabel}>Used</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{billingInfo?.[1]?.toString() || '0'}</span>
                  <span className={styles.metricLabel}>Paid</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{maxNodes?.toString() || '-'}</span>
                  <span className={styles.metricLabel}>Max</span>
                </div>
              </div>

              {!isCurrentPeriodPaid && canManage && (
                <div className={styles.paymentForm}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      className={styles.slotInput}
                      placeholder="Number of slots"
                      value={currentPeriodSlots}
                      onChange={(e) => setCurrentPeriodSlots(e.target.value)}
                      disabled={isPending}
                      min="1"
                      max={maxNodes?.toString()}
                    />
                    <span className={styles.inputHint}>slots</span>
                  </div>
                  
                  {currentPeriodSlots && currentPeriodFees && (
                    <div className={styles.feePreview}>
                      <span className={styles.feeLabel}>Cost:</span>
                      <span className={styles.feeAmount}>{formatFees(currentPeriodFees)} DAI</span>
                    </div>
                  )}
                  
                  <button
                    className={`${styles.payButton} ${styles.primary}`}
                    onClick={() => handlePayment(false)}
                    disabled={isPending || !currentPeriodSlots}
                  >
                    {isPending ? 'Processing...' : 'Pay for Current Period'}
                  </button>
                </div>
              )}
              
              {!isCurrentPeriodPaid && !canManage && (
                <div className={styles.notAuthorizedInfo}>
                  <p>Connect with the ritual authority wallet to manage payments.</p>
                </div>
              )}
              </div>
            )}

            {/* Next Period Card - only show for subscription models */}
            {feeModelInterface?.hasPeriodicPayments && (
              <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <div>
                  <h3 className={styles.periodTitle}>Next Period</h3>
                  <span className={styles.periodNumber}>Period {nextPeriod?.toString() || '1'}</span>
                </div>
                <span className={`${styles.statusBadge} ${isNextPeriodPaid ? styles.paid : styles.available}`}>
                  {isNextPeriodPaid ? '✓ Paid' : 'Available'}
                </span>
              </div>

              {!isNextPeriodPaid && canManage && (
                <div className={styles.paymentForm}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      className={styles.slotInput}
                      placeholder="Number of slots"
                      value={nextPeriodSlots}
                      onChange={(e) => setNextPeriodSlots(e.target.value)}
                      disabled={isPending}
                      min="1"
                      max={maxNodes?.toString()}
                    />
                    <span className={styles.inputHint}>slots</span>
                  </div>
                  
                  {nextPeriodSlots && (nextPeriodBaseFees || nextPeriodSlotFees) && (
                    <div className={styles.feeBreakdown}>
                      <div className={styles.feeRow}>
                        <span className={styles.feeLabel}>Base Fee:</span>
                        <span className={styles.feeValue}>{formatFees(nextPeriodBaseFees)} DAI</span>
                      </div>
                      <div className={styles.feeRow}>
                        <span className={styles.feeLabel}>Slot Fee:</span>
                        <span className={styles.feeValue}>{formatFees(nextPeriodSlotFees)} DAI</span>
                      </div>
                      <div className={`${styles.feeRow} ${styles.total}`}>
                        <span className={styles.feeLabel}>Total:</span>
                        <span className={styles.feeAmount}>
                          {formatFees((nextPeriodBaseFees || 0n) + (nextPeriodSlotFees || 0n))} DAI
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    className={`${styles.payButton} ${styles.primary}`}
                    onClick={() => handlePayment(true)}
                    disabled={isPending || !nextPeriodSlots}
                  >
                    {isPending ? 'Processing...' : 'Pay for Next Period'}
                  </button>
                </div>
              )}
              
              {!isNextPeriodPaid && !canManage && (
                <div className={styles.notAuthorizedInfo}>
                  <p>Connect with the ritual authority wallet to manage payments.</p>
                </div>
              )}

              {isNextPeriodPaid && (
                <div className={styles.paidInfo}>
                  <p>Next period payment has been completed.</p>
                </div>
              )}
              </div>
            )}
          </div>
        )}

        {/* Encryptors Tab */}
        {activeTab === 'encryptors' && (
          <div className={styles.encryptorsContent}>
            {/* Access Controller Card */}
            <div className={styles.accessControllerCard}>
              <h3 className={styles.cardTitle}>Access Controller Contract</h3>
              {ritual?.accessController ? (
                <div className={styles.cardContent}>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Contract:</span>
                    <span className={styles.value}>
                      {accessControllerInfo?.displayName || 'Unknown'}
                      {accessControllerInfo?.isProxy && ' (Proxy)'}
                    </span>
                  </div>
                  {accessControllerInfo?.isProxy && accessControllerInfo?.implementation && (
                    <div className={styles.contractInfo}>
                      <span className={styles.label}>Implementation:</span>
                      <div className={styles.addressContainer}>
                        <a 
                          href={`https://polygonscan.com/address/${accessControllerInfo.implementation}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.contractLink}
                        >
                          {accessControllerInfo.implementation.slice(0, 10)}...{accessControllerInfo.implementation.slice(-8)}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Address:</span>
                    <div className={styles.addressContainer}>
                      <a
                        href={`https://polygonscan.com/address/${ritual.accessController}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.contractLink}
                      >
                        {short(ritual.accessController)}
                      </a>
                      <button
                        className={styles.copyButton}
                        onClick={() => navigator.clipboard.writeText(ritual.accessController)}
                        title="Copy address"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Description:</span>
                    <span className={styles.value}>{accessControllerInfo?.description || 'Allows all addresses to access the ritual'}</span>
                  </div>
                  <div className={styles.contractInfo}>
                    <span className={styles.label}>Access:</span>
                    <span className={styles.value}>
                      {contractInterface?.isPublic !== undefined 
                        ? (contractInterface.isPublic ? 'Public' : 'Restricted')
                        : 'Public'}
                      {contractInterface?.canManageAccess && ' (Manageable)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.noAccessController}>
                  <p>No access controller configured for this ritual.</p>
                  <p className={styles.subtext}>An access controller is required to manage encryptor authorizations.</p>
                </div>
              )}
            </div>
            
            {ritual?.accessController && canManage && (
              <div className={styles.encryptorSection}>
                <h3 className={styles.sectionTitle}>Manage Encryptor Addresses</h3>
              <p className={styles.sectionDescription}>
                Add or remove addresses that are authorized to encrypt data for this ritual.
              </p>

              <div className={styles.encryptorList}>
                {encryptorList.map((address, index) => (
                  <div key={index} className={styles.encryptorRow}>
                    <input
                      type="text"
                      className={styles.addressInput}
                      placeholder="0x..."
                      value={address}
                      onChange={(e) => handleAddEncryptor(index, e.target.value)}
                      disabled={isPending}
                    />
                    {encryptorList.length > 1 && (
                      <button
                        className={styles.removeButton}
                        onClick={() => removeEncryptorField(index)}
                        disabled={isPending}
                        title="Remove this address"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className={styles.addMoreButton}
                onClick={addNewEncryptorField}
                disabled={isPending}
              >
                + Add Another Address
              </button>

              <div className={styles.actionButtons}>
                <button
                  className={`${styles.actionButton} ${styles.authorize}`}
                  onClick={() => handleEncryptors(true)}
                  disabled={isPending || encryptorList.every(addr => !addr.trim())}
                >
                  Authorize Addresses
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deauthorize}`}
                  onClick={() => handleEncryptors(false)}
                  disabled={isPending || encryptorList.every(addr => !addr.trim())}
                >
                  Deauthorize Addresses
                </button>
              </div>
            </div>
            )}
            
            {ritual?.accessController && !canManage && (
              <div className={styles.notAuthorizedInfo}>
                <p>Connect with the ritual authority wallet to manage encryptor addresses.</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab - only show when timeline tab is active (not in subscription tab) */}
        {activeTab === 'timeline' && !showSubscriptionTimeline && timelineData && (
          <div className={styles.timelineContent}>
            <div className={styles.timelineSection}>
              <h3 className={styles.sectionTitle}>Subscription Timeline</h3>
              
              <div className={styles.timelineStats}>
                <div className={styles.timelineStat}>
                  <span className={styles.statLabel}>Current Status</span>
                  <span className={`${styles.statValue} ${
                    timelineData.isExpired ? styles.expired :
                    timelineData.isInRed ? styles.critical :
                    timelineData.isInYellow ? styles.warning :
                    styles.active
                  }`}>
                    {timelineData.isExpired ? 'Expired' :
                     timelineData.isInRed ? 'Final Period' :
                     timelineData.isInYellow ? 'Grace Period' :
                     'Active'}
                  </span>
                </div>
                
                {!timelineData.isExpired && (
                  <>
                    <div className={styles.timelineStat}>
                      <span className={styles.statLabel}>Time Until Grace</span>
                      <span className={styles.statValue}>
                        {timelineData.timeUntilYellow > 0 ? formatDuration(timelineData.timeUntilYellow) : 'In Grace'}
                      </span>
                    </div>
                    
                    <div className={styles.timelineStat}>
                      <span className={styles.statLabel}>Time Until Expiry</span>
                      <span className={styles.statValue}>
                        {formatDuration(timelineData.timeUntilExpiry)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.timelineBar}>
                <div className={styles.timelineTrack}>
                  {/* Active Period */}
                  <div 
                    className={`${styles.timelineSegment} ${styles.active} ${
                      timelineData.current >= timelineData.start && timelineData.current < timelineData.end 
                        ? styles.current : ''
                    }`}
                    style={{ width: `${((timelineData.end - timelineData.start) / timelineData.totalDuration) * 100}%` }}
                  >
                    <span className={styles.segmentLabel}>Active</span>
                  </div>

                  {/* Grace Period */}
                  <div 
                    className={`${styles.timelineSegment} ${styles.grace} ${
                      timelineData.isInYellow ? styles.current : ''
                    }`}
                    style={{ width: `${((timelineData.yellowEnd - timelineData.end) / timelineData.totalDuration) * 100}%` }}
                  >
                    <span className={styles.segmentLabel}>Grace</span>
                  </div>

                  {/* Final Period */}
                  <div 
                    className={`${styles.timelineSegment} ${styles.final} ${
                      timelineData.isInRed ? styles.current : ''
                    }`}
                    style={{ width: `${((timelineData.redEnd - timelineData.yellowEnd) / timelineData.totalDuration) * 100}%` }}
                  >
                    <span className={styles.segmentLabel}>Final</span>
                  </div>

                  {/* Current Position Indicator */}
                  {!timelineData.isExpired && (
                    <div 
                      className={styles.currentIndicator}
                      style={{ 
                        left: `${Math.min(((timelineData.current - timelineData.start) / timelineData.totalDuration) * 100, 100)}%` 
                      }}
                    >
                      <span className={styles.indicatorTooltip}>Now</span>
                    </div>
                  )}
                </div>

                <div className={styles.timelineDates}>
                  <span>{formatTimestamp(timelineData.start)}</span>
                  <span>{formatTimestamp(timelineData.end)}</span>
                  <span>{formatTimestamp(timelineData.yellowEnd)}</span>
                  <span>{formatTimestamp(timelineData.redEnd)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>!</span>
          {error}
        </div>
      )}
    </div>
  );
};