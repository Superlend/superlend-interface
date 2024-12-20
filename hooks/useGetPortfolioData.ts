'use client'

import { getPortfolioData } from '@/queries/portfolio-api'
import { TGetPortfolioParams, TPortfolio } from '@/types/queries/portfolio'
import { useQueries, useQuery } from '@tanstack/react-query'

const PortfolioDataInit = {
    platforms: [],
    total_borrowed: 0,
    total_supplied: 0,
}

export default function useGetPortfolioData(params: TGetPortfolioParams) {
    const {
        user_address,
        chain_id,
        platform_id,
        position_type,
        protocol_identifier,
        is_refresh,
    } = params

    const { data, isLoading, isError } = useQuery<TPortfolio>({
        queryKey: [
            'portfolio',
            user_address,
            chain_id,
            platform_id,
            position_type,
            protocol_identifier,
            is_refresh,
        ],
        queryFn: async () => {
            try {
                const responseData = await getPortfolioData(params)
                return responseData
            } catch (error) {
                // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
                // throw new Error("Failed to fetch portfolio data");
                return PortfolioDataInit
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
        enabled: !!user_address,
    })

    // const chainIds = [1088, 534352, 43114, 137, 10, 1, 8453, 56, 100, 42161];

    // const combinedQueries = useQueries({
    //   queries: chainIds.map((id) => ({
    //     queryKey: ["portfolio", id],
    //     queryFn: () => getPortfolioData({ ...params, chain_id: [id.toString()] }),
    //   })),
    //   combine: (results) => {
    //     return {
    //       data: results.map((result) => result.data),
    //       pending: results.some((result) => result.isPending),
    //     };
    //   },
    // });

    return {
        data: data || PortfolioDataInit,
        isLoading,
        isError,
    }
}
