import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 4001
    },
    plugins: [
        react(),
        svgr(),
        visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true
        })
    ],
    publicDir: 'public',
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('react-router')) {
                            return 'react-vendor';
                        }
                        if (id.includes('web3') || id.includes('viem') || id.includes('wagmi')) {
                            return 'web3-vendor';
                        }
                        if (id.includes('@web3modal')) {
                            return 'wallet-vendor';
                        }
                        if (id.includes('lottie') || id.includes('react-table')) {
                            return 'ui-vendor';
                        }
                        if (id.includes('graphql') || id.includes('@graphprotocol')) {
                            return 'graphql-vendor';
                        }
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})