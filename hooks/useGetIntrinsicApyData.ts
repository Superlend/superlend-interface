'use client'

import { getIntrinsicApyData, IntrinsicApyResponse } from '@/queries/intrinsic-apy-api'
import { useQuery } from '@tanstack/react-query'

export default function useGetIntrinsicApyData() {
    const { data, isLoading, isError, refetch } = useQuery<IntrinsicApyResponse, Error>({
        queryKey: ['intrinsic-apy'],
        queryFn: getIntrinsicApyData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })

    return {
        data,
        isLoading,
        isError,
        refetch,
        // Helper getters for easy access
        // mBasisAPY: data?.data?.mBasisAPY ? parseFloat(data.data.mBasisAPY) : null,
        // mTbillAPY: data?.data?.mTbillAPY ? parseFloat(data.data.mTbillAPY) : null,
        // stXTZ: data?.data?.stXTZ ? parseFloat(data.data.stXTZ) : null,
        mMEV: data?.data?.mMEV ? parseFloat(data.data.mMEV) : null,
        lbtcApyEstimated: data?.data?.lbtcApyEstimated || null, // Already in percentage format
    }
}
