'use client'

import { useERC20Balance } from '@/hooks/useERC20Balance'
import useGetChainsData from '@/hooks/useGetChainsData'
import useGetTokensData from '@/hooks/useGetTokensData'
import { TChain } from '@/types/chain'
import { createContext, useContext, useEffect, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'

type TAssetsDataProps = {
    allTokensData: any
    allChainsData: TChain[]
    erc20TokensBalanceData: any
}

export const AssetsDataContext = createContext<TAssetsDataProps>({
    allTokensData: [],
    allChainsData: [],
    erc20TokensBalanceData: {},
})

export default function AssetsDataProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address
    const { data: allTokensData } = useGetTokensData()
    const { data: allChainsData } = useGetChainsData()

    const { data: erc20TokensBalanceData } = useERC20Balance(
        walletAddress as `0x${string}`
    )

    return (
        <AssetsDataContext.Provider
            value={{
                allChainsData,
                allTokensData,
                erc20TokensBalanceData,
            }}
        >
            {children}
        </AssetsDataContext.Provider>
    )
}

export const useAssetsDataContext = () => {
    const context = useContext(AssetsDataContext)
    if (!context)
        throw new Error(
            'useAssetsDataContext must be used within an AssetsDataProvider'
        )
    return context
}
