'use client'

import { config } from '@/config'
import React, { type ReactNode } from 'react'
import { queryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import AssetsDataProvider from './data-provider'
import { ThirdwebProvider } from 'thirdweb/react'
import { WagmiProvider } from 'wagmi'
import { Config, cookieToInitialState } from 'wagmi'
import UserTokenBalancesProvider from './user-token-balances-provider'

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    const initialState = cookieToInitialState(config as Config, cookies)

    return (
        <ThirdwebProvider>
            <WagmiProvider config={config} initialState={initialState}>
                <QueryClientProvider client={queryClient}>
                    <AssetsDataProvider>
                        <UserTokenBalancesProvider>
                            {children}
                        </UserTokenBalancesProvider>
                    </AssetsDataProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </ThirdwebProvider>
    )
}

export default ContextProvider
