import { useMemo, useContext, useState, useEffect, useRef } from 'react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { createLoopPairs, TLoopPair } from '@/utils/createLoopPairs'
import { LOOPING_CONSTANTS } from '@/constants/looping'
import { AssetsDataContext } from '@/context/data-provider'
import { useAaveV3Data } from '@/hooks/protocols/useAaveV3Data'
import { ChainId } from '@/types/chain'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'

export function useGetLoopPairs(waitForAllData: boolean = false) {
    const { allChainsData } = useContext<any>(AssetsDataContext)
    
    // Make Apple Farm rewards optional to handle cases where provider is not available
    let appleFarmRewardsAprs: Record<string, number | undefined> | undefined
    try {
        const appleFarmContext = useAppleFarmRewards()
        // appleFarmRewardsAprs = appleFarmContext.appleFarmRewardsAprs
    } catch (error) {
        // Provider not available, use undefined
        appleFarmRewardsAprs = undefined
    }
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

    // Check if we have Apple Farm rewards context available
    let isLoadingAppleFarmRewards = false
    try {
        const appleFarmContext = useAppleFarmRewards()
        // isLoadingAppleFarmRewards = appleFarmContext.isLoading
    } catch (error) {
        // Provider not available, assume loaded
        isLoadingAppleFarmRewards = false
    }

    // Create pairs using utility function
    const pairs = useMemo(() => {
        if (!lendOpportunities?.length || !platformData) {
            return []
        }

        if (waitForAllData) {
            // Wait for all data mode - don't create pairs until everything is loaded
            // Max leverage data is essential for loop calculations
            if (!maxLeverageData) {
                return []
            }

            // Wait for Apple Farm rewards to load if the context is available
            if (isLoadingAppleFarmRewards) {
                return []
            }
        }

        // Filter lend opportunities for Etherlink chain only
        const etherlinkLendOpportunities = lendOpportunities.filter(
            opportunity => opportunity.chain_id === LOOPING_CONSTANTS.CHAIN_ID
        )

        return createLoopPairs(
            etherlinkLendOpportunities, 
            platformData, 
            allChainsData, 
            waitForAllData ? maxLeverageData : maxLeverageData || undefined, 
            waitForAllData ? appleFarmRewardsAprs : appleFarmRewardsAprs || undefined
        )
    }, [lendOpportunities, platformData, allChainsData, maxLeverageData, appleFarmRewardsAprs, isLoadingAppleFarmRewards, waitForAllData])

    return {
        pairs,
        isLoading: waitForAllData 
            ? (isLoadingOpportunities || isLoadingPlatformData || !maxLeverageData || isLoadingAppleFarmRewards)
            : (isLoadingOpportunities || isLoadingPlatformData),
        isError: false // TODO: Add proper error handling
    }
} 