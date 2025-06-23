import { getChainsData } from '@/queries/chains-api'
import { TChain } from '@/types/chain'
import { useQuery } from '@tanstack/react-query'

export default function useGetChainsData() {
    const { data, isLoading, isError } = useQuery<TChain[], Error>({
        queryKey: ['chains'],
        queryFn: async () => {
            try {
                const responseData = await getChainsData()
                return responseData
            } catch (error) {
                return []
            }
        },
        // ULTRA-AGGRESSIVE CACHING - Chains data is extremely static
        staleTime: 24 * 60 * 60 * 1000, // 24 hours - chains rarely change
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache - keep in cache for a week
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        refetchOnReconnect: true, // Only refetch on network reconnect
    })
    return { data: data || [], isLoading, isError }
}
