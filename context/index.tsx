'use client'

// import { wagmiAdapter, projectId } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
import { siweConfig } from '@/config/siwe'
import { ThirdwebProvider } from "thirdweb/react";


// if (!projectId) {
//     throw new Error('Project ID is not defined')
// }

// Set up metadata
const metadata = {
    name: "Superlend",
    description: "Superlend",
    url: "https://beta.superlend.xyz",
    icons: ["https://avatars.githubusercontent.com/u/179229932"]
}

// Create the modal
// const modal = createAppKit({
//     adapters: [wagmiAdapter],
//     projectId,
//     networks: [mainnet, arbitrum, avalanche, base, optimism, polygon],
//     defaultNetwork: mainnet,
//     metadata: metadata,
//     features: {
//         analytics: true,
//         email: false,
//         socials: [],
//     },
//     themeMode: 'light',
//     siweConfig: siweConfig,
// })

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    // const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <ThirdwebProvider>
            {/* <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}> */}
            <QueryClientProvider client={queryClient}>
                <AssetsDataProvider>
                    {children}
                </AssetsDataProvider>
            </QueryClientProvider>
            {/* </WagmiProvider> */}
        </ThirdwebProvider>
    )
}

export default ContextProvider