'use client'

import { getMidasKpiData, MidasKpiData } from '@/queries/opportunities-api'
import { useQuery } from '@tanstack/react-query'

export default function useGetMidasKpiData() {
    const { data, isLoading, isError, refetch } = useQuery<MidasKpiData, Error>({
        queryKey: ['midas-kpi'],
        queryFn: getMidasKpiData,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })

    return {
        data,
        isLoading,
        isError,
        refetch,
        mBasisAPY: data?.mBasisAPY ? parseFloat(data.mBasisAPY) * 100 : null, // Convert to percentage
        mTbillAPY: data?.mTbillAPY ? parseFloat(data.mTbillAPY) * 100 : null, // Convert to percentage
        mMevAPY: data?.mMevAPY ? parseFloat(data.mMevAPY) * 100 : null, // Convert to percentage
    }
} 