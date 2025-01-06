'use client'

import { customMetisNetwork, projectId, wagmiAdapter } from '@/config'
import React, { type ReactNode } from 'react'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
import { WagmiProvider } from 'wagmi'
import { Config, cookieToInitialState } from 'wagmi'
import UserTokenBalancesProvider from './user-token-balances-provider'
import {
    mainnet,
    arbitrum,
    polygon,
    bsc,
    gnosis,
    base,
    optimism,
    avalanche,
    scroll,
} from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://beta.superlend.xyz.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Create the modal
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [
        mainnet,
        customMetisNetwork,
        scroll,
        avalanche,
        optimism,
        base,
        bsc,
        gnosis,
        arbitrum,
        polygon,
    ],
    defaultNetwork: mainnet,
    metadata: metadata,
    features: {
        analytics: true,
        connectMethodsOrder: ['wallet'],
    },
    themeMode: 'light',
})

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
        <WagmiProvider
            config={wagmiAdapter.wagmiConfig as Config}
            initialState={initialState}
        >
            <QueryClientProvider client={queryClient}>
                <AssetsDataProvider>
                    <UserTokenBalancesProvider>
                        {children}
                    </UserTokenBalancesProvider>
                </AssetsDataProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
