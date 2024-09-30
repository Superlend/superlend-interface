"use client";

import { getOpportunitiesData } from "@/queries/opportunities-api";
import { TGetOpportunitiesParams, TOpportunity } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function useGetOpportunitiesData(
  params: TGetOpportunitiesParams
) {
  const { data, isLoading, isError } = useQuery<TOpportunity[], Error>({
    queryKey: ["opportunities", params.type, params.chain_ids],
    queryFn: async () => {
      try {
        const responseData = await getOpportunitiesData(params);
        return responseData;
      } catch (error) {
        // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
        return [];
      }
    },
    staleTime: Infinity,
    refetchInterval: 60000,
  });
  return { data: data || [], isLoading, isError };
}
