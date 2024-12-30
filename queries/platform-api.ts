import { TPlatform } from '@/types/platform'
import { TGetPlatformParams } from '@/types/queries/platform'
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
