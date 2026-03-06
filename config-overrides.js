const path = require('path');

module.exports = function override(config) {
  // Fix for packages using exports field (not supported in webpack 4)
  config.resolve.alias = {
    ...config.resolve.alias,
    '@web3modal/wagmi/react': path.resolve(__dirname, 'node_modules/@web3modal/wagmi/dist/esm/exports/react/index.js'),
    '@web3modal/wagmi/react/config': path.resolve(__dirname, 'node_modules/@web3modal/wagmi/dist/esm/exports/react/config.js'),
  };
  return config;
};
