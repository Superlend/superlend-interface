'use client'

import { getLoopOpportunitiesData } from '@/queries/opportunities-api'
import { TGetLoopOpportunitiesParams, TLoopOpportunityResponse } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'

interface CachedLoopOpportunitiesData {
    data: TLoopOpportunityResponse[]
    timestamp: number
}

export default function useGetLoopOpportunitiesData(
    params: TGetLoopOpportunitiesParams
) {
    const [cachedData, setCachedData] = useState<TLoopOpportunityResponse[]>([])
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
    const [manualRefreshRequested, setManualRefreshRequested] = useState(false)
    const [isManualRefreshing, setIsManualRefreshing] = useState(false)
    const hasInitializedRef = useRef(false)
    const currentCacheKeyRef = useRef<string>('')
    
    const cacheKey = `loop_opportunities_${params.chain_ids || 'all'}_${params.tokens || 'all'}`
    
    const shouldAutoRefresh = useCallback(() => {
        if (!lastFetchTime) return true
        return Date.now() - lastFetchTime > 600000
    }, [lastFetchTime])

    const hasFreshCache = useCallback(() => {
        if (!lastFetchTime) return false
        return Date.now() - lastFetchTime <= 600000
    }, [lastFetchTime])

    useEffect(() => {
        if (currentCacheKeyRef.current && currentCacheKeyRef.current !== cacheKey) {
            setCachedData([])
            setLastFetchTime(null)
            setManualRefreshRequested(false)
            setIsManualRefreshing(false)
            hasInitializedRef.current = false
        }
        currentCacheKeyRef.current = cacheKey
    }, [cacheKey])

    useEffect(() => {
        if (typeof window !== 'undefined' && !hasInitializedRef.current) {
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
                try {
                    const parsedCache: CachedLoopOpportunitiesData = JSON.parse(cached)
                    setCachedData(parsedCache.data)
                    setLastFetchTime(parsedCache.timestamp)
                    
                    const isStale = Date.now() - parsedCache.timestamp > 600000
                    if (isStale && parsedCache.data.length > 0) {
                        setTimeout(() => {
                            setManualRefreshRequested(true)
                        }, 500)
                    }
                } catch (error) {
                    console.error('Error parsing cached loop opportunities data:', error)
                    localStorage.removeItem(cacheKey)
                }
            }
            hasInitializedRef.current = true
        }
    }, [cacheKey])

    const { data, isLoading, isError, refetch } = useQuery<
        TLoopOpportunityResponse[],
        Error
    >({
        queryKey: [
            'loop_opportunities',
            params.chain_ids,
            params.tokens,
            params.limit,
            params.trend,
        ],
        queryFn: async () => {
            try {
                const startTime = performance.now()
                const responseData = await getLoopOpportunitiesData(params)
                const endTime = performance.now()
                
                console.log(`🚀 LOOP OPPORTUNITIES API RESPONSE 🚀
┌─────────────────────────────────────────────────────────────┐
│ Processing Time: ${(endTime - startTime).toFixed(2)}ms
│ Response Length: ${responseData.length} loop strategies
│ Chain IDs: ${params.chain_ids?.length ? params.chain_ids.join(', ') : 'All'}
│ Tokens Filter: ${params.tokens?.length ? params.tokens.join(', ') : 'All'}
│ Timestamp: ${new Date().toISOString()}
└─────────────────────────────────────────────────────────────┘`, responseData)
                
                if (typeof window !== 'undefined') {
                    const cacheData: CachedLoopOpportunitiesData = {
                        data: responseData,
                        timestamp: Date.now()
                    }
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
                    setLastFetchTime(Date.now())
                    setCachedData(responseData)
                    setManualRefreshRequested(false)
                    setIsManualRefreshing(false)
                }
                
                return responseData
            } catch (error) {
                setManualRefreshRequested(false)
                setIsManualRefreshing(false)
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
        enabled: params.enabled !== false && (
            cachedData.length === 0 || 
            manualRefreshRequested || 
            (hasInitializedRef.current && shouldAutoRefresh())
        ),
    })

    useEffect(() => {
        if (hasInitializedRef.current && shouldAutoRefresh() && cachedData.length > 0 && !manualRefreshRequested) {
            const timer = setTimeout(() => {
                refetch()
            }, 1000)
            
            return () => clearTimeout(timer)
        }
    }, [shouldAutoRefresh, cachedData.length, manualRefreshRequested, refetch])

    const manualRefresh = useCallback(() => {
        setManualRefreshRequested(true)
        setIsManualRefreshing(true)
        refetch()
    }, [refetch])

    const dataToReturn = hasFreshCache() && cachedData.length > 0 ? cachedData : (data || cachedData || [])

    return { 
        data: dataToReturn, 
        isLoading: isLoading && cachedData.length === 0,
        isError, 
        refetch: manualRefresh,
        lastFetchTime,
        shouldAutoRefresh: shouldAutoRefresh(),
        isRefreshing: isManualRefreshing || (isLoading && cachedData.length > 0)
    }
} 