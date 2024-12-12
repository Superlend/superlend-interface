'use client'

import { getPlatformHistoryData } from '@/queries/platform-history-api'
import { TPlatformHistory } from '@/types/platform'
import { TGetPlatformHistoryParams } from '@/types/queries/platform'
import { useQuery } from '@tanstack/react-query'

export default function useGetPlatformHistoryData(
    params: TGetPlatformHistoryParams
) {
    const { protocol_identifier, token, period } = params

    const { data, isLoading, isError } = useQuery<TPlatformHistory, Error>({
        queryKey: ['platformHistory', protocol_identifier, token, period],
        queryFn: async () => {
            try {
                const responseData = await getPlatformHistoryData(params)
                return responseData
            } catch (error) {
                // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
                // return [];
                throw new Error(
                    'There was an error while fetching Platform history data'
                )
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
    })
    return { data: data, isLoading, isError }
}
