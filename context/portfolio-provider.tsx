'use client'

import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPortfolio } from '@/types/queries/portfolio'
import { createContext, useContext, useEffect } from 'react'
import { useActiveAccount } from 'thirdweb/react'
// import { useERC20Balance } from '../hooks/useERC20Balance'

export type TPortfolioContext = {
    portfolioData: TPortfolio
    isLoadingPortfolioData: boolean
    isErrorPortfolioData: boolean
    // erc20TokensBalanceData: Record<
    //     number,
    //     Record<string, { balanceRaw: string; balanceFormatted: number }>
    // >
}

const PortfolioDataInit = {
    platforms: [],
    total_borrowed: 0,
    total_supplied: 0,
}

export const PortfolioContext = createContext<TPortfolioContext>({
    portfolioData: PortfolioDataInit,
    isLoadingPortfolioData: false,
    isErrorPortfolioData: false,
    // erc20TokensBalanceData: {},
})

export default function PortfolioProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address

    // get portfolio data for subset of chains (4 chains)
    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
    })

    // const { data: erc20TokensBalanceData } = useERC20Balance(
    //     walletAddress as `0x${string}`
    // )

    // useEffect(() => {
    //   if (walletAddress) getERC20Balance(walletAddress);
    // }, [walletAddress]);

    // useEffect(() => {
    //   console.log(erc20TokensBalanceData);
    // }, [erc20TokensBalanceData, walletAddress]);

    return (
        <PortfolioContext.Provider
            value={{
                portfolioData,
                isLoadingPortfolioData,
                isErrorPortfolioData,
                // erc20TokensBalanceData,
            }}
        >
            {children}
        </PortfolioContext.Provider>
    )
}

export const usePortfolioData = () => {
    const context = useContext(PortfolioContext)
    if (!context)
        throw new Error(
            'usePortfolioData must be used within an PortfolioProvider'
        )
    return context
}
