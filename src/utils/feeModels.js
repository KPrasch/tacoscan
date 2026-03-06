// Known fee model contracts registry organized by network

// Contract ABIs for different fee model types
export const FeeModelABIs = {
  BqETHSubscription: [], // We already have standardSubscriptionAbi
  FlatRateFeeModel: [],
  FreeFeeModel: [],
  ManagedFeeModel: []
};

// Registry of known fee model contracts by network
export const FeeModelsByNetwork = {
  mainnet: {
    // Ethereum Mainnet fee models
    '0x1acaf2677b987e690a09296babdce6376712213d': {
      name: 'FreeFeeModel',
      displayName: 'Free Fee Model',
      type: 'free',
      paymentToken: 'None',
      description: 'Official FreeFeeModel contract - No fees required'
    },
  },
  polygon: {
    // Polygon/Matic Network fee models
    '0x44da7e4097f6538ba10b0771ceb6b3955d05f1d3': {
      name: 'StandardSubscription',
      displayName: 'Standard Subscription',
      type: 'subscription',
      paymentToken: 'DAI',
      description: 'Official StandardSubscription contract with periodic payments'
    },
    '0x86bb5a572a311bdb5fb3b0426b64553370d45de3': {
      name: 'BqETHSubscription',
      displayName: 'BqETH Subscription',
      type: 'subscription',
      paymentToken: 'BqETH',
      description: 'Standard BqETH subscription model with periodic payments'
    },
    '0xd5dea8e6370ff12ba1c66971d7b312b6a5166e5e': {
      name: 'BqETHSubscription',
      displayName: 'BqETH Subscription',
      type: 'subscription', 
      paymentToken: 'BqETH',
      description: 'Standard BqETH subscription model with periodic payments'
    },
    '0xa402353e7386b3897179b2e12eb9ad7cde92de19': {
      name: 'DAISubscription',
      displayName: 'DAI Subscription',
      type: 'subscription',
      paymentToken: 'DAI',
      description: 'DAI-based subscription model with periodic payments'
    },
    '0xf46e13a030f80527845320e9e295e9eb19263b56': {
      name: 'FlatRateFeeModel',
      displayName: 'Flat Rate Fee',
      type: 'flat_rate',
      paymentToken: 'DAI',
      description: 'Flat rate fee model with fixed pricing'
    },
    '0x3b1a8ee6dc77d8c0594a889e996e3f03ddcca58f': {
      name: 'ManagedFeeModel',
      displayName: 'Managed Fee Model',
      type: 'managed',
      paymentToken: 'Various',
      description: 'Managed fee model with custom pricing'
    },
    '0x1acaf2677b987e690a09296babdce6376712213d': {
      name: 'FreeFeeModel',
      displayName: 'Free Fee Model',
      type: 'free',
      paymentToken: 'None',
      description: 'Official FreeFeeModel contract - No fees required'
    },
    '0x0000000000000000000000000000000000000000': {
      name: 'FreeFeeModel',
      displayName: 'Free (No Fee)',
      type: 'free',
      paymentToken: 'None',
      description: 'No fee required for this ritual'
    },
    // Add more known fee model contracts here as discovered
  },
  tapir: {
    // Tapir testnet fee models
  },
  lynx: {
    // Lynx testnet fee models
  }
};

// Detect fee model type from address and network
export function detectFeeModel(address, network = 'polygon') {
  if (!address) return null;
  
  // Check for zero address (free model)
  if (address === '0x0000000000000000000000000000000000000000' || 
      address === '0x' || 
      parseInt(address, 16) === 0) {
    return {
      name: 'FreeFeeModel',
      displayName: 'Free (No Fee)',
      type: 'free',
      paymentToken: 'None',
      description: 'No fee required for this ritual',
      address: address,
      network: network
    };
  }
  
  // Normalize address to lowercase for comparison
  const normalizedAddress = address.toLowerCase();
  
  // Check network-specific contracts first
  const networkContracts = FeeModelsByNetwork[network] || {};
  for (const [contractAddress, contractInfo] of Object.entries(networkContracts)) {
    if (contractAddress.toLowerCase() === normalizedAddress) {
      return { ...contractInfo, network, address };
    }
  }
  
  // Check all networks as fallback
  for (const [networkName, contracts] of Object.entries(FeeModelsByNetwork)) {
    for (const [contractAddress, contractInfo] of Object.entries(contracts)) {
      if (contractAddress.toLowerCase() === normalizedAddress) {
        return { ...contractInfo, network: networkName, address };
      }
    }
  }
  
  // Try to detect by common patterns or analysis
  // This is a fallback for unknown contracts
  return {
    name: 'CustomFeeModel',
    displayName: 'Custom Fee Model',
    type: 'custom',
    paymentToken: 'Unknown',
    address: address,
    network: network,
    description: 'Custom fee model contract'
  };
}

// Get fee model interface based on type
export function getFeeModelInterface(feeModelType) {
  switch (feeModelType) {
    case 'subscription':
      return {
        methods: ['payForCurrentPeriod', 'payForNextPeriod', 'getCurrentPeriod', 'billingInfo'],
        hasTimeline: true,
        hasPeriodicPayments: true,
        supportsSlots: true
      };
    
    case 'flat_rate':
      return {
        methods: ['pay', 'getFee', 'isPaid'],
        hasTimeline: false,
        hasPeriodicPayments: false,
        supportsSlots: false
      };
    
    case 'free':
      return {
        methods: [],
        hasTimeline: false,
        hasPeriodicPayments: false,
        supportsSlots: false
      };
    
    default:
      return {
        methods: [],
        hasTimeline: false,
        hasPeriodicPayments: false,
        supportsSlots: false
      };
  }
}

// Format fee model name for display
export function formatFeeModelName(feeModelInfo) {
  if (!feeModelInfo) return 'Unknown';
  
  // For known contracts, return the proper name
  if (feeModelInfo.name && feeModelInfo.name !== 'CustomFeeModel') {
    return feeModelInfo.displayName || feeModelInfo.name;
  }
  
  // For unknown contracts, return shortened address
  if (feeModelInfo.address) {
    return `Custom (${feeModelInfo.address.slice(0, 6)}...${feeModelInfo.address.slice(-4)})`;
  }
  
  return 'Unknown';
}