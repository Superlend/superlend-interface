import { useMemo, useContext, useState, useEffect, useRef } from 'react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { createLoopPairs, TLoopPair } from '@/utils/createLoopPairs'
import { LOOPING_CONSTANTS } from '@/constants/looping'
import { AssetsDataContext } from '@/context/data-provider'
import { useAaveV3Data } from '@/hooks/protocols/useAaveV3Data'
import { ChainId } from '@/types/chain'

export function useGetLoopPairs() {
    const { allChainsData } = useContext<any>(AssetsDataContext)
    const [maxLeverageData, setMaxLeverageData] = useState<Record<string, Record<string, number>> | undefined>(undefined)
    const { getMaxLeverage, providerStatus, uiPoolDataProviderAddress, lendingPoolAddressProvider } = useAaveV3Data()
    const hasFetchedMaxLeverage = useRef(false)
    
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

    // Fetch max leverage data when provider is ready and we have platform data
    useEffect(() => {
        if (providerStatus.isReady && platformData?.assets && !hasFetchedMaxLeverage.current) {
            hasFetchedMaxLeverage.current = true
            
            getMaxLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                lendingPoolAddressProvider: lendingPoolAddressProvider,
            }).then((results) => {
                if (results) {
                    setMaxLeverageData(results)
                }
            }).catch((error) => {
                console.error('Error fetching max leverage data:', error)
                hasFetchedMaxLeverage.current = false // Reset on error to allow retry
            })
        }
    }, [providerStatus.isReady, !!platformData?.assets])

    // Create pairs using utility function
    const pairs = useMemo(() => {
        if (!lendOpportunities?.length || !platformData) {
            return []
        }

        // Filter lend opportunities for Etherlink chain only
        const etherlinkLendOpportunities = lendOpportunities.filter(
            opportunity => opportunity.chain_id === LOOPING_CONSTANTS.CHAIN_ID
        )

        return createLoopPairs(etherlinkLendOpportunities, platformData, allChainsData, maxLeverageData)
    }, [lendOpportunities, platformData, allChainsData, maxLeverageData])

    return {
        pairs,
        isLoading: isLoadingOpportunities || isLoadingPlatformData,
        isError: false // TODO: Add proper error handling
    }
} 