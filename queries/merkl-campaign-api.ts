import { requestMerkle } from './request'

export type TGetMerklOpportunitiesParams = {
    campaignId: string
}

export type TMerklOpportunity = {
    id: string
    computeChainId: number
    distributionChainId: number
    campaignId: string
    type: string
    subType: number
    rewardTokenId: string
    amount: string
    opportunityId: string
    startTimestamp: number
    endTimestamp: number
    creatorAddress: string
    Opportunity: {
        id: string
        chainId: number
        type: string
        identifier: string
        name: string
        depositUrl: string
        explorerAddress: string
        status: string
        action: string
        mainProtocolId: string
        tvl: number
        apr: number
        dailyRewards: number
        tags: string[]
    }
    params: {
        url: string
        hooks: Array<{
            key: string
            chainId: number
            hookType: number
            defaultBoost: string
            contractState: string
            boostForInvited: string
            contractAddress: string
            cumulativeBoost: boolean
            boostForReferrer: string
            maximumBoostInvited: number
            maximumBoostReferrer: number
            valueForBoostForInvited: number
            valueForBoostForReferrer: number
        }>
        duration: number
        blacklist: string[]
        whitelist: string[]
        forwarders: string[]
        targetToken: string
        symbolRewardToken: string
        symbolTargetToken: string
        decimalsRewardToken: number
        decimalsTargetToken: number
    }
    chain: {
        id: number
        name: string
        icon: string
    }
    rewardToken: {
        id: string
        name: string
        chainId: number
        address: string
        decimals: number
        icon: string
        verified: boolean
        isTest: boolean
        isPoint: boolean
        isNative: boolean
        price: number | null
        symbol: string
    }
    distributionChain: {
        id: number
        name: string
        icon: string
    }
    creator: {
        address: string
        tags: string[]
        creatorId: string | null
    }
    createdAt: string
}

export const fallbackMerklOpportunityData: TMerklOpportunity = {
    id: '',
    computeChainId: 0,
    distributionChainId: 0,
    campaignId: '',
    type: '',
    subType: 0,
    rewardTokenId: '',
    amount: '0',
    opportunityId: '',
    startTimestamp: 0,
    endTimestamp: 0,
    creatorAddress: '',
    Opportunity: {
        id: '',
        chainId: 0,
        type: '',
        identifier: '',
        name: '',
        depositUrl: '',
        explorerAddress: '',
        status: '',
        action: '',
        mainProtocolId: '',
        tvl: 0,
        apr: 0,
        dailyRewards: 0,
        tags: []
    },
    params: {
        url: '',
        hooks: [],
        duration: 0,
        blacklist: [],
        whitelist: [],
        forwarders: [],
        targetToken: '',
        symbolRewardToken: '',
        symbolTargetToken: '',
        decimalsRewardToken: 0,
        decimalsTargetToken: 0
    },
    chain: {
        id: 0,
        name: '',
        icon: ''
    },
    rewardToken: {
        id: '',
        name: '',
        chainId: 0,
        address: '',
        decimals: 0,
        icon: '',
        verified: false,
        isTest: false,
        isPoint: false,
        isNative: false,
        price: null,
        symbol: ''
    },
    distributionChain: {
        id: 0,
        name: '',
        icon: ''
    },
    creator: {
        address: '',
        tags: [],
        creatorId: null
    },
    createdAt: ''
}

export async function getMerklOpportunitiesData({
    campaignId,
}: TGetMerklOpportunitiesParams) {
    return requestMerkle<TMerklOpportunity[]>({
        method: 'GET',
        path: `/campaigns`,
        query: {
            campaignId: campaignId,
            chainId: 42793,
            // point: true,
            withOpportunity: true,
        },
    })
}
