// Utility to determine data source based on network
import { DEFAULT_NETWORK, NETWORK_LYNX, NETWORK_TAPIR } from './Cons';

// Check if the current network has a subgraph
export const hasSubgraph = (network = DEFAULT_NETWORK) => {
  // Only mainnet and polygon have subgraphs currently
  return network !== NETWORK_LYNX && network !== NETWORK_TAPIR;
};

// Get the current network
export const getCurrentNetwork = () => {
  return DEFAULT_NETWORK;
};

// Check if we should use contract reads
export const shouldUseContractReads = (network = DEFAULT_NETWORK) => {
  return !hasSubgraph(network);
};