import { requestMerkle } from './request'

export type TGetMerklUserRewardsParams = {
    walletAddress: string
}

export type TMerklUserRewards = {
    chain: {
        id: number
        name: string
        icon: string
        Explorer: Array<{
            id: string
            type: string
            url: string
            chainId: number
        }>
    }
    rewards: Array<{
        root: string
        recipient: string
        amount: string
        claimed: string
        pending: string
        proofs: string[]
        token: {
            address: string
            chainId: number
            symbol: string
            decimals: number
        }
        breakdowns: Array<{
            reason: string
            amount: string
            claimed: string
            pending: string
            campaignId: string
        }>
    }>
}

export const fallbackMerklOpportunityData: TMerklUserRewards = {
    chain: {
        id: 0,
        name: '',
        icon: '',
        Explorer: [],
    },
    rewards: [],
}

export async function getMerklUserRewardsData({
    walletAddress,
}: TGetMerklUserRewardsParams) {
    return requestMerkle<TMerklUserRewards[]>({
        method: 'GET',
        path: `/users/${walletAddress}/rewards`,
        query: {
            chainId: 42793,
        },
    })
}
