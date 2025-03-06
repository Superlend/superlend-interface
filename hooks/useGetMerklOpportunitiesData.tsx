"use client"

import { fallbackMerklOpportunityData, getMerklOpportunitiesData, TMerklOpportunity } from "@/queries/merkl-api"
import { useQuery } from "@tanstack/react-query"

export const useGetMerklOpportunitiesData = ({
    id,
}: {
    id: string
}) => {
    const { data, isLoading, isError } = useQuery<TMerklOpportunity, Error>({
        queryKey: ['merkl-opportunities-data', id],
        queryFn: async () => {
            try {
                const responseData = await getMerklOpportunitiesData({
                    id,
                })
                return responseData || fallbackMerklOpportunityData
            } catch (error) {
                return fallbackMerklOpportunityData
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
    })
    return { data, isLoading, isError }
}
