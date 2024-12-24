'use client'

import { config, projectId, wagmiAdapter } from '@/config'
import React, { type ReactNode } from 'react'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
// import { ThirdwebProvider } from 'thirdweb/react'
import { WagmiProvider } from 'wagmi'
import { Config, cookieToInitialState } from 'wagmi'
import UserTokenBalancesProvider from './user-token-balances-provider'
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'


const customTheme = {
    "--ck-overlay-background": "#fd5a00",
    "--ck-text-color": "#fff",
};

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://beta.superlend.xyz.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum],
    defaultNetwork: mainnet,
    metadata: metadata,
    features: {
        analytics: true // Optional - defaults to your Cloud configuration
    }
})


function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                <AssetsDataProvider>
                    <UserTokenBalancesProvider>
                        <ConnectKitProvider
                            theme="soft"
                        >
                            {children}
                        </ConnectKitProvider>
                    </UserTokenBalancesProvider>
                </AssetsDataProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
