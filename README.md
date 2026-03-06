# TACo Scan

Provide insight into the workings of the TACo system.

Live at: https://tacoscan.com/

## Installation

```bash
git clone https://github.com/threshold-network/tacoscan.git
cd tacoscan
npm install -g yarn
yarn install
yarn codegen

# Set up environment variables
cp .env.example .env
# Edit .env and add your WalletConnect Project ID

# run in dev mode
yarn start

# run in production mode
yarn build-prod
yarn preview

# http://localhost:4001
```

## Wallet Configuration

This application supports multiple wallet connection methods including WalletConnect v2, MetaMask, and Coinbase Wallet.

### Setup WalletConnect
1. Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Add it to your `.env` file:
   ```
   VITE_REACT_APP_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

### Supported Wallets
- MetaMask (browser extension and mobile)
- WalletConnect (any compatible mobile wallet)
- Coinbase Wallet
- Rainbow Wallet
- Trust Wallet
- And more...

For detailed wallet setup instructions, see [WALLET_SETUP.md](./WALLET_SETUP.md)
