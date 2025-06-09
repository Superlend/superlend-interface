'use client'

import { getOpportunitiesData } from '@/queries/opportunities-api'
import { TGetOpportunitiesParams, TOpportunity } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetOpportunitiesData(
    params: TGetOpportunitiesParams
) {
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
                const responseData = await getOpportunitiesData(params)
                return responseData
            } catch (error) {
                // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
                return []
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
        refetchInterval: false,
        enabled: params.enabled,
    })
    return { data: data || [], isLoading, isError, refetch }
}
