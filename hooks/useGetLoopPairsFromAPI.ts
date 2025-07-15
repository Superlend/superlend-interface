import { useMemo, useContext } from 'react'
import useGetLoopOpportunitiesData from '@/hooks/useGetLoopOpportunitiesData'
import { transformLoopOpportunities } from '@/utils/transformLoopOpportunities'
import { TLoopPair } from '@/utils/createLoopPairs'
import { AssetsDataContext } from '@/context/data-provider'

export function useGetLoopPairsFromAPI(waitForAllData: boolean = false) {
    const { allChainsData } = useContext<any>(AssetsDataContext)
    
    const { 
        data: loopOpportunities, 
        isLoading: isLoadingLoopOpportunities,
        isError,
        refetch,
        lastFetchTime,
        shouldAutoRefresh,
        isRefreshing
    } = useGetLoopOpportunitiesData({})

    const pairs = useMemo(() => {
        if (!loopOpportunities?.length || !allChainsData?.length) {
            return []
        }

        const transformedPairs = transformLoopOpportunities(loopOpportunities, allChainsData)
        
        // Sort by Max APY (descending)
        return transformedPairs.sort((a, b) => {
            const aMaxAPY = a.strategy?.max_apy.current || 0
            const bMaxAPY = b.strategy?.max_apy.current || 0
            return bMaxAPY - aMaxAPY
        })
    }, [loopOpportunities, allChainsData, waitForAllData])

    return {
        pairs,
        isLoading: isLoadingLoopOpportunities,
        isError,
        refetch,
        lastFetchTime,
        shouldAutoRefresh,
        isRefreshing
    }
} 