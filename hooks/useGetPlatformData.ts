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
                // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
                throw new Error(
                    'There was an error while fetching Platform data'
                )
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
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
