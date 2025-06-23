'use client'

import { getPlatformData } from '@/queries/platform-api'
import { TPlatform } from '@/types/platform'
import { TGetPlatformParams } from '@/types/queries/platform'
import { useQuery } from '@tanstack/react-query'

export default function useGetPlatformData(params: TGetPlatformParams) {
    const { protocol_identifier, chain_id } = params

    const { data, isLoading, isError } = useQuery<TPlatform>({
        queryKey: ['platform', protocol_identifier, chain_id],
        queryFn: async () => {
            try {
                const responseData = await getPlatformData(params)
                return responseData
            } catch (error) {
                throw new Error(
                    'There was an error while fetching Platform data'
                )
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - platform data changes occasionally
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnMount: false, // Use cached data when available
        refetchInterval: false,
        refetchOnReconnect: true,
    })
    return {
        data: data || {
            platform: {
                platform_name: '',
                protocol_type: 'aaveV3',
                protocol_identifier: '',
                name: '',
                logo: '',
                chain_id: 0,
                vaultId: '',
                isVault: false,
                morpho_market_id: '',
                core_contract: '',
                uiPoolDataProvider: '',
                poolAddressesProvider: '',
            },
            assets: [],
        },
        isLoading,
        isError,
    }
}
