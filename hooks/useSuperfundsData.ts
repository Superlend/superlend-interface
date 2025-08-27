'use client'

import { useQuery } from '@tanstack/react-query'
import { createPublicClient, formatUnits, http, parseAbi } from 'viem'
import { base } from 'viem/chains'
import { SUPERFUND_USDC_VAULT_ADDRESS, USDC_DECIMALS } from '@/constants'
import { convertAPRtoAPY } from '@/lib/utils'

const BASE_CLIENT = createPublicClient({
    chain: base,
    transport: http('/api/rpc/base'),
    batch: { multicall: true },
})

const VAULT_ABI = parseAbi([
    'function totalAssets() view returns (uint256)',
    'function getEulerEarnSavingRate() view returns (uint40, uint40, uint168)',
])

interface SuperfundsData {
    totalAssets: bigint
    eulerEarnSavingRate: {
        timeEnd: number
        timeStart: number
        rewards: bigint
    }
    spotAPY: number
}

export const useSuperfundsData = () => {
    const { data, isLoading, isError, error } = useQuery<SuperfundsData>({
        queryKey: ['superfunds-data', SUPERFUND_USDC_VAULT_ADDRESS],
        queryFn: async (): Promise<SuperfundsData> => {
            try {
                const [assets, eulerEarnSavingRate] = await Promise.all([
                    BASE_CLIENT.readContract({
                        address: SUPERFUND_USDC_VAULT_ADDRESS as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: 'totalAssets',
                    }),
                    BASE_CLIENT.readContract({
                        address: SUPERFUND_USDC_VAULT_ADDRESS as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: 'getEulerEarnSavingRate',
                    }),
                ])

                const [timeEnd, timeStart, rewards] = eulerEarnSavingRate
                
                // Calculate spot APY
                const rate = (((parseFloat(formatUnits(rewards, USDC_DECIMALS)) /
                    (timeStart - timeEnd)) *
                    (365 * 24 * 60 * 60)) /
                    parseFloat(formatUnits(assets, USDC_DECIMALS))) *
                    100

                const spotAPY = convertAPRtoAPY(rate / 100)

                return {
                    totalAssets: assets,
                    eulerEarnSavingRate: {
                        timeEnd: Number(timeEnd),
                        timeStart: Number(timeStart),
                        rewards
                    },
                    spotAPY
                }
            } catch (error) {
                console.error('Error fetching Superfunds data:', error)
                throw error
            }
        },
        staleTime: 4 * 60 * 1000, // 4 minutes - consider data stale after 4 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
        refetchInterval: 5 * 60 * 1000, // 5 minutes - refetch every 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnMount: true, // Refetch when component mounts
        refetchOnReconnect: true, // Refetch when network reconnects
        retry: 2, // Retry failed requests up to 2 times
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    })

    return {
        data,
        isLoading,
        isError,
        error,
        // Convenience getters for individual values
        totalAssets: data?.totalAssets,
        eulerEarnSavingRate: data?.eulerEarnSavingRate,
        spotAPY: data?.spotAPY,
    }
}

export default useSuperfundsData
