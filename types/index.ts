import { WarningMessages } from '@/constants'
import { Period } from './periodButtons'

export type TPositionType = 'lend' | 'borrow'

export type TToken = {
    address: string
    decimals: number
    logo: string | null
    name: string
    price_usd: number
    symbol: string
}

// Queries START =====================================

// Login Challenge
export type TGetLoginChallengeParams = {
    user_address: string
}

export type TLoginChallengeResponse = {
    challenge: string
}

// Login
export type TPostLoginParams = {
    challenge: string
    signature: string
    address: string
}

export type TLoginResponse = {
    access_token: string
    refresh_token: string
}

// Refresh
export type TPostRefreshParams = {
    Authorization: string
}

export type TRefreshResponse = TLoginResponse

// Opportunities
export type TGetOpportunitiesParams = {
    type: 'lend' | 'borrow'
    chain_ids?: number[]
    tokens?: string[]
    trend?: boolean
    limit?: number
}

export type TReward = {
    supply_apy: number
    borrow_apy: number
    asset: {
        symbol: string
        name: string
        address: `0x${string}`
        decimals: number
        logo: string
        price_usd: number
    }
}

export type TOpportunity = {
    token: {
        address: string
        decimals: number
        logo: string
        name: string
        price_usd: number
        symbol: string
    }
    chain_id: number
    platform: {
        name: string
        platform_name: string
        protocol_identifier: string
        logo: string
        additional_rewards: boolean
        max_ltv: number
        liquidity: string
        borrows: string
        utilization_rate: string
        apy: {
            current: string
            avg_7days: string
            avg_30days: string
        }
        rewards: TReward[]
    }
    trend: {
        value: string
        type: string
    }
}

export type TOpportunityTable = {
    tokenAddress: string
    tokenSymbol: string
    tokenLogo: string
    tokenName: string
    chainLogo: string
    chain_id: number
    chainName: string
    protocol_identifier: string
    platformName: string
    platformId: string
    platformLogo: string
    apy_current: string
    additional_rewards: boolean
    rewards: TReward[]
    max_ltv: number
    deposits: string
    borrows: string
    utilization: string
}

export type TGetTokensParams = {
    chain_id?: string[]
    token?: string[]
}

// Queries END =====================================
