import { TGetPlatformParams, TPlatform } from '@/types'
import { request } from './request'

export async function getPlatformData({
    chain_id,
    protocol_identifier,
}: TGetPlatformParams) {
    return request<TPlatform>({
        method: 'GET',
        path: `/platform`,
        query: {
            chain_id,
            protocol_identifier,
        },
    })
}
