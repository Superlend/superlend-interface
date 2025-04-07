'use client'

import { getPortfolioData } from '@/queries/portfolio-api'
import { TPortfolio } from '@/types/queries/portfolio'
import { createContext, useContext, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useWalletConnection } from '@/hooks/useWalletConnection'

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
    const { walletAddress } = useWalletConnection()
    
    // Define chain IDs to query in parallel
    const chainIds = ['1', '137', '10', '42161', '8453', '56', '43114', '534352', '1088', '100']
    
    // Use useQueries for parallel data fetching across multiple chains
    const chainQueries = useQueries({
        queries: chainIds.map((chainId) => ({
            queryKey: ['portfolio', chainId, walletAddress],
            queryFn: async () => getPortfolioData({
                user_address: walletAddress as `0x${string}` | undefined,
                chain_id: [chainId]
            }),
            enabled: !!walletAddress,
            staleTime: 60000,
        })),
    })
    
    // Combine results from all completed queries, allowing partial data display
    const portfolioData = useMemo(() => {
        // Get data from all successful queries, even if some are still loading
        const completedQueries = chainQueries.filter(query => !query.isLoading && !query.isError && query.data)
        
        // If we have no completed queries yet, return initial state
        if (completedQueries.length === 0) {
            return PortfolioDataInit
        }
        
        // Combine data from all completed queries
        const allPlatforms = completedQueries
            .flatMap(query => query.data?.platforms || [])
            
        const totalBorrowed = completedQueries
            .reduce((sum, query) => sum + (query.data?.total_borrowed || 0), 0)
            
        const totalSupplied = completedQueries
            .reduce((sum, query) => sum + (query.data?.total_supplied || 0), 0)
            
        return {
            platforms: allPlatforms,
            total_borrowed: totalBorrowed,
            total_supplied: totalSupplied
        }
    }, [chainQueries])
    
    // Consider loading only if ALL queries are loading OR we have no completed queries yet
    const isLoadingPortfolioData = chainQueries.every(query => query.isLoading) || 
                                  chainQueries.filter(query => !query.isLoading && !query.isError).length === 0
                                  
    const isErrorPortfolioData = chainQueries.every(query => query.isError)

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
