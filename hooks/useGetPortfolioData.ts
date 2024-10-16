"use client";

import { getPortfolioData } from "@/queries/portfolio-api";
import { TGetPortfolioParams, TPortfolio } from "@/types/queries/portfolio";
import { useQuery } from "@tanstack/react-query";

const PortfolioDataInit = {
  platforms: [],
  total_borrowed: 0,
  total_supplied: 0,
};

export default function useGetPortfolioData(params: TGetPortfolioParams) {
  const { user_address, chain_id, platform_id, position_type } = params;

  const { data, isLoading, isError } = useQuery<TPortfolio>({
    queryKey: ["portfolio", user_address, chain_id, platform_id, position_type],
    queryFn: async () => {
      try {
        const responseData = await getPortfolioData(params);
        return responseData;
      } catch (error) {
        // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
        throw new Error("Failed to fetch portfolio data");
      }
    },
    staleTime: Infinity,
    refetchInterval: 60000,
  });
  return {
    data: data || PortfolioDataInit,
    isLoading,
    isError,
  };
}
