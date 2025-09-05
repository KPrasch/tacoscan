import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent, useAccount } from 'wagmi';
import { standardSubscriptionAbi, erc20Abi, accessControllerAbi } from '../config/contracts';
import { formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';
import styles from './RitualManagement.module.css';

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

export const RitualManagement = ({ ritual }) => {
  const { address: connectedAddress } = useAccount();
  const [currentPeriodSlots, setCurrentPeriodSlots] = useState('');
  const [nextPeriodSlots, setNextPeriodSlots] = useState('');
  const [encryptorList, setEncryptorList] = useState(['']);
  const [error, setError] = useState('');
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');
  
  // Get fee model address
  const feeModelAddress = ritual?.feeModel;
  
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
    connectedAddress.toLowerCase() === ritual?.initiator?.toLowerCase();

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
    
    return {
      current,
      start,
      end,
      yellowEnd,
      redEnd,
      totalDuration,
      isInYellow: current >= end && current < yellowEnd,
      isInRed: current >= yellowEnd && current < redEnd,
      isExpired: current >= redEnd,
      timeUntilYellow: end - current,
      timeUntilRed: yellowEnd - current,
      timeUntilExpiry: redEnd - current,
    };
  }, [startOfSubscription, subscriptionDuration, yellowDuration, redDuration, endOfCurrentPeriod]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Ritual Management</h2>
        <div className={styles.ritualInfo}>
          <span className={styles.label}>Ritual #{ritual?.id}</span>
          <span className={styles.authority}>Authority: {ritual?.initiator?.slice(0, 6)}...{ritual?.initiator?.slice(-4)}</span>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Subscription Tab */}
        {activeTab === 'subscription' && canManage && (
          <div className={styles.subscriptionContent}>
            {/* Current Period Card */}
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

              {!isCurrentPeriodPaid && (
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
            </div>

            {/* Next Period Card */}
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

              {!isNextPeriodPaid && (
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

              {isNextPeriodPaid && (
                <div className={styles.paidInfo}>
                  <p>Next period payment has been completed.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Encryptors Tab */}
        {activeTab === 'encryptors' && canManage && ritual?.accessController && (
          <div className={styles.encryptorsContent}>
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
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && timelineData && (
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

        {/* Not Authorized Message */}
        {!canManage && (
          <div className={styles.notAuthorized}>
            <div className={styles.warningCard}>
              <h3>Not Authorized</h3>
              <p>Connect with the ritual authority wallet to manage this ritual.</p>
              <p className={styles.authorityInfo}>
                Authority: <span className={styles.address}>{ritual?.initiator}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};