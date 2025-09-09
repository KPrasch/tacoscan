import Web3 from "web3";
import mainnetArtifacts from '../artifacts/mainnet.json';
import lynxArtifacts from '../artifacts/lynx.json';
import tapirArtifacts from '../artifacts/tapir.json';

// Get TACoApplication ABI and address
const getTACoApplication = (network = 'mainnet') => {
  let artifacts;
  
  switch (network) {
    case 'lynx':
      artifacts = lynxArtifacts;
      break;
    case 'tapir':
      artifacts = tapirArtifacts;
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
    console.warn(`TACoApplication not found for network ${network}, falling back to mainnet`);
    return mainnetArtifacts['1'].TACoApplication;
  }
  
  return artifacts.TACoApplication;
};

// Get RPC URL for network
const getRpcUrl = (network) => {
  switch (network) {
    case 'lynx':
      return 'https://polygon-amoy.g.alchemy.com/v2/demo'; // Amoy testnet (Lynx)
    case 'tapir':
      return 'https://polygon-amoy.g.alchemy.com/v2/demo'; // Amoy testnet (Tapir)
    case 'polygon':
      return 'https://polygon-rpc.com';
    case 'mainnet':
    default:
      return 'https://cloudflare-eth.com';
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
    
    // Call stakingProviderInfo to get all data in one call
    const info = await contract.methods.stakingProviderInfo(stakingProvider).call();
    
    // Parse the response - keep amounts in wei for consistency with subgraph
    return {
      operator: info.operator,
      operatorConfirmed: info.operatorConfirmed,
      operatorStartTimestamp: parseInt(info.operatorStartTimestamp),
      authorized: info.authorized, // Keep in wei
      deauthorizing: info.deauthorizing, // Keep in wei
      endDeauthorization: parseInt(info.endDeauthorization),
      tReward: info.tReward, // Keep in wei
      endCommitment: parseInt(info.endCommitment)
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