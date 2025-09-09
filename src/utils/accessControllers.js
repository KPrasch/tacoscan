// Known access controller contracts registry organized by TACo domain/network

// Contract ABIs for different access controller types
export const AccessControllerABIs = {
  GlobalAllowList: [
    {
      "inputs": [{"internalType": "uint32", "name": "ritualId", "type": "uint32"}],
      "name": "isAuthorized",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  ManagedAllowList: [
    {
      "inputs": [{"internalType": "uint32", "name": "ritualId", "type": "uint32"}, {"internalType": "address", "name": "encryptor", "type": "address"}],
      "name": "isAuthorized",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint32", "name": "ritualId", "type": "uint32"}, {"internalType": "address[]", "name": "addresses", "type": "address[]"}],
      "name": "authorize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint32", "name": "ritualId", "type": "uint32"}, {"internalType": "address[]", "name": "addresses", "type": "address[]"}],
      "name": "deauthorize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  OpenAccessAuthorizer: [
    {
      "inputs": [{"internalType": "uint32", "name": "ritualId", "type": "uint32"}, {"internalType": "bytes", "name": "evidence", "type": "bytes"}, {"internalType": "address", "name": "ciphertextHeader", "type": "address"}],
      "name": "isAuthorized",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Registry of known access controller contracts by network
export const AccessControllersByNetwork = {
  mainnet: {
    // Ethereum Mainnet
    '0xe552985eb764fb9575d108cbd1f080a7fd7fb327': {
      name: 'GlobalAllowList',
      displayName: 'Global Allow List',
      type: 'global_allow_list',
      abi: AccessControllerABIs.GlobalAllowList,
      description: 'Allows all addresses to access the ritual'
    },
    '0x8bb90126ec8d37d35e2054c9c59baec6e964f763': {
      name: 'ManagedAllowList',
      displayName: 'Managed Allow List',
      type: 'managed_allow_list',
      abi: AccessControllerABIs.ManagedAllowList,
      description: 'Admin-managed list of allowed addresses'
    },
    '0xde0de679d6a9186c38c3b616dd17f88f0fb9e78f': {
      name: 'OpenAccessAuthorizer',
      displayName: 'Open Access',
      type: 'open_access',
      abi: AccessControllerABIs.OpenAccessAuthorizer,
      description: 'Open access authorization for public rituals'
    }
  },
  polygon: {
    // Polygon/Matic Network
    '0xc4d8b86343d495db0ab1b985cc03e0e95e7f9a96': {
      name: 'GlobalAllowList',
      displayName: 'Global Allow List',
      type: 'global_allow_list',
      abi: AccessControllerABIs.GlobalAllowList,
      description: 'Allows all addresses to access the ritual'
    },
    '0xee77aa3fd23bbebaf94386dd44b548e9a785ea4b': {
      name: 'ManagedAllowList',
      displayName: 'Managed Allow List',
      type: 'managed_allow_list',
      abi: AccessControllerABIs.ManagedAllowList,
      description: 'Admin-managed list of allowed addresses'
    },
    '0x36e5a88f8022f97bb154dc5afc8029ced912f2bc': {
      name: 'OpenAccessAuthorizer',
      displayName: 'Open Access',
      type: 'open_access',
      abi: AccessControllerABIs.OpenAccessAuthorizer,
      description: 'Open access authorization for public rituals'
    },
    // Known proxy contract that resolves to GlobalAllowList
    '0x3e37c7a9a83b326a0d156de3ee6b18fd8079f698': {
      name: 'GlobalAllowList',
      displayName: 'Global Allow List (Proxy)',
      type: 'global_allow_list',
      abi: AccessControllerABIs.GlobalAllowList,
      description: 'Proxy contract for Global Allow List',
      isProxy: true,
      implementation: '0xc4d8b86343d495db0ab1b985cc03e0e95e7f9a96'
    },
    // Additional Polygon contracts
    '0x685412ce3039ae5c9297bddc8e65487e9dc6712e': {
      name: 'SubscriptionManager',
      displayName: 'Subscription Manager',
      type: 'subscription',
      abi: [],
      description: 'Subscription-based access control'
    }
  },
  tapir: {
    // Tapir testnet
    '0x1234567890abcdef1234567890abcdef12345678': {
      name: 'TestGlobalAllowList',
      displayName: 'Test Global Allow List',
      type: 'global_allow_list',
      abi: AccessControllerABIs.GlobalAllowList,
      description: 'Test network global allow list'
    }
  },
  lynx: {
    // Lynx testnet
    '0xabcdef1234567890abcdef1234567890abcdef12': {
      name: 'TestManagedAllowList',
      displayName: 'Test Managed Allow List',
      type: 'managed_allow_list',
      abi: AccessControllerABIs.ManagedAllowList,
      description: 'Test network managed allow list'
    }
  }
};

// Detect contract type from address and network
export function detectAccessController(address, network = 'polygon', web3 = null) {
  if (!address) return null;
  
  // Normalize address to lowercase for comparison
  const normalizedAddress = address.toLowerCase();
  
  // Check network-specific contracts first
  const networkContracts = AccessControllersByNetwork[network] || {};
  for (const [contractAddress, contractInfo] of Object.entries(networkContracts)) {
    if (contractAddress.toLowerCase() === normalizedAddress) {
      return { ...contractInfo, network, address };
    }
  }
  
  // Check all networks as fallback
  for (const [networkName, contracts] of Object.entries(AccessControllersByNetwork)) {
    for (const [contractAddress, contractInfo] of Object.entries(contracts)) {
      if (contractAddress.toLowerCase() === normalizedAddress) {
        return { ...contractInfo, network: networkName, address };
      }
    }
  }
  
  // Try to detect by common patterns or bytecode analysis
  // This is a fallback for unknown contracts
  return {
    name: 'CustomAccessController',
    displayName: 'Custom Access Controller',
    type: 'custom',
    address: address,
    network: network,
    description: 'Custom access controller contract',
    abi: [],
    needsProxyResolution: true // Flag to indicate we should try proxy resolution
  };
}

// Async version that can resolve proxies
export async function detectAccessControllerAsync(address, network = 'polygon', web3 = null) {
  if (!address) return null;
  
  // First try synchronous detection
  const basicDetection = detectAccessController(address, network);
  
  // If we found a known contract, return it
  if (basicDetection.name !== 'CustomAccessController' || !web3) {
    return basicDetection;
  }
  
  // Try to resolve through proxy
  try {
    const { resolveContract } = await import('./proxyDetection');
    const resolved = await resolveContract(web3, address);
    
    if (resolved.isProxy && resolved.implementation) {
      // Try to detect the implementation contract
      const implDetection = detectAccessController(resolved.implementation, network);
      
      if (implDetection.name !== 'CustomAccessController') {
        // We found a known implementation
        return {
          ...implDetection,
          address: address, // Keep original proxy address
          displayName: `${implDetection.displayName} (Proxy)`,
          description: `Proxy contract for ${implDetection.description}`,
          isProxy: true,
          proxyType: resolved.proxyType,
          implementation: resolved.implementation
        };
      }
    }
  } catch (error) {
    console.error('Error resolving proxy:', error);
  }
  
  return basicDetection;
}

// Get contract interface based on type
export function getContractInterface(contractType) {
  switch (contractType) {
    case 'global_allow_list':
      return {
        methods: ['isAuthorized'],
        events: ['AuthorizationUpdated'],
        canManageAccess: false,
        isPublic: true,
        supportsMultipleRituals: true
      };
    
    case 'managed_allow_list':
      return {
        methods: ['isAuthorized', 'authorize', 'deauthorize', 'getAuthorizedAddresses'],
        events: ['AddressAuthorized', 'AddressDeauthorized'],
        canManageAccess: true,
        isPublic: false,
        supportsMultipleRituals: true
      };
    
    case 'open_access':
      return {
        methods: ['isAuthorized'],
        events: [],
        canManageAccess: false,
        isPublic: true,
        supportsMultipleRituals: true
      };
    
    case 'subscription':
      return {
        methods: ['isSubscribed', 'subscribe', 'unsubscribe', 'getSubscriptionDetails'],
        events: ['Subscribed', 'Unsubscribed', 'SubscriptionRenewed'],
        canManageAccess: true,
        isPublic: false,
        supportsMultipleRituals: false
      };
    
    default:
      return {
        methods: [],
        events: [],
        canManageAccess: false,
        isPublic: false,
        supportsMultipleRituals: false
      };
  }
}

// Format contract name for display
export function formatContractName(contractInfo) {
  if (!contractInfo) return 'Unknown';
  
  // For known contracts, return the proper name
  if (contractInfo.name && contractInfo.name !== 'CustomAccessController') {
    return contractInfo.name;
  }
  
  // For unknown contracts, return shortened address
  if (contractInfo.address) {
    return `${contractInfo.address.slice(0, 6)}...${contractInfo.address.slice(-4)}`;
  }
  
  return 'Unknown';
}

// Get network name for display
export function getNetworkDisplayName(network) {
  const networkNames = {
    mainnet: 'Ethereum Mainnet',
    polygon: 'Polygon',
    tapir: 'Tapir Testnet',
    lynx: 'Lynx Testnet'
  };
  
  return networkNames[network] || network;
}