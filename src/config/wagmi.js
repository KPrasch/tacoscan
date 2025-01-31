import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, polygon } from 'wagmi/chains'
import { http, createConfig } from 'wagmi'

// Debug all environment variables first
console.log('All Vite Env Variables:', {
  ...import.meta.env,
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});

// Get projectId from environment variables
const projectId = import.meta.env.VITE_REACT_APP_WALLET_CONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('WalletConnect Project ID is required');
}

const metadata = {
  name: 'TacoScan',
  description: 'DKG Ritual Scanner',
  url: 'https://tacoscan.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Use a public RPC URL that doesn't have CORS issues
const polygonChain = {
  ...polygon,
  rpcUrls: {
    ...polygon.rpcUrls,
    default: {
      http: ['https://polygon-rpc.com']
    },
    public: {
      http: ['https://polygon-rpc.com']
    }
  }
}

const chains = [mainnet, polygonChain]

// Log pre-config
console.log('Pre-config values:', {
  projectId,
  chainNames: chains.map(c => c.name),
});

// Create the wagmi config
export const config = createConfig({
  chains: [polygonChain],
  transports: {
    [polygonChain.id]: http()
  }
})

// Ensure project ID is accessible on the config
config.projectId = projectId

// Log post-config
console.log('Post Wagmi Config:', {
  configProjectId: config.projectId,
  walletConnectEnabled: config.enableWalletConnect,
});

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  enableAnalytics: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#7850cd',
  }
}) 