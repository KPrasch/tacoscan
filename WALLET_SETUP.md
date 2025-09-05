# WalletConnect Setup Guide

## Overview
TACo Scan supports multiple wallet connection methods including WalletConnect v2, MetaMask, Coinbase Wallet, and other EIP-6963 compatible wallets.

## Supported Wallets
- **MetaMask** - Browser extension and mobile app
- **WalletConnect** - Connect any WalletConnect-compatible mobile wallet
- **Coinbase Wallet** - Browser extension and mobile app
- **Rainbow Wallet** - Mobile wallet with great UX
- **Trust Wallet** - Popular mobile wallet
- **And many more** - Any wallet supporting WalletConnect v2 protocol

## Configuration

### 1. Get a WalletConnect Project ID
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID

### 2. Set up Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your WalletConnect Project ID:
   ```
   VITE_REACT_APP_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

### 3. Restart the Development Server
```bash
npm start
```

## Features
- **Multi-wallet Support**: Connect using MetaMask, WalletConnect, Coinbase, and more
- **Mobile Friendly**: Scan QR codes to connect mobile wallets
- **Chain Switching**: Automatic prompts to switch to Polygon network
- **Persistent Sessions**: Wallet connections persist across page refreshes
- **Custom Theme**: TACo-branded wallet modal with green accent colors

## Network Support
- **Primary Network**: Polygon (Chain ID: 137)
- **Secondary Network**: Ethereum Mainnet (Chain ID: 1)

## Troubleshooting

### WalletConnect not working
- Ensure you have a valid Project ID in your `.env` file
- Check that the Project ID is not the default placeholder value
- Try clearing your browser cache and localStorage

### MetaMask connection issues
- Ensure MetaMask extension is installed and unlocked
- Check that you're on a supported network (Polygon or Mainnet)
- Try disconnecting and reconnecting

### Mobile wallet connection
- Use the WalletConnect option and scan the QR code
- Ensure your mobile wallet supports WalletConnect v2
- Check that you're on the same network on both devices