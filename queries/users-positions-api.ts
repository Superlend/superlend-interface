import {
    TGetUserPositionsParams,
    TUserPosition,
} from '@/types/queries/portfolio'
import { request } from './request'

export async function getUserPositionsData(params: TGetUserPositionsParams) {
    const { chain_ids = [], platform_ids = [], tokens = [] } = params

    return request<TUserPosition[]>({
        method: 'POST',
        path: `/users/positions`,
        body: {
            chain_ids,
            platform_ids,
            tokens,
        },
    })
}
