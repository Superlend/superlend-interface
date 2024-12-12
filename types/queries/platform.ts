import { Period } from '../periodButtons'
import { TPlatformAsset } from '../platform'

export type TGetPlatformParams = {
    chain_id: number
    protocol_identifier: string
}

export type TGetPlatformHistoryParams = {
    protocol_identifier: string
    token: string
    period: Period.oneDay | Period.oneMonth | Period.oneWeek | Period.oneYear
}

export type TGetPlatformResponse = {
    data: TPlatformAsset[]
}
