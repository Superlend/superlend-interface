export const DEFAULT_ROUTE = {
    home: '/discover',
}

export const MULTICALL_ADDRESSES: Record<number, string> = {
    42793: '0x84EF812D47a703d521e0D67319222c9590bc1E48',
    146: '0xcA11bde05977b3631167028862bE2a173976CA11',
}

export const BUNDLER_ADDRESS_MORPHO: Record<number, string> = {
    1: '0x4095F064B8d3c3548A3bebfd0Bbfd04750E30077',
    8453: '0x23055618898e202386e6c13955a58D3C68200BFB',
    137: '0x2d9C3A9E67c966C711208cc78b34fB9E9f8db589',
}

export const GENERAL_ADAPTER_ADDRESS: Record<number, string> = {
    137: '0xB261B51938A9767406ef83bbFbaAFE16691b7047',
}

export const MORPHO_BLUE_API_CHAINIDS = [1, 8453]

export const ETH_ADDRESSES = [
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '0x0000000000000000000000000000000000000000',
]

export const ETH_DECIMALS = 18

// API Environment Configuration
export const API_CONFIG = {
    // Key mappings for different API environments
    KEY_MAPPINGS: {
        production: {
            // Production API uses current key names (no mapping needed)
            token: 'token',
            chain_id: 'chain_id',
            platform: 'platform',
            trend: 'trend',
        },
        development: {
            // Development API key mappings (adjust based on actual changes)
            token: 'asset',           // if dev API changed 'token' to 'asset'
            chain_id: 'chainId',      // if dev API changed 'chain_id' to 'chainId'
            platform: 'platform',    // if platform structure is the same
            trend: 'trend',          // if trend structure is the same
        }
    },
    
    // Nested key mappings for platform object
    PLATFORM_KEY_MAPPINGS: {
        production: {
            name: 'name',
            platform_name: 'platform_name',
            protocol_identifier: 'protocol_identifier',
            logo: 'logo',
            additional_rewards: 'additional_rewards',
            max_ltv: 'max_ltv',
            liquidity: 'liquidity',
            borrows: 'borrows',
            utilization_rate: 'utilization_rate',
            apy: 'apy',
            rewards: 'rewards',
            collateral_exposure: 'collateral_exposure',
            collateral_tokens: 'collateral_tokens',
            collateral_token_price: 'collateral_token_price',
            isVault: 'isVault',
        },
        development: {
            name: 'name',
            platform_name: 'platformName',        // example change
            protocol_identifier: 'protocolId',    // example change
            logo: 'logoUrl',                      // example change
            additional_rewards: 'hasAdditionalRewards', // example change
            max_ltv: 'maxLtv',                    // example change
            liquidity: 'totalLiquidity',          // example change
            borrows: 'totalBorrows',              // example change
            utilization_rate: 'utilizationRate',  // example change
            apy: 'apy',
            rewards: 'rewards',
            collateral_exposure: 'collateralExposure',
            collateral_tokens: 'collateralTokens',
            collateral_token_price: 'collateralTokenPrice',
            isVault: 'is_vault',
        }
    }
}

// Get current environment
export const getCurrentEnvironment = (): 'production' | 'development' => {
    const host = process.env.NEXT_PUBLIC_HOST as string
    return host?.includes('api.superlend.xyz') ? 'production' : 'development'
}
