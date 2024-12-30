'use client'

import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPortfolio } from '@/types/queries/portfolio'
import { createContext, useContext, useEffect } from 'react'
// import { useActiveAccount } from 'thirdweb/react'
import { useAccount } from 'wagmi'

export type TPortfolioContext = {
    portfolioData: TPortfolio
    isLoadingPortfolioData: boolean
    isErrorPortfolioData: boolean
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
})

export default function PortfolioProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const { address: walletAddress } = useAccount()

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
    })

    return (
        <PortfolioContext.Provider
            value={{
                portfolioData,
                isLoadingPortfolioData,
                isErrorPortfolioData,
            }}
        >
            {children}
        </PortfolioContext.Provider>
    )
}

export const usePortfolioDataContext = () => {
    const context = useContext(PortfolioContext)
    if (!context)
        throw new Error(
            'usePortfolioDataContext must be used within an PortfolioProvider'
        )
    return context
}
