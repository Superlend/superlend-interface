// import { cookieStorage, createStorage, http } from '@wagmi/core'
// import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// import { mainnet, arbitrum } from '@reown/appkit/networks'

// // Get projectId from https://cloud.reown.com
// export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

// if (!projectId) {
//     throw new Error('Project ID is not defined')
// }

// export const networks = [mainnet, arbitrum]

// //Set up the Wagmi Adapter (Config)
// export const wagmiAdapter = new WagmiAdapter({
//     storage: createStorage({
//         storage: cookieStorage
//     }),
//     ssr: true,
//     networks,
//     projectId
// })

// export const config = wagmiAdapter.wagmiConfig

// ===========================================================================

import { http, createConfig } from 'wagmi';
import { base, baseSepolia, mainnet, polygon, sepolia, arbitrum } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, base, baseSepolia, arbitrum],
  connectors: [injected(), coinbaseWallet({ appName: 'Superlend' })],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrum.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
