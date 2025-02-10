import { WarningMessages } from '@/constants'
import { Period } from './periodButtons'

export type TPositionType = 'lend' | 'borrow'
export type TActionType = 'lend' | 'borrow' | 'withdraw' | 'repay'

export type TToken = {
    address: string
    decimals: number
    logo: string | null
    name: string
    price_usd: number
    symbol: string
}

export type TChain = {
    chain_id: number
    logo: string | null
    name: string
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
    enabled?: boolean
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
        isVault?: boolean
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
    platformWithMarketName: string
    platformLogo: string
    apy_current: string
    apy_avg_7days: string
    additional_rewards: boolean
    rewards: TReward[]
    max_ltv: number
    deposits: string
    borrows: string
    utilization: string
    isVault: boolean
}

// Platform
export type TGetPlatformParams = {
    chain_id: number
    protocol_identifier: string
}

export type TPlatformAsset = {
    token: {
        name: string
        symbol: string
        logo: string
        address: string
        decimals: number
        price_usd: number
        warnings: any[]
    }
    ltv: number
    supply_apy: number
    variable_borrow_apy: number
    stable_borrow_apy: number
    borrow_enabled: boolean
    remaining_supply_cap: number
    remaining_borrow_cap: number
}

export type TPlatform = {
    platform: {
        name: string
        platform_name: string
        protocol_identifier: string
        // protocol_type: "aaveV3" | "compoundV2" | "morpho" | "fluid";
        protocol_type: 'aaveV3' | 'compoundV2' | 'morpho' | 'fluid'
        logo: string
        chain_id: number
        vaultId: string
        isVault: boolean
        morpho_market_id: string
        core_contract: string
    }
    assets: TPlatformAsset[]
}

export type TGetPlatformHistoryParams = {
    protocol_identifier: string
    token: string
    period: Period.oneDay | Period.oneMonth | Period.oneWeek | Period.oneYear
}

export type TPlatformHistoryProcessMap = {
    timestamp: number
    data: {
        size: number
        tokenID: string
        symbol: string
        liquidationPenalty: number
        blockNumber: number
        depositRate: number
        depositRateReward: number
        variableBorrowRate: number
        variableBorrowRateReward: number
        ltv: number
        liquidationThreshold: number
        stableBorrowRate: number
        tokenName: string
        utilizationRate: number
        decimals: number
        platformMarketId: string
        underlyingAsset: string
        reserveFactor: number
    }
}

export type TPlatformHistoryStats = {
    depositRateAverage: number
    depositRateRewardAverage: number
    variableBorrowRateAverage: number
    variableBorrowRateRewardAverage: number
    utilizationRateAverage: number
    prediction: {
        depositRatePredict: number
        variableBorrowRatePredict: number
    }
}

export type TPlatformHistory = {
    processMap: TPlatformHistoryProcessMap[]
    stats: TPlatformHistoryStats
}

export type TGetTokensParams = {
    chain_id?: string[]
    token?: string[]
}

// Queries END =====================================
