import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent, useAccount, useConfig } from 'wagmi';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { standardSubscriptionAbi, erc20Abi, accessControllerAbi } from '../config/contracts';
import { formatUnits } from 'viem';
import { polygon } from 'wagmi/chains';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return null;
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

const getTimeLeftInPeriod = (currentTime, periodStart, periodEnd) => {
  if (currentTime < periodStart) return null;
  if (currentTime > periodEnd) return null;
  return Number(periodEnd) - currentTime;
};

const initialContractState = {
  startOfSubscription: null,
  currentPeriod: null,
  subscriptionDuration: null,
  billingInfo: null,
  yellowDuration: null,
  redDuration: null,
  maxNodes: null,
  initialBaseFeeRate: null,
  encryptorFeeRate: null,
  baseFees: null,
  estimatedFees: null,
  feeTokenAddress: null,
  isAuthorized: null,
  loading: true,
  error: null
};

const contractReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        [action.field]: action.value,
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'RESET':
      return initialContractState;
    default:
      return state;
  }
};

export const RitualManagement = ({ ritual, feeModelAddress }) => {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const [contractState, dispatch] = useReducer(contractReducer, initialContractState);
  const [slots, setSlots] = useState('');
  const [period, setPeriod] = useState('0');
  const [encryptors, setEncryptors] = useState('');
  const [error, setError] = useState('');
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [authorizedEncryptors, setAuthorizedEncryptors] = useState([]);
  const [checkingAddress, setCheckingAddress] = useState('');
  const [remainingTime, setRemainingTime] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [rpcError, setRpcError] = useState(null);
  const [currentPeriodSlots, setCurrentPeriodSlots] = useState('');
  const [nextPeriodSlots, setNextPeriodSlots] = useState('');

  // Move contract reads to component body
  const { data: startOfSubscriptionData, isError: startOfSubscriptionError, error: startOfSubscriptionErrorData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'startOfSubscription',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onError(error) {
      console.error('Error reading startOfSubscription:', error);
    }
  });

  const { data: currentPeriodData, isError: currentPeriodError, error: currentPeriodErrorData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'getCurrentPeriodNumber',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onSuccess(data) {
      console.log('Current Period Success:', {
        data,
        type: typeof data,
        value: data?.toString()
      });
    },
    onError(error) {
      console.error('Error reading currentPeriod:', error);
    }
  });

  const { data: subscriptionDurationData, isError: subscriptionDurationError, error: subscriptionDurationErrorData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'subscriptionPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onError(error) {
      console.error('Error reading subscriptionDuration:', error);
    }
  });

  const { data: yellowDurationData, isError: yellowDurationError, error: yellowDurationErrorData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'yellowPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onError(error) {
      console.error('Error reading yellowDuration:', error);
    }
  });

  const { data: redDurationData, isError: redDurationError, error: redDurationErrorData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'redPeriodDuration',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onError(error) {
      console.error('Error reading redPeriodDuration:', error);
    }
  });

  // Debug contract read
  useEffect(() => {
    console.log('Contract Read Debug:', {
      address: feeModelAddress,
      chainId: polygon.id,
      startOfSubscriptionData,
      startOfSubscriptionError,
      startOfSubscriptionErrorData,
      currentPeriodData,
      currentPeriodError,
      currentPeriodErrorData,
      subscriptionDurationData,
      subscriptionDurationError,
      subscriptionDurationErrorData,
      yellowDurationData,
      yellowDurationError,
      yellowDurationErrorData,
      redDurationData,
      redDurationError,
      redDurationErrorData,
      abi: standardSubscriptionAbi.find(item => item.name === 'startOfSubscription')
    });
  }, [feeModelAddress, startOfSubscriptionData, startOfSubscriptionError, startOfSubscriptionErrorData, 
      currentPeriodData, currentPeriodError, currentPeriodErrorData,
      subscriptionDurationData, subscriptionDurationError, subscriptionDurationErrorData,
      yellowDurationData, yellowDurationError, yellowDurationErrorData,
      redDurationData, redDurationError, redDurationErrorData]);

  // Calculate current period based on subscription start and duration
  const currentPeriodNumber = useMemo(() => {
    if (!contractState.startOfSubscription || !contractState.subscriptionDuration) {
      console.log('Missing subscription data for period calculation');
      return BigInt(0);
    }

    const startTime = BigInt(contractState.startOfSubscription);
    const periodDuration = BigInt(contractState.subscriptionDuration);
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    
    if (currentTime < startTime) {
      console.log('Current time is before subscription start');
      return BigInt(0);
    }
    
    const elapsedTime = currentTime - startTime;
    const currentPeriod = elapsedTime / periodDuration;
    
    console.log('Period Calculation:', {
      startTime: startTime.toString(),
      currentTime: currentTime.toString(),
      elapsedTime: elapsedTime.toString(),
      periodDuration: periodDuration.toString(),
      calculatedPeriod: currentPeriod.toString()
    });
    
    return currentPeriod;
  }, [contractState.startOfSubscription, contractState.subscriptionDuration]);

  // Update the effect to use the calculated period
  useEffect(() => {
    if (!feeModelAddress) return;
    
    try {
      if (startOfSubscriptionData !== undefined) {
        dispatch({ type: 'SET_DATA', field: 'startOfSubscription', value: startOfSubscriptionData });
      }
      if (currentPeriodNumber !== undefined) {
        console.log('Setting current period:', {
          calculated: currentPeriodNumber.toString()
        });
        dispatch({ type: 'SET_DATA', field: 'currentPeriod', value: currentPeriodNumber });
      }
      if (subscriptionDurationData !== undefined) {
        dispatch({ type: 'SET_DATA', field: 'subscriptionDuration', value: subscriptionDurationData });
      }
      if (yellowDurationData !== undefined) {
        dispatch({ type: 'SET_DATA', field: 'yellowDuration', value: yellowDurationData });
      }
      if (redDurationData !== undefined) {
        dispatch({ type: 'SET_DATA', field: 'redDuration', value: redDurationData });
      }
    } catch (err) {
      console.error('Error updating contract state:', err);
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [feeModelAddress, startOfSubscriptionData, currentPeriodNumber, subscriptionDurationData, yellowDurationData, redDurationData]);

  // Secondary reads hook results
  const { data: billingInfoData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'billingInfo',
    args: [contractState.currentPeriod],
    enabled: Boolean(feeModelAddress && contractState.currentPeriod)
  });

  const { data: maxNodesData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'maxNodes',
    enabled: Boolean(feeModelAddress)
  });

  const { data: initialBaseFeeRateData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'initialBaseFeeRate',
    enabled: Boolean(feeModelAddress)
  });

  const { data: encryptorFeeRateData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFeeRate',
    enabled: Boolean(feeModelAddress)
  });

  // Add used slots read
  const { data: usedSlotsData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'usedEncryptorSlots',
    enabled: Boolean(feeModelAddress)
  });

  // Secondary reads function uses hook results
  const secondaryReads = useCallback(() => {
    if (!feeModelAddress || !contractState.currentPeriod) return;
    
    try {
      dispatch({ type: 'SET_DATA', field: 'billingInfo', value: billingInfoData });
      dispatch({ type: 'SET_DATA', field: 'maxNodes', value: maxNodesData });
      dispatch({ type: 'SET_DATA', field: 'initialBaseFeeRate', value: initialBaseFeeRateData });
      dispatch({ type: 'SET_DATA', field: 'encryptorFeeRate', value: encryptorFeeRateData });
      dispatch({ type: 'SET_DATA', field: 'usedSlots', value: usedSlotsData });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [feeModelAddress, contractState.currentPeriod, billingInfoData, maxNodesData, initialBaseFeeRateData, encryptorFeeRateData, usedSlotsData]);

  // Fee-related hooks
  const { data: baseFeesData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'baseFees',
    args: [BigInt(period || 0)],
    enabled: Boolean(feeModelAddress && period)
  });

  const { data: estimatedFeesData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFees',
    args: slots && contractState.subscriptionDuration ? [BigInt(slots), contractState.subscriptionDuration] : undefined,
    enabled: Boolean(feeModelAddress && slots && contractState.subscriptionDuration)
  });

  // Update fees function uses hook results
  const updateFees = useCallback(() => {
    if (!feeModelAddress || !slots || !contractState.subscriptionDuration) return;
    
    try {
      dispatch({ type: 'SET_DATA', field: 'baseFees', value: baseFeesData });
      dispatch({ type: 'SET_DATA', field: 'estimatedFees', value: estimatedFeesData });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message });
    }
  }, [feeModelAddress, slots, period, contractState.subscriptionDuration, baseFeesData, estimatedFeesData]);

  // Add RPC error handling
  useEffect(() => {
    if (!config.projectId) {
      setRpcError('WalletConnect Project ID is not configured. Please check your environment variables.');
      console.error('Missing WalletConnect Project ID');
    } else {
      setRpcError(null);
    }
  }, [config.projectId]);

  // Initial data load
  useEffect(() => {
    secondaryReads();
  }, [secondaryReads]);

  // Load secondary data when primary is available
  useEffect(() => {
    if (contractState.currentPeriod) {
      secondaryReads();
    }
  }, [secondaryReads, contractState.currentPeriod]);

  // Update fees when inputs change
  useEffect(() => {
    if (slots || period) {
      updateFees();
    }
  }, [updateFees, slots, period]);

  // Calculate subscription end - memoized
  const subscriptionEnd = useMemo(() => {
    if (!contractState.startOfSubscription || !contractState.subscriptionDuration) return undefined;
    return BigInt(contractState.startOfSubscription) + BigInt(contractState.subscriptionDuration);
  }, [contractState.startOfSubscription, contractState.subscriptionDuration]);

  // Contract state reads - only fetch when needed for display
  const { data: maxNodes } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'maxNodes',
    enabled: Boolean(feeModelAddress),
  });

  const { data: initialBaseFeeRate } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'initialBaseFeeRate',
    enabled: Boolean(feeModelAddress),
  });

  const { data: encryptorFeeRate } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'encryptorFeeRate',
    enabled: Boolean(feeModelAddress),
  });

  // Check authorization status - only when explicitly checking an address
  const { data: isAuthorized } = useReadContract({
    address: ritual.accessController,
    abi: accessControllerAbi,
    functionName: 'isAddressAuthorized',
    args: checkingAddress ? [BigInt(ritual.id), checkingAddress] : undefined,
    enabled: Boolean(ritual.accessController && checkingAddress),
  });

  // Batch check addresses instead of checking one by one
  const checkAddresses = useCallback((addresses) => {
    const uniqueAddresses = [...new Set(addresses)];
    setCheckingAddress(uniqueAddresses[0]); // Only check one at a time to reduce RPC calls
  }, []);

  // Add memoized timeline data
  const timelineData = useMemo(() => {
    if (!contractState.startOfSubscription || !contractState.subscriptionDuration || 
        !contractState.yellowDuration || !contractState.redDuration) {
      return null;
    }

    const start = Number(contractState.startOfSubscription);
    const end = start + Number(contractState.subscriptionDuration);
    const yellowEnd = end + Number(contractState.yellowDuration);
    const redEnd = yellowEnd + Number(contractState.redDuration);
    const current = Math.floor(Date.now() / 1000);

    console.log('Timeline calculation:', {
      start,
      end,
      yellowEnd,
      redEnd,
      current,
      startOfSubscription: contractState.startOfSubscription,
      subscriptionDuration: contractState.subscriptionDuration,
      yellowDuration: contractState.yellowDuration,
      redDuration: contractState.redDuration
    });

    return {
      start,
      end,
      yellowEnd,
      redEnd,
      current,
      periods: [
        { label: 'Active', start, end, color: '#4caf50' },
        { label: 'Grace', start: end, end: yellowEnd, color: '#ff9800' },
        { label: 'Final', start: yellowEnd, end: redEnd, color: '#f44336' }
      ]
    };
  }, [
    contractState.startOfSubscription,
    contractState.subscriptionDuration,
    contractState.yellowDuration,
    contractState.redDuration
  ]);

  // Replace interval-based updates with local calculations
  const currentStatus = useMemo(() => {
    if (!timelineData) return null;

    const now = Math.floor(Date.now() / 1000);
    
    if (now < timelineData.end) {
      return { 
        status: 'green', 
        label: 'Active', 
        timeLeft: timelineData.end - now,
        currentPeriod: 'Active'
      };
    } else if (now < timelineData.yellowEnd) {
      return { 
        status: 'yellow', 
        label: 'Grace Period', 
        timeLeft: timelineData.yellowEnd - now,
        currentPeriod: 'Grace'
      };
    } else if (now < timelineData.redEnd) {
      return { 
        status: 'red', 
        label: 'Final Period', 
        timeLeft: timelineData.redEnd - now,
        currentPeriod: 'Final'
      };
    } else {
      return { 
        status: 'expired', 
        label: 'Expired', 
        timeLeft: 0,
        currentPeriod: 'Expired'
      };
    }
  }, [timelineData]);

  // Update remaining time with minimal re-renders
  useEffect(() => {
    if (!currentStatus || currentStatus.timeLeft === 0) return;

    // Update every 15 seconds instead of every second
    const interval = setInterval(() => {
      setForceUpdate(prev => !prev);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [currentStatus]);

  // Effect to update authorized status when checking address changes
  useEffect(() => {
    if (isAuthorized && checkingAddress && !authorizedEncryptors.includes(checkingAddress)) {
      setAuthorizedEncryptors(prev => [...prev, checkingAddress]);
    } else if (!isAuthorized && checkingAddress) {
      setAuthorizedEncryptors(prev => prev.filter(addr => addr !== checkingAddress));
    }
  }, [isAuthorized, checkingAddress]);

  // Handle pasting addresses to check
  const handleCheckAddresses = (e) => {
    const addresses = e.target.value.split(',').map(addr => addr.trim()).filter(Boolean);
    checkAddresses(addresses);
  };

  // Write contract interactions
  const { writeContract: writeSubscription, isPending: isSubscriptionPending } = useWriteContract();
  const { writeContract: writeToken, isPending: isTokenPending } = useWriteContract();

  // Move event watching to component level with custom RPC URL
  useWatchContractEvent({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    eventName: 'EncryptorSlotsPaid',
    enabled: Boolean(feeModelAddress),
    chainId: polygon.id,
    onLogs(logs) {
      setIsPaymentPending(false);
      // Trigger a refresh of contract data
      if (startOfSubscriptionData !== undefined) {
        dispatch({ type: 'SET_DATA', field: 'startOfSubscription', value: startOfSubscriptionData });
      }
    },
  });

  const handleApproveAndPay = async (isNextPeriod = false) => {
    const slotsToUse = isNextPeriod ? nextPeriodSlots : currentPeriodSlots;
    
    if (!slotsToUse || isNaN(slotsToUse) || slotsToUse <= 0) {
      setError('Please enter a valid number of slots');
      return;
    }

    try {
      setIsPaymentPending(true);
      
      // Calculate total fees
      const totalFees = isNextPeriod 
        ? (nextPeriodFeesData || 0n) + (estimatedFeesData || 0n)
        : estimatedFeesData || 0n;

      // Approve token transfer
      await writeToken({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [feeModelAddress, totalFees],
      });

      // Pay for slots or subscription
      await writeSubscription({
        address: feeModelAddress,
        abi: standardSubscriptionAbi,
        functionName: isNextPeriod ? 'payForSubscription' : 'payForEncryptorSlots',
        args: [BigInt(slotsToUse)],
      });
    } catch (err) {
      setError(err.message);
      setIsPaymentPending(false);
    }
  };

  const handleEncryptors = async (isAdding = true) => {
    if (!encryptors) {
      setError('Please enter encryptor addresses');
      return;
    }

    const encryptorList = encryptors.split(',').map(addr => addr.trim());
    
    try {
      setIsPaymentPending(true);
      await writeSubscription({
        address: ritual.accessController,
        abi: accessControllerAbi,
        functionName: isAdding ? 'authorize' : 'deauthorize',
        args: [BigInt(ritual.id), encryptorList],
      });
    } catch (err) {
      setError(err.message);
      setIsPaymentPending(false);
    }
  };

  const formatFees = (fees) => {
    if (!fees) return '0';
    return parseFloat(formatUnits(fees, 18)).toFixed(2);
  };

  // Calculate period status
  const getPeriodStatus = () => {
    if (!subscriptionEnd || !contractState.yellowDuration || !contractState.redDuration) return null;

    const now = BigInt(Math.floor(Date.now() / 1000)); // current timestamp in seconds
    const endTime = subscriptionEnd;
    const yellowStart = endTime;
    const redStart = endTime + BigInt(contractState.yellowDuration);
    const finalEnd = redStart + BigInt(contractState.redDuration);

    if (now < endTime) {
      return { status: 'green', label: 'Active', timeLeft: Number(endTime - now) };
    } else if (now < redStart) {
      return { status: 'yellow', label: 'Grace Period', timeLeft: Number(redStart - now) };
    } else if (now < finalEnd) {
      return { status: 'red', label: 'Final Period', timeLeft: Number(finalEnd - now) };
    } else {
      return { status: 'expired', label: 'Expired', timeLeft: 0 };
    }
  };

  const formatTimeLeft = (seconds) => {
    if (!seconds) return '';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Add error boundary for contract reads
  const [contractReadError, setContractReadError] = useState(null);

  // Modify the getSubscriptionTimeline to be more resilient
  const getSubscriptionTimeline = () => {
    try {
      if (!contractState.startOfSubscription) {
        console.log('Missing startOfSubscription');
        return null;
      }

      // Calculate end times
      const start = Number(contractState.startOfSubscription);
      const end = Number(contractState.startOfSubscription) + Number(contractState.subscriptionDuration || 0);
      const yellowEnd = end + Number(contractState.yellowDuration || 0);
      const redEnd = yellowEnd + Number(contractState.redDuration || 0);
      const now = Math.floor(Date.now() / 1000);

      console.log('Timeline calculated:', {
        start,
        end,
        yellowEnd,
        redEnd,
        now,
        subscriptionDuration: Number(contractState.subscriptionDuration || 0),
        yellowDuration: Number(contractState.yellowDuration || 0),
        redDuration: Number(contractState.redDuration || 0)
      });

      return {
        start,
        greenEnd: end,
        yellowEnd,
        redEnd,
        current: now,
        periods: [
          { label: 'Active', start, end, color: '#4caf50' },
          { label: 'Grace', start: end, end: yellowEnd, color: '#ff9800' },
          { label: 'Final', start: yellowEnd, end: redEnd, color: '#f44336' }
        ]
      };
    } catch (error) {
      console.error('Error in getSubscriptionTimeline:', error);
      setContractReadError(error.message);
      return null;
    }
  };

  const isPending = isPaymentPending || isSubscriptionPending || isTokenPending;

  // Enhanced debug logging
  useEffect(() => {
    console.log('Contract State:', {
      feeModelAddress,
      startOfSubscription: contractState.startOfSubscription?.toString(),
      currentPeriod: contractState.currentPeriod?.toString(),
      subscriptionDuration: contractState.subscriptionDuration?.toString(),
      calculatedEnd: subscriptionEnd?.toString(),
      billingInfo: {
        paid: contractState.billingInfo?.[0],
        slots: contractState.billingInfo?.[1]?.toString(),
      },
      yellowDuration: contractState.yellowDuration?.toString(),
      redDuration: contractState.redDuration?.toString(),
      contractState: {
        maxNodes: maxNodes?.toString(),
        initialBaseFeeRate: initialBaseFeeRate?.toString(),
        encryptorFeeRate: encryptorFeeRate?.toString(),
      },
      errors: {
        maxNodes: maxNodes?.toString(),
        baseFee: initialBaseFeeRate?.toString(),
        encryptorFee: encryptorFeeRate?.toString(),
      }
    });
  }, [
    feeModelAddress,
    contractState.startOfSubscription,
    contractState.currentPeriod,
    contractState.subscriptionDuration,
    subscriptionEnd,
    contractState.billingInfo,
    contractState.yellowDuration,
    contractState.redDuration,
    maxNodes,
    initialBaseFeeRate,
    encryptorFeeRate,
  ]);

  // Add console log for feeModelAddress
  useEffect(() => {
    console.log('FeeModel Address:', {
      address: feeModelAddress,
      type: typeof feeModelAddress,
      length: feeModelAddress?.length,
    });
  }, [feeModelAddress]);

  // Add debug logging for timeline data
  useEffect(() => {
    console.log('Timeline Data:', {
      startOfSubscription: contractState.startOfSubscription?.toString(),
      subscriptionDuration: contractState.subscriptionDuration?.toString(),
      subscriptionEnd: subscriptionEnd?.toString(),
      yellowDuration: contractState.yellowDuration?.toString(),
      redDuration: contractState.redDuration?.toString(),
      currentTime: Math.floor(Date.now() / 1000)
    });
  }, [contractState.startOfSubscription, contractState.subscriptionDuration, subscriptionEnd, contractState.yellowDuration, contractState.redDuration]);

  // Consolidate contract reads into a single hook with proper enabled conditions
  const { data: contractData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'getContractData',
    enabled: Boolean(feeModelAddress && !contractState.loading),
    select: (data) => ({
      maxNodes: data[0],
      initialBaseFeeRate: data[1],
      encryptorFeeRate: data[2],
      feeTokenAddress: data[3]
    })
  });

  // Only fetch fees when actually needed
  const { data: fees } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'calculateFees',
    args: slots && period ? [BigInt(slots), BigInt(period)] : undefined,
    enabled: Boolean(feeModelAddress && slots && period && !isPaymentPending),
  });

  // Batch check authorization status
  const { data: authStatus } = useReadContract({
    address: ritual.accessController,
    abi: accessControllerAbi,
    functionName: 'checkAuthorizedBatch',
    args: checkingAddress ? [[BigInt(ritual.id)], [checkingAddress]] : undefined,
    enabled: Boolean(ritual.accessController && checkingAddress && !isPaymentPending),
  });

  // Update next period calculation to use the new current period
  const nextPeriodNumber = useMemo(() => {
    if (currentPeriodNumber === undefined) {
      console.log('No current period available');
      return BigInt(0);
    }
    
    console.log('Next Period Calculation:', {
      currentPeriod: currentPeriodNumber.toString(),
      nextPeriod: (currentPeriodNumber + BigInt(1)).toString()
    });
    
    return currentPeriodNumber + BigInt(1);
  }, [currentPeriodNumber]);

  // Add period payment status check with proper BigInt conversion
  const { data: isPeriodPaidData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'isPeriodPaid',
    args: [contractState.currentPeriod || BigInt(0)],
    enabled: Boolean(feeModelAddress && contractState.currentPeriod !== undefined)
  });

  // Add next period payment status check
  const { data: isNextPeriodPaidData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'isPeriodPaid',
    args: [nextPeriodNumber],
    enabled: Boolean(feeModelAddress && nextPeriodNumber !== undefined)
  });

  // Add base fees calculation for next period
  const { data: nextPeriodFeesData } = useReadContract({
    address: feeModelAddress,
    abi: standardSubscriptionAbi,
    functionName: 'baseFees',
    args: [nextPeriodNumber],
    enabled: Boolean(feeModelAddress && nextPeriodNumber !== undefined)
  });

  return (
    <Box sx={{
      width: "100%",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      marginBottom: "20px"
    }}>
      {rpcError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {rpcError}
        </Alert>
      )}

      <div style={{ 
        fontSize: "1rem", 
        fontWeight: "500", 
        marginBottom: "16px",
        color: "rgba(0,0,0,0.87)"
      }}>
        Ritual Management
      </div>

      {contractReadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setContractReadError(null)}>
          Error reading contract data: {contractReadError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Subscription Status & Timeline */}
      {timelineData && (
        <Box sx={{ 
          mb: 3,
          p: 3,
          backgroundColor: 'rgba(120, 80, 205, 0.04)',
          borderRadius: '8px',
        }}>
          {/* Header with current status */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3
          }}>
            <div style={{ 
              fontSize: "0.875rem", 
              fontWeight: "500",
              color: "rgba(0,0,0,0.87)"
            }}>
              Subscription Status
            </div>
            {/* Status badges */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              {/* Period Status */}
              {currentStatus && (
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: `rgba(${
                    currentStatus.status === 'green' ? '76, 175, 80' :
                    currentStatus.status === 'yellow' ? '255, 152, 0' :
                    currentStatus.status === 'red' ? '244, 67, 54' :
                    '158, 158, 158'
                  }, 0.1)`,
                  padding: '4px 12px',
                  borderRadius: '16px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: {
                      green: '#4caf50',
                      yellow: '#ff9800',
                      red: '#f44336',
                      expired: '#9e9e9e'
                    }[currentStatus.status]
                  }} />
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: {
                      green: '#4caf50',
                      yellow: '#ff9800',
                      red: '#f44336',
                      expired: '#9e9e9e'
                    }[currentStatus.status]
                  }}>
                    {currentStatus.label}
                  </div>
                </Box>
              )}
            </Box>
          </Box>

          {/* Key metrics */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 3,
            mb: 4,
          }}>
            {/* Subscription Info */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                  Current Period
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {contractState.currentPeriod?.toString() || '0'}
                </div>
              </div>
              {currentStatus && currentStatus.timeLeft > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                    Time Remaining
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '500',
                    color: {
                      green: '#4caf50',
                      yellow: '#ff9800',
                      red: '#f44336',
                      expired: '#9e9e9e'
                    }[currentStatus.status]
                  }}>
                    {formatDuration(currentStatus.timeLeft)}
                  </div>
                </div>
              )}
            </Box>

            {/* Node Info */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              {/* Remove duplicate slots display */}
            </Box>

            {/* Fee Info */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                  Base Fee Rate
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {initialBaseFeeRate ? formatUnits(initialBaseFeeRate, 18) : '-'} DAI/node/s
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                  Encryptor Fee Rate
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {encryptorFeeRate ? formatUnits(encryptorFeeRate, 18) : '-'} DAI/encryptor/s
                </div>
              </div>
            </Box>
          </Box>
          
          {/* Timeline visualization */}
          <Box sx={{ 
            position: 'relative',
            height: '80px',
            mb: 6,
            display: 'flex',
            borderRadius: '4px',
            overflow: 'visible',
            width: '100%'
          }}>
            {timelineData.periods.map((period, i) => {
              const width = `${(period.end - period.start) / (timelineData.redEnd - timelineData.start) * 100}%`;
              const currentTime = Math.floor(Date.now() / 1000);
              const timeLeftInPeriod = getTimeLeftInPeriod(currentTime, period.start, period.end);
              const isCurrentPeriod = currentTime >= period.start && currentTime < period.end;
              
              return (
                <div
                  key={i}
                  style={{
                    width,
                    height: '32px',
                    backgroundColor: period.color,
                    opacity: isCurrentPeriod ? 0.8 : 0.3,
                    position: 'relative',
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  {/* Period label with countdown */}
                  <div style={{
                    position: 'absolute',
                    top: '36px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{ 
                      fontSize: '0.875rem',
                      fontWeight: isCurrentPeriod ? '600' : '500',
                      color: isCurrentPeriod ? period.color : 'rgba(0,0,0,0.75)',
                    }}>
                      {period.label}
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'rgba(0,0,0,0.6)',
                        marginLeft: '8px'
                      }}>
                        ({i === 0 ? formatTimeLeft(Number(contractState.subscriptionDuration)) :
                          i === 1 ? formatTimeLeft(Number(contractState.yellowDuration)) :
                          formatTimeLeft(Number(contractState.redDuration))})
                      </span>
                    </div>
                    {isCurrentPeriod && timeLeftInPeriod && (
                      <div style={{ 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: period.color,
                      }}>
                        {formatDuration(timeLeftInPeriod)}
                      </div>
                    )}
                  </div>

                  {/* Start marker */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '-8px',
                    width: '2px',
                    height: '48px',
                    backgroundColor: period.color,
                    opacity: 0.5,
                  }} />
                  
                  {/* Start date with connecting line */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '-48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: i === 0 ? 'flex-start' : 'center',
                    transform: i === 0 ? 'none' : 'translateX(-50%)',
                  }}>
                    <div style={{
                      width: '2px',
                      height: '16px',
                      backgroundColor: period.color,
                      opacity: 0.5,
                      marginBottom: '4px',
                      marginLeft: i === 0 ? '0' : 'auto'
                    }} />
                    <div style={{
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      color: 'rgba(0,0,0,0.87)',
                      backgroundColor: 'white',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      marginLeft: i === 0 ? '0' : 'auto'
                    }}>
                      {formatTimestamp(period.start)}
                    </div>
                  </div>

                  {/* End date with connecting line */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: i === timelineData.periods.length - 1 ? 'flex-end' : 'center',
                    transform: i === timelineData.periods.length - 1 ? 'none' : 'translateX(50%)',
                  }}>
                    <div style={{
                      width: '2px',
                      height: '16px',
                      backgroundColor: i < timelineData.periods.length - 1 ? timelineData.periods[i + 1].color : period.color,
                      opacity: 0.5,
                      marginBottom: '4px',
                      marginRight: i === timelineData.periods.length - 1 ? '0' : 'auto'
                    }} />
                    <div style={{
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      color: 'rgba(0,0,0,0.87)',
                      backgroundColor: 'white',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      marginRight: i === timelineData.periods.length - 1 ? '0' : 'auto'
                    }}>
                      {formatTimestamp(period.end)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current time indicator */}
            {timelineData?.current >= timelineData?.start && 
             timelineData?.current <= timelineData?.redEnd && (
              <>
                {/* Vertical line */}
                <div style={{
                  position: 'absolute',
                  left: `${((timelineData.current - timelineData.start) / 
                         (timelineData.redEnd - timelineData.start)) * 100}%`,
                  top: '-24px',
                  width: '2px',
                  height: '80px',
                  backgroundColor: '#7850cd',
                  transform: 'translateX(-50%)',
                  zIndex: 2
                }} />
                {/* Dot indicator */}
                <div style={{
                  position: 'absolute',
                  left: `${((timelineData.current - timelineData.start) / 
                         (timelineData.redEnd - timelineData.start)) * 100}%`,
                  top: '14px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#7850cd',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 3
                }} />
                {/* Label */}
                <div style={{
                  position: 'absolute',
                  left: `${((timelineData.current - timelineData.start) / 
                         (timelineData.redEnd - timelineData.start)) * 100}%`,
                  top: '-48px',
                  transform: 'translateX(-50%)',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  color: '#7850cd',
                  fontWeight: '600',
                  backgroundColor: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  zIndex: 3
                }}>
                  Current Time
                </div>
              </>
            )}
          </Box>

          {/* Timeline details grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 2,
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                Period Start
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {formatTimestamp(timelineData.start)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                Period End
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {formatTimestamp(timelineData.end)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                Grace Period End
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {formatTimestamp(timelineData.yellowEnd)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>
                Final Period End
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {formatTimestamp(timelineData.redEnd)}
              </div>
            </div>
          </Box>
        </Box>
      )}

      {/* Pay for Subscription */}
      <Box sx={{ mb: 4 }}>
        <div style={{ 
          fontSize: "0.875rem", 
          fontWeight: "500", 
          marginBottom: "12px",
          color: "rgba(0,0,0,0.87)"
        }}>
          Subscription Payment Status
        </div>

        {/* Current Period Status */}
        <Box sx={{ 
          padding: '12px',
          backgroundColor: 'rgba(120, 80, 205, 0.04)',
          borderRadius: '4px',
          mb: 2
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* Status and slots display */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    Current Period ({contractState.currentPeriod?.toString() || '0'})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                    {isPeriodPaidData ? 'Paid' : 'Unpaid'}
                  </div>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isPeriodPaidData ? '#4caf50' : '#f44336',
                  marginLeft: '8px'
                }} />
              </div>
              
              {/* Current period slots display */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.875rem',
                color: 'rgba(0,0,0,0.87)',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid rgba(0,0,0,0.1)',
                paddingLeft: '16px',
                marginLeft: '16px'
              }}>
                <span style={{ color: '#4caf50', fontWeight: '500', marginRight: '4px' }}>
                  {contractState.usedSlots?.toString() || '0'}
                </span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginRight: '4px' }}>used of</span>
                <span style={{ color: '#7850cd', fontWeight: '500', marginRight: '4px' }}>
                  {contractState.billingInfo?.[1]?.toString() || '0'}
                </span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginRight: '4px' }}>paid</span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginLeft: '8px' }}>
                  (max {maxNodes?.toString() || '-'})
                </span>
              </div>
            </div>

            {/* Add slot payment form for current period */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
              <TextField
                label="Number of Encryptor Slots"
                type="number"
                value={currentPeriodSlots}
                onChange={(e) => setCurrentPeriodSlots(e.target.value)}
                sx={{ flex: 1 }}
                disabled={isPending}
              />
              <Button
                variant="contained"
                onClick={() => handleApproveAndPay(false)}
                disabled={isPending || !currentPeriodSlots}
                sx={{
                  backgroundColor: '#7850cd',
                  '&:hover': {
                    backgroundColor: '#6340b0',
                  },
                  height: '56px',
                }}
              >
                {isPending ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Pay for Slots'
                )}
              </Button>
            </Box>

            {currentPeriodSlots && contractState.estimatedFees && (
              <Box sx={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                mt: 2
              }}>
                <div style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)' }}>
                  Estimated Cost for Slots
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '500', color: '#7850cd' }}>
                  {formatFees(contractState.estimatedFees)} DAI
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                  Duration: {contractState.subscriptionDuration?.toString() || '-'} seconds
                </div>
              </Box>
            )}
          </div>
        </Box>

        {/* Next Period Payment */}
        <Box sx={{ 
          padding: '12px',
          backgroundColor: 'rgba(120, 80, 205, 0.04)',
          borderRadius: '4px',
          mb: 2
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Next Period ({nextPeriodNumber.toString()})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                  {isNextPeriodPaidData ? 'Paid' : 'Available for Payment'}
                </div>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isNextPeriodPaidData ? '#4caf50' : '#ff9800',
                marginLeft: '8px'
              }} />
            </div>

            {/* Next period slots display */}
            {isNextPeriodPaidData && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.875rem',
                color: 'rgba(0,0,0,0.87)',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid rgba(0,0,0,0.1)',
                paddingLeft: '16px',
                marginLeft: '16px'
              }}>
                <span style={{ color: '#4caf50', fontWeight: '500', marginRight: '4px' }}>
                  0
                </span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginRight: '4px' }}>used of</span>
                <span style={{ color: '#7850cd', fontWeight: '500', marginRight: '4px' }}>
                  {nextPeriodSlots || '0'}
                </span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginRight: '4px' }}>paid</span>
                <span style={{ color: 'rgba(0,0,0,0.6)', marginLeft: '8px' }}>
                  (max {maxNodes?.toString() || '-'})
                </span>
              </div>
            )}
          </div>

          {/* Payment form for next period */}
          {!isNextPeriodPaidData && (
            <>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                <TextField
                  label="Number of Encryptor Slots"
                  type="number"
                  value={nextPeriodSlots}
                  onChange={(e) => setNextPeriodSlots(e.target.value)}
                  sx={{ flex: 1 }}
                  disabled={isPending}
                />
                <Button
                  variant="contained"
                  onClick={() => handleApproveAndPay(true)}
                  disabled={isPending || !nextPeriodSlots}
                  sx={{
                    backgroundColor: '#7850cd',
                    '&:hover': {
                      backgroundColor: '#6340b0',
                    },
                    height: '56px',
                  }}
                >
                  {isPending ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Pay for Next Period'
                  )}
                </Button>
              </Box>

              {nextPeriodSlots && nextPeriodFeesData && contractState.estimatedFees && (
                <Box sx={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mt: 2
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)' }}>
                    Estimated Cost for Next Period
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '500', color: '#7850cd' }}>
                    {formatFees(nextPeriodFeesData + contractState.estimatedFees)} DAI
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                    Base Fees: {formatFees(nextPeriodFeesData)} DAI
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                    Slot Fees: {formatFees(contractState.estimatedFees)} DAI
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                    Duration: {contractState.subscriptionDuration?.toString() || '-'} seconds
                  </div>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Manage Encryptors */}
      {ritual.authority === ritual.initiator && (
        <Box>
          <div style={{ 
            fontSize: "0.875rem", 
            fontWeight: "500", 
            marginBottom: "12px",
            color: "rgba(0,0,0,0.87)"
          }}>
            Manage Encryptors
          </div>
          <TextField
            label="Encryptor Addresses (comma-separated)"
            multiline
            rows={4}
            value={encryptors}
            onChange={(e) => setEncryptors(e.target.value)}
            disabled={isPending}
            placeholder="0x123..., 0x456..."
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleEncryptors(true)}
              disabled={isPending || !encryptors}
              sx={{
                flex: 1,
                backgroundColor: '#7850cd',
                '&:hover': {
                  backgroundColor: '#6340b0',
                },
              }}
            >
              {isPending ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Add Encryptors'
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleEncryptors(false)}
              disabled={isPending || !encryptors}
              sx={{
                flex: 1,
                borderColor: '#7850cd',
                color: '#7850cd',
                '&:hover': {
                  borderColor: '#6340b0',
                  backgroundColor: 'rgba(120, 80, 205, 0.04)',
                },
              }}
            >
              {isPending ? (
                <CircularProgress size={24} sx={{ color: '#7850cd' }} />
              ) : (
                'Remove Encryptors'
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}; 