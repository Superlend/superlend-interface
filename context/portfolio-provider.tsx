'use client'

import { getPortfolioData } from '@/queries/portfolio-api'
import { TPortfolio } from '@/types/queries/portfolio'
import { createContext, useContext, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { arbitrum, mainnet, polygon, avalanche, base, bsc, etherlink, gnosis, linea, metis, optimism, sonic, scroll } from 'viem/chains'

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

    // Chain IDs to query in parallel
    const chainIds = [
        mainnet.id,
        polygon.id,
        base.id,
        scroll.id,
        avalanche.id,
        optimism.id,
        bsc.id,
        gnosis.id,
        arbitrum.id,
        etherlink.id,
        metis.id,
        linea.id,
        sonic.id,
    ]

    // Group chain IDs into batches to reduce API calls (minimum 3 groups)
    const chainIdGroups = useMemo(() => {
        const totalGroups = 3
        const result = Array.from({ length: totalGroups }, () => [] as number[])
        
        chainIds.forEach((chainId, index) => {
            const groupIndex = index % totalGroups
            result[groupIndex].push(chainId)
        })
        
        return result
    }, [])

    // Use useQueries for parallel data fetching across grouped chains
    const chainQueries = useQueries({
        queries: chainIdGroups.map((chainIdGroup) => ({
            queryKey: ['portfolio-group', chainIdGroup, walletAddress],
            queryFn: async () => getPortfolioData({
                user_address: walletAddress as `0x${string}` | undefined,
                chain_id: chainIdGroup.map(id => id.toString())
            }),
            enabled: !!walletAddress && chainIdGroup.length > 0,
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
