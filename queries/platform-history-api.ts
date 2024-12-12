import { TPlatformHistory } from '@/types/platform'
import { request } from './request'
import { TGetPlatformHistoryParams } from '@/types/queries/platform'

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
