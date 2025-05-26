'use client'

import { getBoostRewards, BoostRewardParams } from '@/queries/get-boost-rewards-api'
import { useQuery } from '@tanstack/react-query'

export default function useGetBoostRewards(params: BoostRewardParams) {
    return useQuery({
        queryKey: ['boost-rewards', params],
        queryFn: async () => {
            try {
                const response = await getBoostRewards(params)
                return response
            } catch (error) {
                return [
                    {
                        token: {
                            name: '',
                            decimals: 0,
                            symbol: '',
                            address: ''
                        },
                        boost_apy: 0
                    }
                ]
            }
        },
        enabled: !!params.vaultAddress && !!params.chainId,
        staleTime: Infinity,
    })
}
