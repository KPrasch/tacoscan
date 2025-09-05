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
  const [encryptors, setEncryptors] = useState('');
  const [error, setError] = useState('');
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  
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

  // Calculate current period
  const currentPeriod = useMemo(() => {
    if (!startOfSubscription || !subscriptionDuration) return BigInt(0);
    
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const startTime = BigInt(startOfSubscription);
    const duration = BigInt(subscriptionDuration);
    
    if (currentTime < startTime) return BigInt(0);
    
    return (currentTime - startTime) / duration;
  }, [startOfSubscription, subscriptionDuration]);

  const nextPeriod = currentPeriod + BigInt(1);

  // Get billing info for current period
  const { data: billingInfo } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'billingInfo',
    args: [currentPeriod],
    enabled: Boolean(feeModelAddress && currentPeriod >= 0),
    chainId: polygon.id,
  });

  // Check if periods are paid
  const { data: isCurrentPeriodPaid } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'isPeriodPaid',
    args: [currentPeriod],
    enabled: Boolean(feeModelAddress && currentPeriod >= 0),
    chainId: polygon.id,
  });

  const { data: isNextPeriodPaid } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'isPeriodPaid',
    args: [nextPeriod],
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  // Calculate fees
  const { data: currentPeriodFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFees',
    args: currentPeriodSlots && subscriptionDuration ? [BigInt(currentPeriodSlots), subscriptionDuration] : undefined,
    enabled: Boolean(feeModelAddress && currentPeriodSlots && subscriptionDuration),
    chainId: polygon.id,
  });

  const { data: nextPeriodBaseFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'baseFees',
    args: [nextPeriod],
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
  });

  const { data: nextPeriodSlotFees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFees',
    args: nextPeriodSlots && subscriptionDuration ? [BigInt(nextPeriodSlots), subscriptionDuration] : undefined,
    enabled: Boolean(feeModelAddress && nextPeriodSlots && subscriptionDuration),
    chainId: polygon.id,
  });

  // Calculate timeline data
  const timelineData = useMemo(() => {
    if (!startOfSubscription || !subscriptionDuration || !yellowDuration || !redDuration) {
      return null;
    }

    const start = Number(startOfSubscription);
    const end = start + Number(subscriptionDuration);
    const yellowEnd = end + Number(yellowDuration);
    const redEnd = yellowEnd + Number(redDuration);
    const current = Math.floor(Date.now() / 1000);

    return {
      start,
      end,
      yellowEnd,
      redEnd,
      current,
      totalDuration: redEnd - start,
    };
  }, [startOfSubscription, subscriptionDuration, yellowDuration, redDuration]);

  // Get current status
  const currentStatus = useMemo(() => {
    if (!timelineData) return { status: 'unknown', label: 'Unknown' };

    const now = timelineData.current;
    
    if (now < timelineData.end) {
      return { 
        status: 'active', 
        label: 'Active', 
        timeLeft: timelineData.end - now 
      };
    } else if (now < timelineData.yellowEnd) {
      return { 
        status: 'grace', 
        label: 'Grace Period', 
        timeLeft: timelineData.yellowEnd - now 
      };
    } else if (now < timelineData.redEnd) {
      return { 
        status: 'final', 
        label: 'Final Period', 
        timeLeft: timelineData.redEnd - now 
      };
    } else {
      return { 
        status: 'expired', 
        label: 'Expired', 
        timeLeft: 0 
      };
    }
  }, [timelineData]);

  // Write contract hooks
  const { writeContract: writeToken, isPending: isTokenPending } = useWriteContract();
  const { writeContract: writeSubscription, isPending: isSubscriptionPending } = useWriteContract();
  const { writeContract: writeAccessControl, isPending: isAccessPending } = useWriteContract();

  const isPending = isPaymentPending || isTokenPending || isSubscriptionPending || isAccessPending;

  // Handle payment
  const handlePayment = async (isNext = false) => {
    const slots = isNext ? nextPeriodSlots : currentPeriodSlots;
    
    if (!slots || Number(slots) <= 0) {
      setError('Please enter a valid number of slots');
      return;
    }

    try {
      setIsPaymentPending(true);
      setError('');

      // Calculate total fees
      const fees = isNext 
        ? (nextPeriodBaseFees || 0n) + (nextPeriodSlotFees || 0n)
        : currentPeriodFees || 0n;

      // First approve token transfer
      // Note: You'll need to get the fee token address from the contract
      const feeTokenAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'; // DAI on Polygon
      
      await writeToken({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [feeModelAddress, fees],
        chainId: polygon.id,
      });

      // Then pay for slots
      await writeSubscription({
        address: feeModelAddress,
        abi: standardSubscriptionAbi,
        functionName: isNext ? 'payForSubscription' : 'payForEncryptorSlots',
        args: [BigInt(slots)],
        chainId: polygon.id,
      });

      // Clear form
      if (isNext) {
        setNextPeriodSlots('');
      } else {
        setCurrentPeriodSlots('');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaymentPending(false);
    }
  };

  // Handle encryptor management
  const handleEncryptors = async (isAdding = true) => {
    if (!encryptors) {
      setError('Please enter encryptor addresses');
      return;
    }

    const encryptorList = encryptors.split(',').map(addr => addr.trim()).filter(Boolean);
    
    if (encryptorList.length === 0) {
      setError('Please enter valid addresses');
      return;
    }

    try {
      setIsPaymentPending(true);
      setError('');

      await writeAccessControl({
        address: ritual.accessController,
        abi: accessControllerAbi,
        functionName: isAdding ? 'authorize' : 'deauthorize',
        args: [BigInt(ritual.id), encryptorList],
        chainId: polygon.id,
      });

      setEncryptors('');
    } catch (err) {
      console.error('Encryptor management error:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setIsPaymentPending(false);
    }
  };

  const formatFees = (fees) => {
    if (!fees) return '0';
    return parseFloat(formatUnits(fees, 18)).toFixed(4);
  };

  // Only show management if user is the authority
  const canManage = connectedAddress && 
    ritual?.authority && 
    connectedAddress.toLowerCase() === ritual.authority.toLowerCase();

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Status Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>
          Subscription Status
          <span className={`${styles.statusBadge} ${styles[currentStatus.status]}`}>
            <span className={styles.statusDot}></span>
            {currentStatus.label}
          </span>
        </h3>

        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Current Period</div>
            <div className={styles.infoValue}>{currentPeriod?.toString() || '0'}</div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Time Remaining</div>
            <div className={`${styles.infoValue} ${currentStatus.status === 'active' ? styles.green : ''}`}>
              {formatDuration(currentStatus.timeLeft)}
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Max Encryptors</div>
            <div className={styles.infoValue}>{maxNodes?.toString() || '-'}</div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Fee Rate</div>
            <div className={`${styles.infoValue} ${styles.small}`}>
              {encryptorFeeRate ? formatUnits(encryptorFeeRate, 18) : '-'} DAI/slot/s
            </div>
          </div>
        </div>

        {/* Timeline */}
        {timelineData && (
          <div className={styles.timelineWrapper}>
            <div className={styles.timeline}>
              {/* Active Period */}
              <div 
                className={`${styles.timelinePeriod} ${styles.active} ${
                  timelineData.current >= timelineData.start && timelineData.current < timelineData.end 
                    ? '' : styles.inactive
                }`}
                style={{ width: `${((timelineData.end - timelineData.start) / timelineData.totalDuration) * 100}%` }}
              >
                <span className={styles.timelineLabel}>Active</span>
                <span className={`${styles.timelineDate} ${styles.start}`}>
                  {formatTimestamp(timelineData.start)}
                </span>
              </div>

              {/* Grace Period */}
              <div 
                className={`${styles.timelinePeriod} ${styles.grace} ${
                  timelineData.current >= timelineData.end && timelineData.current < timelineData.yellowEnd 
                    ? '' : styles.inactive
                }`}
                style={{ width: `${((timelineData.yellowEnd - timelineData.end) / timelineData.totalDuration) * 100}%` }}
              >
                <span className={styles.timelineLabel}>Grace</span>
              </div>

              {/* Final Period */}
              <div 
                className={`${styles.timelinePeriod} ${styles.final} ${
                  timelineData.current >= timelineData.yellowEnd && timelineData.current < timelineData.redEnd 
                    ? '' : styles.inactive
                }`}
                style={{ width: `${((timelineData.redEnd - timelineData.yellowEnd) / timelineData.totalDuration) * 100}%` }}
              >
                <span className={styles.timelineLabel}>Final</span>
                <span className={`${styles.timelineDate} ${styles.end}`}>
                  {formatTimestamp(timelineData.redEnd)}
                </span>
              </div>

              {/* Current Time Indicator */}
              {timelineData.current >= timelineData.start && timelineData.current <= timelineData.redEnd && (
                <div 
                  className={styles.currentIndicator}
                  style={{ 
                    left: `${((timelineData.current - timelineData.start) / timelineData.totalDuration) * 100}%` 
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Section - Only show if can manage */}
      {canManage && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeader}>
            Subscription Payment
          </h3>

          <div className={styles.paymentSection}>
            {/* Current Period Payment */}
            <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <span className={styles.periodTitle}>
                  Current Period ({currentPeriod?.toString() || '0'})
                </span>
                <span className={styles.periodStatus}>
                  {isCurrentPeriodPaid ? (
                    <>✓ Paid</>
                  ) : (
                    <>⚠️ Unpaid</>
                  )}
                </span>
              </div>

              <div className={styles.slotInfo}>
                <span className={styles.used}>{usedSlots?.toString() || '0'}</span>
                <span>used of</span>
                <span className={styles.paid}>{billingInfo?.[1]?.toString() || '0'}</span>
                <span>paid</span>
                <span className={styles.max}>(max {maxNodes?.toString() || '-'})</span>
              </div>

              <div className={styles.inputGroup}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Number of slots"
                  value={currentPeriodSlots}
                  onChange={(e) => setCurrentPeriodSlots(e.target.value)}
                  disabled={isPending}
                />
                <button
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => handlePayment(false)}
                  disabled={isPending || !currentPeriodSlots}
                >
                  {isPending ? <span className={styles.loader}></span> : 'Pay for Slots'}
                </button>
              </div>

              {currentPeriodSlots && currentPeriodFees && (
                <div className={styles.feeEstimate}>
                  <span className={styles.feeLabel}>Estimated Fee</span>
                  <span className={styles.feeAmount}>{formatFees(currentPeriodFees)} DAI</span>
                </div>
              )}
            </div>

            {/* Next Period Payment */}
            <div className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <span className={styles.periodTitle}>
                  Next Period ({nextPeriod?.toString()})
                </span>
                <span className={styles.periodStatus}>
                  {isNextPeriodPaid ? (
                    <>✓ Paid</>
                  ) : (
                    <>Available</>
                  )}
                </span>
              </div>

              {!isNextPeriodPaid && (
                <>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="Number of slots"
                      value={nextPeriodSlots}
                      onChange={(e) => setNextPeriodSlots(e.target.value)}
                      disabled={isPending}
                    />
                    <button
                      className={`${styles.button} ${styles.primary}`}
                      onClick={() => handlePayment(true)}
                      disabled={isPending || !nextPeriodSlots}
                    >
                      {isPending ? <span className={styles.loader}></span> : 'Pay for Next Period'}
                    </button>
                  </div>

                  {nextPeriodSlots && (nextPeriodBaseFees || nextPeriodSlotFees) && (
                    <div className={styles.feeEstimate}>
                      <span className={styles.feeLabel}>Total Fee</span>
                      <span className={styles.feeAmount}>
                        {formatFees((nextPeriodBaseFees || 0n) + (nextPeriodSlotFees || 0n))} DAI
                      </span>
                      <div className={styles.feeBreakdown}>
                        <span>Base Fee: {formatFees(nextPeriodBaseFees)} DAI</span>
                        <span>Slot Fee: {formatFees(nextPeriodSlotFees)} DAI</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encryptor Management - Only show if user is authority */}
      {canManage && ritual?.accessController && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeader}>
            Manage Encryptors
          </h3>

          <div className={styles.encryptorSection}>
            <textarea
              className={styles.textarea}
              placeholder="Enter encryptor addresses (comma-separated)&#10;Example: 0x123..., 0x456..."
              value={encryptors}
              onChange={(e) => setEncryptors(e.target.value)}
              disabled={isPending}
            />
            
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={() => handleEncryptors(true)}
                disabled={isPending || !encryptors}
              >
                {isPending ? <span className={styles.loader}></span> : 'Add Encryptors'}
              </button>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={() => handleEncryptors(false)}
                disabled={isPending || !encryptors}
              >
                {isPending ? <span className={styles.loader}></span> : 'Remove Encryptors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show message if user cannot manage */}
      {!canManage && (
        <div className={styles.section}>
          <div className={styles.warning}>
            Connect as the ritual authority to manage this ritual
          </div>
        </div>
      )}
    </div>
  );
};