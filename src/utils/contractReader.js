import Web3 from "web3";
import mainnetArtifacts from '../artifacts/mainnet.json';
import lynxArtifacts from '../artifacts/lynx.json';
import tapirArtifacts from '../artifacts/tapir.json';
import { getCurrentNetwork } from './dataSource';

// Get TACoApplication ABI and address
const getTACoApplication = (network = 'mainnet') => {
  let artifacts;

  switch (network) {
    case 'lynx':
      // Lynx artifacts are under Sepolia chain ID
      artifacts = lynxArtifacts['11155111'];
      break;
    case 'tapir':
      // Tapir artifacts are under Sepolia chain ID
      artifacts = tapirArtifacts['11155111'];
      break;
    case 'polygon':
      // Polygon artifacts are in mainnet.json under key "137"
      artifacts = mainnetArtifacts['137'];
      break;
    case 'mainnet':
    default:
      // Ethereum mainnet artifacts are under key "1"
      artifacts = mainnetArtifacts['1'];
      break;
  }

  if (!artifacts || !artifacts.TACoApplication) {
    console.warn(`TACoApplication not found for network ${network}, artifacts:`, artifacts ? Object.keys(artifacts) : 'none');
    return null;
  }

  return artifacts.TACoApplication;
};

// Get TestnetThresholdStaking contract for testnets
const getTestnetStaking = (network = 'mainnet') => {
  let artifacts;

  switch (network) {
    case 'lynx':
      artifacts = lynxArtifacts['11155111'];
      break;
    case 'tapir':
      artifacts = tapirArtifacts['11155111'];
      break;
    default:
      return null; // Only testnets have TestnetThresholdStaking
  }

  if (!artifacts || !artifacts.TestnetThresholdStaking) {
    console.warn(`TestnetThresholdStaking not found for network ${network}`);
    return null;
  }

  return artifacts.TestnetThresholdStaking;
};

// Get RPC URL for network
const getRpcUrl = (network) => {
  switch (network) {
    case 'lynx':
    case 'tapir':
      // Both Lynx and Tapir use Sepolia (chain ID 11155111)
      return import.meta.env.VITE_RPC_ETH_MAINNET || 'https://eth-sepolia.g.alchemy.com/v2/demo';
    case 'polygon':
      return import.meta.env.VITE_RPC_ETH_POLYGON || 'https://polygon-rpc.com';
    case 'mainnet':
    default:
      return import.meta.env.VITE_RPC_ETH_MAINNET || 'https://cloudflare-eth.com';
  }
};

// Read staking provider info directly from contract
export const getStakingProviderInfo = async (stakingProvider, network = 'mainnet') => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error('TACoApplication not found');
      return null;
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // For testnets, also get TestnetThresholdStaking contract
    const testnetStaking = getTestnetStaking(network);
    let stakingContract = null;
    let stakingInfo = {};

    if (testnetStaking) {
      stakingContract = new web3.eth.Contract(testnetStaking.abi, testnetStaking.address);

      // On testnets, get stake info from TestnetThresholdStaking
      try {
        // Get authorized stake from TestnetThresholdStaking
        const authorizedStake = await stakingContract.methods.authorizedStake(stakingProvider, tacoApp.address).call();

        // Get staking provider info from TestnetThresholdStaking if available
        try {
          const providerInfo = await stakingContract.methods.stakingProviderInfo(stakingProvider).call();
          stakingInfo = {
            authorized: authorizedStake || '0',
            stakedAmount: providerInfo?.tStake || '0',
            ...providerInfo
          };
        } catch {
          // If stakingProviderInfo doesn't exist, just use authorizedStake
          stakingInfo = {
            authorized: authorizedStake || '0'
          };
        }

        // Get roles (owner, operator, etc.) from TestnetThresholdStaking
        try {
          const roles = await stakingContract.methods.rolesOf(stakingProvider).call();
          if (roles) {
            stakingInfo.owner = roles.owner || stakingProvider;
            stakingInfo.operator = roles.operator || roles.owner || stakingProvider;
          }
        } catch {
          // If rolesOf fails, default to stakingProvider
          stakingInfo.owner = stakingProvider;
          stakingInfo.operator = stakingProvider;
        }
      } catch (error) {
        console.error('Error reading from TestnetThresholdStaking:', error);
      }
    }

    // Get operator info from TACoApplication
    let tacoInfo;
    try {
      tacoInfo = await contract.methods.stakingProviderInfo(stakingProvider).call();
    } catch {
      // If TACoApplication doesn't have the info, return what we have from TestnetThresholdStaking
      if (testnetStaking && stakingInfo.authorized) {
        return {
          operator: stakingInfo.operator || stakingProvider,
          operatorConfirmed: false,
          operatorStartTimestamp: 0,
          authorized: stakingInfo.authorized,
          deauthorizing: '0',
          endDeauthorization: 0,
          tReward: '0',
          endCommitment: 0,
          ...stakingInfo
        };
      }
      return null;
    }

    // For testnets, merge info from both contracts
    if (testnetStaking) {
      return {
        operator: tacoInfo.operator || stakingInfo.operator || stakingProvider,
        operatorConfirmed: tacoInfo.operatorConfirmed || false,
        operatorStartTimestamp: parseInt(tacoInfo.operatorStartTimestamp || 0),
        authorized: stakingInfo.authorized || tacoInfo.authorized || '0',
        deauthorizing: tacoInfo.deauthorizing || '0',
        endDeauthorization: parseInt(tacoInfo.endDeauthorization || 0),
        tReward: tacoInfo.tReward || '0',
        endCommitment: parseInt(tacoInfo.endCommitment || 0),
        stakedAmount: stakingInfo.stakedAmount || '0'
      };
    }

    // For mainnet, use TACoApplication info as before
    return {
      operator: tacoInfo.operator,
      operatorConfirmed: tacoInfo.operatorConfirmed,
      operatorStartTimestamp: parseInt(tacoInfo.operatorStartTimestamp),
      authorized: tacoInfo.authorized,
      deauthorizing: tacoInfo.deauthorizing,
      endDeauthorization: parseInt(tacoInfo.endDeauthorization),
      tReward: tacoInfo.tReward,
      endCommitment: parseInt(tacoInfo.endCommitment)
    };
  } catch (error) {
    console.error('Error reading staking provider info:', error);
    return null;
  }
};

