import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import { metaMask } from 'wagmi/connectors';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
    throw new Error('Project ID is not defined');
}

export const networks = [mainnet, arbitrum];

export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    networks,
    projectId,
    connectors: [
        metaMask(),
        // Add other connectors as needed
    ],
});

export const config = wagmiAdapter.wagmiConfig;