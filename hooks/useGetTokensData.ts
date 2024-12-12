import { getTokensData } from '@/queries/tokens-api'
import { TGetTokensParams, TToken } from '@/types'
import { useQuery } from '@tanstack/react-query'
// import { getAssetsData } from "../services/assets-api";
// import {
//   ERROR_TOAST_ICON_STYLES,
//   REFETCH_INTERVAL,
//   SOMETHING_WENT_WRONG_MESSAGE,
// } from "../constants";
// import { IAssetData } from "@interfaces/IAssetData";
// import toast from "react-hot-toast";

export default function useGetTokensData(params: TGetTokensParams = {}) {
    const { data, isLoading, isError } = useQuery<TToken[], Error>({
        // enabled: !isMyPositionsEnabled,
        queryKey: ['tokens'],
        queryFn: async () => {
            try {
                const responseData = await getTokensData(params)
                return responseData
            } catch (error) {
                // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
                return []
            }
        },
        staleTime: Infinity,
        refetchInterval: 60000,
    })
    return { data: data || [], isLoading, isError }
}