// Get authorized stake amount
export const getAuthorizedStake = async (stakingProvider, network = 'mainnet') => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error('TACoApplication not found');
      return '0';
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // Call authorizedStake
    const stake = await contract.methods.authorizedStake(stakingProvider).call();

    return stake; // Return in wei for consistency
  } catch (error) {
    console.error('Error reading authorized stake:', error);
    return '0';
  }
};

// Get all staking providers from contract events
export const getAllStakingProviders = async (network = 'mainnet') => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error('TACoApplication not found');
      return [];
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // For testnets, we need to check TestnetThresholdStaking for stake amounts
    const testnetStaking = getTestnetStaking(network);
    let stakingContract = null;
    if (testnetStaking) {
      stakingContract = new web3.eth.Contract(testnetStaking.abi, testnetStaking.address);
    }

    // Get events for all operator confirmations (these represent active nodes)
    const events = await contract.getPastEvents('OperatorConfirmed', {
      fromBlock: 0,
      toBlock: 'latest'
    });

    console.log(`Found ${events.length} OperatorConfirmed events on ${network}`);

    // Get unique staking providers
    const stakingProviders = new Set();
    events.forEach(event => {
      if (event.returnValues && event.returnValues.stakingProvider) {
        stakingProviders.add(event.returnValues.stakingProvider);
      }
    });

    // If on testnet and no operators found, try getting stakes directly from TestnetThresholdStaking
    if (stakingProviders.size === 0 && stakingContract) {
      console.log('No operators found, checking TestnetThresholdStaking for staked providers...');

      // Try to get all staking providers who have authorized to TACoApplication
      const authEvents = await stakingContract.getPastEvents('AuthorizationIncreased', {
        fromBlock: 0,
        toBlock: 'latest',
        filter: { application: tacoApp.address }
      });

      authEvents.forEach(event => {
        if (event.returnValues && event.returnValues.stakingProvider) {
          stakingProviders.add(event.returnValues.stakingProvider);
        }
      });

      console.log(`Found ${stakingProviders.size} providers from AuthorizationIncreased events`);
    }

    // Fetch data for each provider
    const providers = [];
    for (const provider of stakingProviders) {
      const info = await getStakingProviderInfo(provider, network);
      if (info) {
        providers.push({
          stakingProvider: provider,
          ...info
        });
      }
    }

    return providers;
  } catch (error) {
    console.error('Error fetching all staking providers:', error);
    return [];
  }
};

// Get Coordinator contract for rituals
const getCoordinator = (network = 'mainnet') => {
  let artifacts;

  switch (network) {
    case 'lynx':
      // Check if Lynx has a Coordinator contract
      artifacts = lynxArtifacts['11155111'];
      break;
    case 'tapir':
      // Check if Tapir has a Coordinator contract
      artifacts = tapirArtifacts['11155111'];
      break;
    case 'polygon':
      artifacts = mainnetArtifacts['137'];
      break;
    case 'mainnet':
    default:
      artifacts = mainnetArtifacts['1'];
      break;
  }

  // Look for Coordinator contract
  if (artifacts) {
    // Try different possible names
    const coordinatorNames = ['Coordinator', 'CoordinatorAgent', 'DKGCoordinator'];
    for (const name of coordinatorNames) {
      if (artifacts[name]) {
        return artifacts[name];
      }
    }
  }

  return null;
};

// Get all rituals from contract
export const getAllRituals = async (network = 'mainnet') => {
  try {
    const coordinator = getCoordinator(network);

    if (!coordinator) {
      console.log('Coordinator contract not found for network:', network);
      return [];
    }

    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const contract = new web3.eth.Contract(coordinator.abi, coordinator.address);

    // Get the total number of rituals
    let numRituals;
    try {
      numRituals = await contract.methods.numberOfRituals().call();
    } catch {
      // Try alternative method name
      try {
        numRituals = await contract.methods.ritualsCount().call();
      } catch {
        console.log('Could not determine number of rituals');
        return [];
      }
    }

    // Fetch each ritual's data
    const rituals = [];
    for (let i = 0; i < numRituals; i++) {
      try {
        const ritual = await contract.methods.rituals(i).call();
        rituals.push({
          id: i,
          ...ritual
        });
      } catch (error) {
        console.error(`Error fetching ritual ${i}:`, error);
      }
    }

    return rituals;
  } catch (error) {
    console.error('Error fetching all rituals:', error);
    return [];
  }
};