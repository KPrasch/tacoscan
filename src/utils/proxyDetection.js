// Proxy contract detection and resolution utilities
import Web3 from 'web3';

// Common proxy storage slots
const IMPLEMENTATION_SLOTS = {
  EIP1967: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', // EIP-1967 implementation slot
  EIP1967_BEACON: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50', // EIP-1967 beacon slot
  OPENZEPPELIN_OLD: '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3', // Old OpenZeppelin slot
  EIP1822: '0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7', // EIP-1822 UUPS slot
};

// Proxy detection patterns in bytecode
const PROXY_PATTERNS = {
  DELEGATE_CALL: '5b60806040', // Common delegatecall pattern
  TRANSPARENT_PROXY: '360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', // EIP-1967 in bytecode
  MINIMAL_PROXY: '363d3d373d3d3d363d73', // EIP-1167 minimal proxy pattern
};

/**
 * Detect if a contract is a proxy by checking its bytecode
 */
export async function isProxy(web3, address) {
  try {
    const code = await web3.eth.getCode(address);
    
    // Check for minimal proxy pattern (EIP-1167)
    if (code.includes(PROXY_PATTERNS.MINIMAL_PROXY)) {
      return { isProxy: true, type: 'minimal' };
    }
    
    // Check for delegatecall pattern
    if (code.includes(PROXY_PATTERNS.DELEGATE_CALL)) {
      return { isProxy: true, type: 'delegatecall' };
    }
    
    // Check for transparent proxy pattern
    if (code.includes(PROXY_PATTERNS.TRANSPARENT_PROXY)) {
      return { isProxy: true, type: 'transparent' };
    }
    
    // If code is very small, it might be a proxy
    if (code.length < 200) {
      return { isProxy: true, type: 'unknown' };
    }
    
    return { isProxy: false };
  } catch (error) {
    console.error('Error checking proxy:', error);
    return { isProxy: false };
  }
}

/**
 * Get implementation address from a proxy contract
 */
export async function getImplementation(web3, proxyAddress) {
  try {
    // Try EIP-1967 implementation slot
    let implementation = await web3.eth.getStorageAt(proxyAddress, IMPLEMENTATION_SLOTS.EIP1967);
    if (implementation && implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '0x' + implementation.slice(26); // Remove padding
    }
    
    // Try EIP-1967 beacon slot
    const beacon = await web3.eth.getStorageAt(proxyAddress, IMPLEMENTATION_SLOTS.EIP1967_BEACON);
    if (beacon && beacon !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      const beaconAddress = '0x' + beacon.slice(26);
      // Get implementation from beacon
      implementation = await web3.eth.getStorageAt(beaconAddress, IMPLEMENTATION_SLOTS.EIP1967);
      if (implementation && implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return '0x' + implementation.slice(26);
      }
    }
    
    // Try old OpenZeppelin slot
    implementation = await web3.eth.getStorageAt(proxyAddress, IMPLEMENTATION_SLOTS.OPENZEPPELIN_OLD);
    if (implementation && implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '0x' + implementation.slice(26);
    }
    
    // Try EIP-1822 UUPS slot
    implementation = await web3.eth.getStorageAt(proxyAddress, IMPLEMENTATION_SLOTS.EIP1822);
    if (implementation && implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '0x' + implementation.slice(26);
    }
    
    // Try to call implementation() method if it exists
    try {
      const implAbi = [{
        "inputs": [],
        "name": "implementation",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }];
      
      const contract = new web3.eth.Contract(implAbi, proxyAddress);
      const implAddress = await contract.methods.implementation().call();
      if (implAddress && implAddress !== '0x0000000000000000000000000000000000000000') {
        return implAddress;
      }
    } catch (e) {
      // Method doesn't exist, continue
    }
    
    // Try to parse minimal proxy bytecode for target
    const code = await web3.eth.getCode(proxyAddress);
    if (code.includes('363d3d373d3d3d363d73')) {
      // Extract address from minimal proxy bytecode
      const startIndex = code.indexOf('363d3d373d3d3d363d73') + 20;
      const targetAddress = '0x' + code.substr(startIndex, 40);
      if (web3.utils.isAddress(targetAddress)) {
        return targetAddress;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting implementation:', error);
    return null;
  }
}

/**
 * Resolve a contract address through any proxy layers
 */
export async function resolveContract(web3, address) {
  const proxyInfo = await isProxy(web3, address);
  
  if (!proxyInfo.isProxy) {
    return { 
      address: address, 
      isProxy: false,
      proxyType: null,
      implementation: null
    };
  }
  
  const implementation = await getImplementation(web3, address);
  
  if (implementation) {
    // Check if implementation is also a proxy (nested proxies)
    const implProxyInfo = await isProxy(web3, implementation);
    if (implProxyInfo.isProxy) {
      // Recursively resolve
      const resolved = await resolveContract(web3, implementation);
      return {
        address: address,
        isProxy: true,
        proxyType: proxyInfo.type,
        implementation: resolved.implementation || resolved.address,
        chain: [address, implementation, resolved.implementation || resolved.address]
      };
    }
    
    return {
      address: address,
      isProxy: true,
      proxyType: proxyInfo.type,
      implementation: implementation
    };
  }
  
  return {
    address: address,
    isProxy: true,
    proxyType: proxyInfo.type,
    implementation: null
  };
}