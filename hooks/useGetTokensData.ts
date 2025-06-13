import { getTokensData } from '@/queries/tokens-api'
import { TGetTokensParams, TToken } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetTokensData(params: TGetTokensParams = {}) {
    const { data, isLoading, isError } = useQuery<TToken[], Error>({
        queryKey: ['tokens', params.chain_id, params.token],
        queryFn: async () => {
            try {
                const responseData = await getTokensData(params)
                return responseData
            } catch (error) {
                return []
            }
        },
        // AGGRESSIVE CACHING - Token metadata is very static
        staleTime: 12 * 60 * 60 * 1000, // 12 hours - token data rarely changes  
        gcTime: 3 * 24 * 60 * 60 * 1000, // 3 days cache - keep in cache longer
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        refetchOnReconnect: true,
    })
    return { data: data || [], isLoading, isError }
}
