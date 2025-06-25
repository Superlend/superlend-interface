'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
import UserTokenBalancesProvider from './user-token-balances-provider'
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import {
    base,
    mainnet,
    polygon,
    avalanche,
    optimism,
    gnosis,
    arbitrum,
    etherlink,
    bsc,
    scroll,
    metis,
    linea,
    sonic,
} from 'viem/chains'
import { http } from 'wagmi'
import { AnalyticsProvider } from './analytics-provider'
import { ShowAllMarketsProvider } from './show-all-markets-provider'
import { AuthProvider } from './auth-provider'

// Set up queryClient
const queryClient = new QueryClient()

const appId = 'cm5o77rga039b99tzkjakb6ji'
const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

export const config = createConfig({
    chains: [
        mainnet,
        polygon,
        base,
        scroll,
        avalanche,
        optimism,
        bsc,
        gnosis,
        arbitrum,
        etherlink,
        metis,
        linea,
        sonic,
    ], // Pass your required chains as an array
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [base.id]: http(),
        [metis.id]: http(),
        [scroll.id]: http(),
        [avalanche.id]: http(),
        [optimism.id]: http(),
        [bsc.id]: http(),
        [gnosis.id]: http(),
        [arbitrum.id]: http(),
        [etherlink.id]: http(),
        [linea.id]: http(),
        [sonic.id]: http(),
    },
})

const privyConfig = {
    loginMethods: ['wallet'],
    appearance: {
        theme: 'light',
        accentColor: '#676FFF',
        logo: 'https://app.superlend.xyz/images/logos/superlend-logo.webp',
        landingHeader: 'Connect Wallet',
        loginMessage: 'Select wallet to continue',
        showWalletLoginFirst: true,
        walletConnect: {
            projectId: REOWN_PROJECT_ID,
        },
        walletList: [
            'detected_ethereum_wallets',
            'metamask',
            'coinbase_wallet',
            'okx_wallet',
            'rainbow',
            'rabby_wallet',
            'wallet_connect',
        ],
    },
    supportedChains: [
        mainnet,
        polygon,
        base,
        scroll,
        avalanche,
        optimism,
        bsc,
        gnosis,
        arbitrum,
        etherlink,
        metis,
        linea,
        sonic,
    ],
}

function ContextProvider({ children }: { children: ReactNode }) {
    return (
        <AnalyticsProvider>
            <PrivyProvider
                appId={appId}
                config={privyConfig as PrivyClientConfig}
            >
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={config}>
                        <AssetsDataProvider>
                            <UserTokenBalancesProvider>
                                <ShowAllMarketsProvider>
                                    <AuthProvider>
                                        {children}
                                    </AuthProvider>
                                </ShowAllMarketsProvider>
                            </UserTokenBalancesProvider>
                        </AssetsDataProvider>
                    </WagmiProvider>
                </QueryClientProvider>
            </PrivyProvider>
        </AnalyticsProvider>
    )
}

export default ContextProvider
