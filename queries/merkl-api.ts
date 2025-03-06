import { requestMerkle } from './request'

export type TGetMerklOpportunitiesParams = {
    id: string
}

export type TMerklOpportunity = {
    chainId: number
    type: string
    identifier: string
    name: string
    status: string
    action: string
    tvl: number
    apr: number
    dailyRewards: number
    depositUrl: string
    tags: string[]
    id: string
    tokens: {
        id: string
        name: string
        chainId: number
        address: string
        decimals: number
        icon: string
        verified: boolean
        isTest: boolean
        price: number
        symbol: string
    }[]
    chain: {
        id: number
        name: string
        icon: string
    }
    aprRecord: {
        cumulated: number
        timestamp: number
        breakdowns: {
            id: number
            type: string
            identifier: string
            value: number
            aprRecordId: string
        }[]
    }
    tvlRecord: {
        total: number
        timestamp: number
        breakdowns: {
            id: number
            type: string
            identifier: string
            value: number
            tvlRecordId: string
        }[]
    }
    rewardsRecord: {
        id: string
        total: number
        timestamp: number
        breakdowns: {
            id: number
            campaignId: string
            value: number
            dailyRewardsRecordId: string
            token: {
                id: string
                name: string
                chainId: number
                address: string
                decimals: number
                icon: string
                verified: boolean
                isTest: boolean
                price: number
                symbol: string
            }
            amount: number
        }[]
    }
    protocol: {
        id: string
        name: string
        icon: string
        tags: string[]
        description: string
        url: string
    }
}

export const fallbackMerklOpportunityData: TMerklOpportunity = {
    chainId: 0,
    type: '',
    identifier: '',
    name: '',
    status: '',
    action: '',
    tvl: 0,
    apr: 0,
    dailyRewards: 0,
    depositUrl: '',
    tags: [],
    id: '',
    tokens: [],
    chain: {
        id: 0,
        name: '',
        icon: '',
    },
    aprRecord: {
        cumulated: 0,
        timestamp: 0,
        breakdowns: [],
    },
    tvlRecord: {
        total: 0,
        timestamp: 0,
        breakdowns: [],
    },
    rewardsRecord: {
        id: '',
        total: 0,
        timestamp: 0,
        breakdowns: [],
    },
    protocol: {
        id: '',
        name: '',
        icon: '',
        tags: [],
        description: '',
        url: '',
    },
}

export async function getMerklOpportunitiesData({ id }: TGetMerklOpportunitiesParams) {
    return requestMerkle<TMerklOpportunity>({
        method: 'GET',
        path: `/opportunities/${id}`,
    })
}
