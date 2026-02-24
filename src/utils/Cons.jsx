export const MAINNET_API = import.meta.env.VITE_SUBGRAPH_POLYGON;

export const RPC_ETH_MAINNET = import.meta.env.VITE_RPC_ETH_MAINNET;
export const RPC_ETH_POLYGON = import.meta.env.VITE_RPC_ETH_POLYGON;

export const MAINNET_API_BALANCE = import.meta.env.VITE_MAINNET_AP_BALANCE;

export const DECIMAL_ETH = 1000000000000000000;
export const NETWORK_MAINNET = "mainnet";
export const NETWORK_TESTNET = "testnet";
export const NETWORK_LYNX = "lynx";
export const NETWORK_TAPIR = "tapir";

// Read network from environment variable, default to mainnet if not set
export const DEFAULT_NETWORK = import.meta.env.VITE_NETWORK || NETWORK_MAINNET;

export const TIME_LOCK_DEAUTHORIZATION = 45 * 24 * 60 * 60; //45 days

export const GROUP_LIFE_TIME = 259200; //~30days
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export default MAINNET_API;
