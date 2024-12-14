import { TGetPlatformHistoryParams, TPlatform, TPlatformHistory } from '@/types'
import { request } from './request'

export async function getPlatformHistoryData({
    protocol_identifier,
    token,
    period,
}: TGetPlatformHistoryParams) {
    return request<TPlatformHistory>({
        method: 'GET',
        path: `/platform/history`,
        query: {
            protocol_identifier,
            token,
            period,
        },
    })
}
