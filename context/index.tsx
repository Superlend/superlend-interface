'use client'

import { customMetisNetwork, projectId, wagmiAdapter } from '@/config'
import React, { type ReactNode } from 'react'
// import { queryClient } from './query-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
// import { WagmiProvider } from 'wagmi'
import { type Config, cookieToInitialState } from 'wagmi'
import UserTokenBalancesProvider from './user-token-balances-provider'
// import {
//     mainnet,
//     arbitrum,
//     polygon,
//     bsc,
//     gnosis,
//     base,
//     optimism,
//     avalanche,
//     scroll,
//     etherlink,
// } from '@reown/appkit/networks'
// import { createAppKit } from '@reown/appkit/react'
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { base, mainnet, sepolia, polygon } from 'viem/chains';
import { http } from 'wagmi';


// Set up queryClient
const queryClient = new QueryClient()

const appId = "cm5o77rga039b99tzkjakb6ji"

// if (!projectId) {
//     throw new Error('Project ID is not defined')
// }

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://beta.superlend.xyz.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Create the modal
// export const modal = createAppKit({
//     adapters: [wagmiAdapter],
//     projectId,
//     networks: [
//         mainnet,
//         customMetisNetwork,
//         scroll,
//         avalanche,
//         optimism,
//         base,
//         bsc,
//         gnosis,
//         arbitrum,
//         polygon,
//         etherlink,
//     ],
//     defaultNetwork: mainnet,
//     metadata: metadata,
//     features: {
//         analytics: true,
//         connectMethodsOrder: ['wallet'],
//     },
//     themeMode: 'light',
// })

export const config = createConfig({
    chains: [mainnet, sepolia, polygon], // Pass your required chains as an array
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [base.id]: http(),
    },
});

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    const initialState = cookieToInitialState(
        wagmiAdapter.wagmiConfig as Config,
        cookies
    )

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['wallet'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                    logo: 'https://beta.superlend.xyz/images/logos/superlend-logo.webp',
                    landingHeader: "Connect Wallet",
                    loginMessage: "Select wallet to continue",
                    showWalletLoginFirst: true
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>
                    <AssetsDataProvider>
                        <UserTokenBalancesProvider>
                            {children}
                        </UserTokenBalancesProvider>
                    </AssetsDataProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default ContextProvider
