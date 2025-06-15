import { useMemo, useContext } from 'react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { createLoopPairs, TLoopPair } from '@/utils/createLoopPairs'
import { LOOPING_CONSTANTS } from '@/constants/looping'
import { AssetsDataContext } from '@/context/data-provider'

export function useGetLoopPairs() {
    const { allChainsData } = useContext<any>(AssetsDataContext)
    // Reuse cached lend data from existing hook
    const { 
        data: lendOpportunities, 
        isLoading: isLoadingOpportunities 
    } = useGetOpportunitiesData({
        type: 'lend'
    })

    // Single platform call with constant protocol identifier
    const { 
        data: platformData, 
        isLoading: isLoadingPlatformData 
    } = useGetPlatformData({
        protocol_identifier: LOOPING_CONSTANTS.PROTOCOL_IDENTIFIER,
        chain_id: LOOPING_CONSTANTS.CHAIN_ID
    })

    // Create pairs using utility function
    const pairs = useMemo(() => {
        if (!lendOpportunities?.length || !platformData) {
            return []
        }

        // Filter lend opportunities for Etherlink chain only
        const etherlinkLendOpportunities = lendOpportunities.filter(
            opportunity => opportunity.chain_id === LOOPING_CONSTANTS.CHAIN_ID
        )

        return createLoopPairs(etherlinkLendOpportunities, platformData, allChainsData)
    }, [lendOpportunities, platformData, allChainsData])

    return {
        pairs,
        isLoading: isLoadingOpportunities || isLoadingPlatformData,
        isError: false // TODO: Add proper error handling
    }
} 