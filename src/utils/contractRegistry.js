// Unified contract registry using official NuCypher artifacts
import mainnetArtifacts from "../artifacts/mainnet.json";
import lynxArtifacts from "../artifacts/lynx.json";
import tapirArtifacts from "../artifacts/tapir.json";

// Network IDs
const NETWORKS = {
  MAINNET: "1",
  POLYGON: "137",
  LYNX: "80002",
  TAPIR: "80002", // Tapir is also on Mumbai testnet
};

// Load all contracts from artifacts
const contractRegistry = {
  mainnet: {},
  polygon: {},
  lynx: {},
  tapir: {},
};

// Helper to extract contract info
function extractContractInfo(contractData, contractName) {
  if (!contractData || !contractData.address) return null;

  return {
    name: contractName,
    address: contractData.address.toLowerCase(),
    abi: contractData.abi || [],
    deploymentInfo: {
      deployer: contractData.deployer,
      txHash: contractData.tx_hash,
      blockNumber: contractData.block_number,
    },
  };
}

// Helper to load contracts from an artifact file into a registry bucket.
// Artifacts are structured as { chainId: { contractName: { address, abi, ... } } }.
function loadArtifacts(artifacts, registryBucket) {
  Object.entries(artifacts).forEach(([chainId, chainData]) => {
    if (chainData && typeof chainData === "object") {
      Object.entries(chainData).forEach(([name, data]) => {
        if (data && data.address) {
          const info = extractContractInfo(data, name);
          if (info) {
            registryBucket[info.address] = info;
          }
        }
      });
    }
  });
}

// Load mainnet contracts (chain 1 -> mainnet, chain 137 -> polygon)
if (mainnetArtifacts[NETWORKS.MAINNET]) {
  loadArtifacts(
    { [NETWORKS.MAINNET]: mainnetArtifacts[NETWORKS.MAINNET] },
    contractRegistry.mainnet,
  );
}
if (mainnetArtifacts[NETWORKS.POLYGON]) {
  loadArtifacts(
    { [NETWORKS.POLYGON]: mainnetArtifacts[NETWORKS.POLYGON] },
    contractRegistry.polygon,
  );
}

// Load Lynx contracts (all chains)
loadArtifacts(lynxArtifacts, contractRegistry.lynx);

// Load Tapir contracts (all chains)
loadArtifacts(tapirArtifacts, contractRegistry.tapir);

// Get contract by address and network
export function getContract(address, network = "polygon") {
  if (!address) return null;

  const normalizedAddress = address.toLowerCase();
  const networkRegistry = contractRegistry[network] || {};

  // First check the specific network
  if (networkRegistry[normalizedAddress]) {
    return { ...networkRegistry[normalizedAddress], network };
  }

  // Check all networks as fallback
  for (const [networkName, contracts] of Object.entries(contractRegistry)) {
    if (contracts[normalizedAddress]) {
      return { ...contracts[normalizedAddress], network: networkName };
    }
  }

  return null;
}

// Get fee model information
export function getFeeModelInfo(address, network = "polygon") {
  if (!address) return null;

  // Handle zero address
  if (
    address === "0x0000000000000000000000000000000000000000" ||
    address === "0x" ||
    parseInt(address, 16) === 0
  ) {
    return {
      name: "None",
      displayName: "No Fee Model",
      type: "free",
      paymentToken: "None",
      description: "No fees required",
      address: address,
      network: network,
    };
  }

  // Check for known contracts that are deployed cross-chain with same address
  const normalizedAddress = address.toLowerCase();

  // FreeFeeModel - deployed on mainnet and used on polygon
  if (normalizedAddress === "0x1acaf2677b987e690a09296babdce6376712213d") {
    return {
      name: "FreeFeeModel",
      displayName: "Free Fee Model",
      type: "free",
      paymentToken: "None",
      description: "Official FreeFeeModel contract - No fees required",
      address: address,
      network: network,
    };
  }

  // StandardSubscription on Polygon
  if (normalizedAddress === "0x44da7e4097f6538ba10b0771ceb6b3955d05f1d3") {
    return {
      name: "StandardSubscription",
      displayName: "Standard Subscription",
      type: "subscription",
      paymentToken: "DAI",
      description:
        "Official StandardSubscription contract with periodic payments",
      address: address,
      network: network,
    };
  }

  const contract = getContract(address, network);

  if (!contract) {
    return {
      name: "Unknown",
      displayName: "Custom Fee Model",
      type: "custom",
      paymentToken: "Unknown",
      description: "Custom fee model contract",
      address: address,
      network: network,
    };
  }

  // Determine fee model type based on contract name
  const name = contract.name;

  if (name === "FreeFeeModel") {
    return {
      ...contract,
      displayName: "Free Fee Model",
      type: "free",
      paymentToken: "None",
      description: "Official FreeFeeModel contract - No fees required",
    };
  } else if (name === "StandardSubscription" || name.includes("Subscription")) {
    const paymentToken = name.includes("BqETH") ? "BqETH" : "DAI";
    return {
      ...contract,
      displayName: name.replace(/([A-Z])/g, " $1").trim(),
      type: "subscription",
      paymentToken: paymentToken,
      description: `${paymentToken} subscription model with periodic payments`,
    };
  } else if (name.includes("FlatRate")) {
    return {
      ...contract,
      displayName: "Flat Rate Fee Model",
      type: "flat_rate",
      paymentToken: "DAI",
      description: "Flat rate fee model with fixed pricing",
    };
  } else if (name.includes("Managed")) {
    return {
      ...contract,
      displayName: "Managed Fee Model",
      type: "managed",
      paymentToken: "Various",
      description: "Managed fee model with custom pricing",
    };
  }

  // Default to custom
  return {
    ...contract,
    displayName: contract.name,
    type: "custom",
    paymentToken: "Unknown",
    description: "Custom fee model",
  };
}

// Get access controller information
export function getAccessControllerInfo(address, network = "polygon") {
  if (!address) return null;

  // Check for known GlobalAllowList proxy on Polygon
  if (address.toLowerCase() === "0x3e37c7a9a83b326a0d156de3ee6b18fd8079f698") {
    return {
      name: "GlobalAllowList",
      displayName: "Global Allow List",
      type: "global_allow_list",
      description: "Allows all addresses to access the ritual",
      address: address,
      network: network,
      isProxy: true,
    };
  }

  const contract = getContract(address, network);

  if (!contract) {
    return {
      name: "Unknown",
      displayName: "Custom Access Controller",
      type: "custom",
      description: "Custom access controller contract",
      address: address,
      network: network,
    };
  }

  // Determine access controller type based on contract name
  const name = contract.name;

  if (name === "GlobalAllowList") {
    return {
      ...contract,
      displayName: "Global Allow List",
      type: "global_allow_list",
      description: "Allows all addresses to access the ritual",
      isProxy:
        address.toLowerCase() === "0x3e37c7a9a83b326a0d156de3ee6b18fd8079f698",
    };
  } else if (name === "ManagedAllowList" || name.includes("Managed")) {
    return {
      ...contract,
      displayName: "Managed Allow List",
      type: "managed_allow_list",
      description: "Admin-managed list of allowed addresses",
    };
  } else if (name === "OpenAccessAuthorizer" || name.includes("OpenAccess")) {
    return {
      ...contract,
      displayName: "Open Access",
      type: "open_access",
      description: "Open access authorization for public rituals",
    };
  }

  // Default to custom
  return {
    ...contract,
    displayName: contract.name,
    type: "custom",
    description: "Custom access controller",
  };
}

// Export the full registry for debugging
export { contractRegistry };
