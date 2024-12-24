'use client'

import { config } from '@/config'
import React, { type ReactNode } from 'react'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
// import { ThirdwebProvider } from 'thirdweb/react'
import { WagmiProvider } from 'wagmi'
import { Config, cookieToInitialState } from 'wagmi'
import UserTokenBalancesProvider from './user-token-balances-provider'
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    // const initialState = cookieToInitialState(config as Config, cookies)

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <AssetsDataProvider>
                    <UserTokenBalancesProvider>
                        <ConnectKitProvider theme="soft">{children}</ConnectKitProvider>
                    </UserTokenBalancesProvider>
                </AssetsDataProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
