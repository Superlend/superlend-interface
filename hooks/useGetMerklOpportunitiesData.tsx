"use client"

import { fallbackMerklOpportunityData, getMerklOpportunitiesData, TMerklOpportunity } from "@/queries/merkl-campaign-api"
import { useQuery } from "@tanstack/react-query"

export const useGetMerklOpportunitiesData = ({
    campaignId,
}: {
    campaignId: string
}) => {
    const { data, isLoading, isError } = useQuery<TMerklOpportunity[], Error>({
        queryKey: ['merkl-opportunities-data', campaignId],
        queryFn: async () => {
            try {
                const responseData = await getMerklOpportunitiesData({
                    campaignId,
                })
                return responseData || []
            } catch (error) {
                return []
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
    })
    return { data, isLoading, isError }
}
