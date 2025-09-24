#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const network = process.argv[2];

if (!network || !['mainnet', 'lynx', 'tapir'].includes(network)) {
  console.error('Please specify a network: mainnet, lynx, or tapir');
  console.error('Usage: node scripts/use-env.js [network]');
  process.exit(1);
}

const sourceFile = path.join(process.cwd(), `.env.${network}`);
const targetFile = path.join(process.cwd(), '.env');

if (!fs.existsSync(sourceFile)) {
  console.error(`Environment file ${sourceFile} not found`);
  process.exit(1);
}

fs.copyFileSync(sourceFile, targetFile);
console.log(`✓ Using ${network} environment (.env.${network} → .env)`);