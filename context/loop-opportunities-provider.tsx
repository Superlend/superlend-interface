'use client'

import { TLoopOpportunityResponse } from '@/types'
import { createContext, useContext, ReactNode } from 'react'
import useGetLoopOpportunitiesData from '@/hooks/useGetLoopOpportunitiesData'

interface LoopOpportunitiesContextValue {
    loopOpportunities: TLoopOpportunityResponse[]
    isLoading: boolean
    isError: boolean
    refetch: () => void
    lastFetchTime: number | null
    shouldAutoRefresh: boolean
    isRefreshing: boolean
    findLoopOpportunity: (lendTokenAddress: string, borrowTokenAddress: string, protocolIdentifier?: string) => TLoopOpportunityResponse | null
}

const LoopOpportunitiesContext = createContext<LoopOpportunitiesContextValue | null>(null)

export function LoopOpportunitiesProvider({ children }: { children: ReactNode }) {
    const { 
        data: loopOpportunities, 
        isLoading, 
        isError, 
        refetch, 
        lastFetchTime, 
        shouldAutoRefresh, 
        isRefreshing 
    } = useGetLoopOpportunitiesData({})

    const findLoopOpportunity = (
        lendTokenAddress: string, 
        borrowTokenAddress: string, 
        protocolIdentifier?: string
    ): TLoopOpportunityResponse | null => {
        if (!loopOpportunities?.length) return null
        
        return loopOpportunities.find(opportunity => 
            opportunity.lendReserve.token.address.toLowerCase() === lendTokenAddress.toLowerCase() &&
            opportunity.borrowReserve.token.address.toLowerCase() === borrowTokenAddress.toLowerCase() &&
            (!protocolIdentifier || opportunity.platform.protocol_identifier === protocolIdentifier)
        ) || null
    }

    const value: LoopOpportunitiesContextValue = {
        loopOpportunities: loopOpportunities || [],
        isLoading,
        isError,
        refetch,
        lastFetchTime,
        shouldAutoRefresh,
        isRefreshing,
        findLoopOpportunity
    }

    return (
        <LoopOpportunitiesContext.Provider value={value}>
            {children}
        </LoopOpportunitiesContext.Provider>
    )
}

export function useLoopOpportunities() {
    const context = useContext(LoopOpportunitiesContext)
    if (!context) {
        throw new Error('useLoopOpportunities must be used within a LoopOpportunitiesProvider')
    }
    return context
} 