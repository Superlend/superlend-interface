'use client'

import { getOpportunitiesData } from '@/queries/opportunities-api'
import { TGetOpportunitiesParams, TOpportunity } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import useGetMidasKpiData from './useGetMidasKpiData'
import useGetIntrinsicApyData from './useGetIntrinsicApyData'
import { ChainId } from '@/types/chain'

interface CachedOpportunitiesData {
    data: TOpportunity[]
    timestamp: number
}

export default function useGetOpportunitiesData(
    params: TGetOpportunitiesParams
) {
    const [cachedData, setCachedData] = useState<TOpportunity[]>([])
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
    const [manualRefreshRequested, setManualRefreshRequested] = useState(false)
    const [isManualRefreshing, setIsManualRefreshing] = useState(false)
    const hasInitializedRef = useRef(false)
    const currentCacheKeyRef = useRef<string>('')
    
    // Fetch Midas KPI data for lend and loop requests
    const { mBasisAPY, mTbillAPY, mMevAPY } = useGetMidasKpiData()
    
    // Fetch intrinsic APY data including LBTC APY
    const { lbtcApyEstimated } = useGetIntrinsicApyData()
    
    // Convert 'loop' type to 'lend' for API compatibility
    const apiParams = {
        ...params,
        type: params.type === 'loop' ? 'lend' : params.type
    }

    // Create a cache key based on params
    const cacheKey = `opportunities_${params.type}_${params.chain_ids || 'all'}_${params.tokens || 'all'}`
    
    // Function to update intrinsic token APYs including Midas and LBTC, and adjust APY for chain_id 42793
    const updateIntrinsicTokenAPYs = useCallback((opportunities: TOpportunity[]) => {
        if ((params.type !== 'lend' && params.type !== 'loop') || (!mBasisAPY && !mTbillAPY && !lbtcApyEstimated)) {
            return opportunities
        }

        return opportunities.map(opportunity => {
            const tokenSymbol = opportunity.token.symbol.toUpperCase()
            
            // Handle LBTC intrinsic APY addition - only for LBTC on Etherlink chain with Superlend platform
            if (tokenSymbol === 'LBTC' &&
                lbtcApyEstimated !== null && 
                opportunity.chain_id === ChainId.Etherlink) {
                
                const currentAPY = parseFloat(opportunity.platform.apy.current) || 0
                const adjustedAPY = currentAPY + lbtcApyEstimated
                
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: adjustedAPY.toString()
                        }
                    }
                }
            }
            if (tokenSymbol === 'MMEV' && mMevAPY !== null) {
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: mMevAPY.toString()
                        }
                    }
                }
            }
            if (tokenSymbol === 'MBASIS' && mBasisAPY !== null) {
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: mBasisAPY.toString()
                        }
                    }
                }
            }
            if (tokenSymbol === 'MTBILL' && mTbillAPY !== null) {
                // console.log('MTBILL APY', mTbillAPY)
                // console.log('MTBILL opportunity', opportunity)
                const totalRewardsAPY = opportunity.platform.rewards.reduce((sum, reward) => {
                    return sum + (reward.supply_apy || 0)
                }, 0)
                
                const currentAPY = parseFloat(opportunity.platform.apy.current) || 0
                const adjustedAPY = Math.max(0, currentAPY - totalRewardsAPY + mTbillAPY)
                // console.log('MTBILL adjustedAPY', {adjustedAPY,currentAPY,totalRewardsAPY,opportunity})
                
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: adjustedAPY.toString()
                        }
                    }
                }
            }
            if (tokenSymbol.toUpperCase() === 'STXTZ') {
                // console.log('STXTZ APY', mTbillAPY)
                // console.log('STXTZ opportunity', opportunity)
                const totalRewardsAPY = opportunity.platform.rewards.reduce((sum, reward) => {
                    return sum + (reward.supply_apy || 0)
                }, 0)
                
                const currentAPY = parseFloat(opportunity.platform.apy.current) || 0
                const adjustedAPY = Math.max(0, currentAPY - totalRewardsAPY)
                // console.log('STXTZ adjustedAPY', {adjustedAPY,currentAPY,totalRewardsAPY,opportunity})
                
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: currentAPY.toString()
                        }
                    }
                }
            }

            // Adjust APY for chain_id 42793 by subtracting sum of supply_apy from rewards
            if (opportunity.chain_id === ChainId.Etherlink && opportunity.platform.rewards && opportunity.platform.rewards.length > 0) {
                const totalRewardsAPY = opportunity.platform.rewards.reduce((sum, reward) => {
                    return sum + (reward.supply_apy || 0)
                }, 0)
                
                const currentAPY = parseFloat(opportunity.platform.apy.current) || 0
                const adjustedAPY = Math.max(0, currentAPY - totalRewardsAPY)
                // console.log('adjustedAPY', {adjustedAPY,currentAPY,totalRewardsAPY,opportunity})
                return {
                    ...opportunity,
                    platform: {
                        ...opportunity.platform,
                        apy: {
                            ...opportunity.platform.apy,
                            current: adjustedAPY.toString()
                        }
                    }
                }
            }
            
            // console.log('opportunity data response', opportunity)
            return opportunity

        })
    }, [params.type, mBasisAPY, mTbillAPY, lbtcApyEstimated])
    
    // Check if data should be refreshed (10 minutes = 600000ms)
    const shouldAutoRefresh = useCallback(() => {
        if (!lastFetchTime) return true
        return Date.now() - lastFetchTime > 600000 // 10 minutes
    }, [lastFetchTime])

    // Check if we have fresh cached data (less than 10 minutes old)
    const hasFreshCache = useCallback(() => {
        if (!lastFetchTime) return false
        return Date.now() - lastFetchTime <= 600000 // 10 minutes
    }, [lastFetchTime])

    // Reset state when cache key changes (tab switch)
    useEffect(() => {
        if (currentCacheKeyRef.current && currentCacheKeyRef.current !== cacheKey) {
            // Cache key changed, reset state for new tab
            setCachedData([])
            setLastFetchTime(null)
            setManualRefreshRequested(false)
            setIsManualRefreshing(false)
            hasInitializedRef.current = false
        }
        currentCacheKeyRef.current = cacheKey
    }, [cacheKey])

    // Load cached data when cache key changes or on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && !hasInitializedRef.current) {
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
                try {
                    const parsedCache: CachedOpportunitiesData = JSON.parse(cached)
                    const updatedData = updateIntrinsicTokenAPYs(parsedCache.data)
                    setCachedData(updatedData)
                    setLastFetchTime(parsedCache.timestamp)
                    
                    // Check if we should auto-refresh after tab switch
                    const isStale = Date.now() - parsedCache.timestamp > 600000 // 10 minutes
                    if (isStale && parsedCache.data.length > 0) {
                        // Auto-refresh stale data after tab switch
                        setTimeout(() => {
                            setManualRefreshRequested(true)
                        }, 500) // Small delay to let UI settle
                    }
                } catch (error) {
                    console.error('Error parsing cached opportunities data:', error)
                    localStorage.removeItem(cacheKey)
                }
            }
            hasInitializedRef.current = true
        }
    }, [cacheKey, updateIntrinsicTokenAPYs])

    const { data, isLoading, isError, refetch } = useQuery<
        TOpportunity[],
        Error
    >({
        queryKey: [
            'opportunities',
            params.type,
            params.chain_ids,
            params.tokens,
            params.limit,
            params.trend,
        ],
        queryFn: async () => {
            try {
                const startTime = performance.now()
                const responseData = await getOpportunitiesData(apiParams)
                const endTime = performance.now()
                
                console.log(`🚀 OPPORTUNITIES API RESPONSE 🚀
┌─────────────────────────────────────────────────────────────┐
│ Type: ${params.type.toUpperCase()}
│ Processing Time: ${(endTime - startTime).toFixed(2)}ms
│ Response Length: ${responseData.length} opportunities
│ Chain IDs: ${params.chain_ids?.length ? params.chain_ids.join(', ') : 'All'}
│ Tokens Filter: ${params.tokens?.length ? params.tokens.join(', ') : 'All'}
│ Timestamp: ${new Date().toISOString()}
└─────────────────────────────────────────────────────────────┘`, responseData)
                
                // Filter out tokens whose name starts with "Hanji " for lend/loop calls
                let filteredData = responseData
                if (params.type === 'lend' || params.type === 'loop') {
                    filteredData = responseData.filter(opportunity => 
                        !opportunity.token.name.startsWith('Hanji ')
                    )
                }
                
                // Update Midas token APYs
                const updatedData = updateIntrinsicTokenAPYs(filteredData)
                
                // Cache the updated data with timestamp
                if (typeof window !== 'undefined') {
                    const cacheData: CachedOpportunitiesData = {
                        data: updatedData,
                        timestamp: Date.now()
                    }
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
                    setLastFetchTime(Date.now())
                    setCachedData(updatedData)
                    setManualRefreshRequested(false)
                    setIsManualRefreshing(false)
                }
                
                return updatedData
            } catch (error) {
                setManualRefreshRequested(false)
                setIsManualRefreshing(false)
                // If fetch fails and we have cached data, use cached data
                if (cachedData.length > 0) {
                    return cachedData
                }
                return []
            }
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        // Only enable query if:
        // 1. No cached data exists, OR
        // 2. Manual refresh was requested, OR  
        // 3. Data is older than 10 minutes AND we've initialized
        enabled: params.enabled !== false && (
            cachedData.length === 0 || 
            manualRefreshRequested || 
            (hasInitializedRef.current && shouldAutoRefresh())
        ),
    })

    // Background auto-refresh effect - only runs after component is initialized
    useEffect(() => {
        if (hasInitializedRef.current && shouldAutoRefresh() && cachedData.length > 0 && !manualRefreshRequested) {
            // Do background refresh without affecting UI
            const timer = setTimeout(() => {
                refetch()
            }, 1000) // Small delay to avoid immediate refresh on tab switch
            
            return () => clearTimeout(timer)
        }
    }, [shouldAutoRefresh, cachedData.length, manualRefreshRequested, refetch])

    const manualRefresh = useCallback(() => {
        setManualRefreshRequested(true)
        setIsManualRefreshing(true)
        refetch()
    }, [refetch])

    // Return cached data if available and we have fresh cache, otherwise return fresh data
    // Always apply Midas APY updates to the returned data
    
    // TEMPORARILY DISABLED FOR TESTING: Cached data usage commented out
    // const baseData = hasFreshCache() && cachedData.length > 0 ? cachedData : (data || cachedData || [])
    const baseData = data || [] // Force fresh data only, ignore cached data
    const dataToReturn = updateIntrinsicTokenAPYs(baseData)

    return { 
        data: dataToReturn, 
        // TEMPORARILY DISABLED FOR TESTING: Cached data consideration in loading state commented out
        // isLoading: isLoading && cachedData.length === 0, // Only show loading if no cached data
        isLoading: isLoading, // Force normal loading state, ignore cached data
        isError, 
        refetch: manualRefresh,
        lastFetchTime,
        shouldAutoRefresh: shouldAutoRefresh(),
        // TEMPORARILY DISABLED FOR TESTING: Cached data consideration in refreshing state commented out
        // isRefreshing: isManualRefreshing || (isLoading && cachedData.length > 0)
        isRefreshing: isManualRefreshing || isLoading // Force normal refreshing state, ignore cached data
    }
}
