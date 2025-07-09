"use client"

import { fallbackMerklOpportunityData, getMerklUserRewardsData, TMerklUserRewards } from "@/queries/merkl-user-rewards-api"
import { useQuery } from "@tanstack/react-query"

export const useGetMerklUserRewardsData = ({
    walletAddress,
}: {
    walletAddress: string
}) => {
    const { data, isLoading, isError } = useQuery<TMerklUserRewards[], Error>({
        queryKey: ['merkl-user-rewards-data', walletAddress],
        queryFn: async () => {
            try {
                const responseData = await getMerklUserRewardsData({
                    walletAddress,
                })
                return responseData || []
            } catch (error) {
                return []
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
        enabled: !!walletAddress,
    })
    return { data, isLoading, isError }
}
