import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, bsc, gnosis, base, optimism, avalanche, scroll } from '@reown/appkit/networks'
import { defineChain } from '@reown/appkit/networks';

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Define the custom network for Metis
export const customMetisNetwork = defineChain({
    id: 1088,  // Metis mainnet chain ID
    caipNetworkId: 'eip155:1088',  // CAIP Network ID for Metis mainnet
    chainNamespace: 'eip155',  // Ethereum-like chain namespace
    name: 'Metis',
    nativeCurrency: {
        decimals: 18,
        name: 'Metis',
        symbol: 'METIS',  // Symbol for Metis currency
    },
    rpcUrls: {
        default: {
            http: ['https://andromeda.metis.io/?owner=1088'],  // RPC URL for Metis mainnet
            webSocket: ['wss://andromeda.metis.io/ws'],  // WebSocket RPC URL for Metis mainnet
        },
    },
    blockExplorers: {
        default: {
            name: 'Metis Explorer',
            url: 'https://andromeda-explorer.metis.io',  // Block explorer URL for Metis
        },
    },
    contracts: {
        // Add any Metis-specific contracts here if needed
    }
});

export const networks = [mainnet, customMetisNetwork, scroll, avalanche, optimism, base, bsc, gnosis, arbitrum, polygon]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    networks,
    projectId
})

export const config = wagmiAdapter.wagmiConfig
