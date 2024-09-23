'use client'

import { wagmiAdapter, projectId } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'


if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: "appkit-example-scroll",
    description: "AppKit Example - Scroll",
    url: "https://scrollapp.com", // origin must match your domain & subdomain
    icons: ["https://avatars.githubusercontent.com/u/179229932"]
}

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum, avalanche, base, optimism, polygon],
    defaultNetwork: mainnet,
    metadata: metadata,
    features: {
        analytics: false,
        email: false,
        socials: [],
    },
    themeMode: 'light',
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                <AssetsDataProvider>
                    {children}
                </AssetsDataProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider