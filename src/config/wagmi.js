import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, polygon } from 'wagmi/chains'

// Get projectId at https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

const metadata = {
  name: 'TacoScan',
  description: 'DKG Ritual Scanner',
  url: 'https://tacoscan.io', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, polygon]
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
})

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