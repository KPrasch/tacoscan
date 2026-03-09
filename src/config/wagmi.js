import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, polygon } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from '@wagmi/connectors'

// Get projectId from environment variables
const projectId = import.meta.env.VITE_REACT_APP_WALLET_CONNECT_PROJECT_ID || 'dummy_project_id_for_development'

if (!projectId || projectId === 'dummy_project_id_for_development') {
  console.warn('⚠️ WalletConnect Project ID is not configured properly.');
  console.warn('To enable WalletConnect, please:');
  console.warn('1. Get a free Project ID from https://cloud.walletconnect.com');
  console.warn('2. Add it to your .env file as VITE_REACT_APP_WALLET_CONNECT_PROJECT_ID=your_actual_id');
}

const metadata = {
  name: 'TACo Scan',
  description: 'TACo Network Explorer - Track DKG Rituals and Node Operators',
  url: 'https://tacoscan.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains
const chains = [polygon, mainnet]

// Create wagmi config with WalletConnect support
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  // Enable WalletConnect and other wallet providers
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  // Custom wallet connectors
  connectors: [
    // WalletConnect v2
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-accent': '#96FF5E',
          '--wcm-background': '#FFFFFF',
        }
      }
    }),
    // Injected wallets (MetaMask, etc.)
    injected({
      shimDisconnect: true,
      target() {
        return {
          id: 'metamask',
          name: 'MetaMask',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      }
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    })
  ]
})

// Initialize Web3Modal with TACo theme
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: polygon,
  enableAnalytics: true,
  enableOnramp: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#96FF5E',
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': '"Space Mono", monospace',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ]
})