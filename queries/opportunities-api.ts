import { request } from './request'
import { TGetOpportunitiesParams, TOpportunity } from '@/types'

export async function getOpportunitiesData(params: TGetOpportunitiesParams) {
    const {
        type,
        chain_ids = [],
        tokens = [],
        trend = true,
        limit = 0,
    } = params

    return request<TOpportunity[]>({
        method: 'POST',
        path: `/opportunities/${type}`,
        body: {
            chain_ids,
            tokens,
            trend,
            limit,
        },
    })
}

// Midas KPI data types
export interface MidasKpiData {
    lastUpdatedAt: string
    mBasisCurrentCapacity: string
    mBasisAPY: string
    mBasisAUM: string
    mBasisMaxCapacity: string
    mTbillAPY: string
    mTbillAUM: string
    mBtcAPY: string
    mEdgeAPY: string
    mMevAPY: string
    mRe7APY: string
    mSlAPY: string
    mFOneAPY: string
    hypeUsdAPY: string
    hypeBtcAPY: string
    hypeEthAPY: string
}

export async function getMidasKpiData(): Promise<MidasKpiData> {
    const response = await fetch('https://api-prod.midas.app/api/data/kpi')
    if (!response.ok) {
        throw new Error('Failed to fetch Midas KPI data')
    }
    return response.json()
}
