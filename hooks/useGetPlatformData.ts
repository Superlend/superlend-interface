"use client";

import { getPlatformData } from "@/queries/platform-api";
import { TGetPlatformParams, TOpportunity, TPlatform } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function useGetPlatformData(params: TGetPlatformParams) {
  const { platform_id, chain_id } = params;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform", platform_id, chain_id],
    queryFn: async () => {
      try {
        const responseData = await getPlatformData(params);
        return responseData;
      } catch (error) {
        // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
        return {
          assets: [],
        };
      }
    },
    staleTime: Infinity,
    refetchInterval: 60000,
  });
  return {
    data: data || {
      assets: [],
    },
    isLoading,
    isError,
  };
}
