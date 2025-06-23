/**
 * API Key Mappings Configuration
 * This file manages key mappings between different API environments
 * 
 * MIGRATION: Moving FROM current production format TO new dev format
 */

export type ApiEnvironment = 'production' | 'development' | 'staging'

export interface KeyMappingConfig {
  [key: string]: string | KeyMappingConfig
}

/**
 * Token nested object key mappings
 * Current production format vs new dev format
 */
export const TOKEN_KEY_MAPPINGS: Record<ApiEnvironment, KeyMappingConfig> = {
  production: {
    // Current production API structure
    address: 'address',
    decimals: 'decimals',
    logo: 'logo',
    name: 'name',
    price_usd: 'price_usd',
    symbol: 'symbol',
  },
  
  development: {
    // ACTUAL dev API structure (from console logs)
    address: 'a',        // Dev API: 'a' = address
    decimals: 'd',       // Dev API: 'd' = decimals
    logo: 'l',           // Dev API: 'l' = logo
    name: 'n',           // Dev API: 'n' = name
    price_usd: 'p',      // Dev API: 'p' = price_usd
    symbol: 's',         // Dev API: 's' = symbol
  },
  
  staging: {
    // Same as production for now
    address: 'address',
    decimals: 'decimals',
    logo: 'logo',
    name: 'name',
    price_usd: 'price_usd',
    symbol: 'symbol',
  }
}

/**
 * Opportunities API key mappings (top level)
 */
export const OPPORTUNITIES_KEY_MAPPINGS: Record<ApiEnvironment, KeyMappingConfig> = {
  production: {
    // Current production API structure
    token: 'token',
    chain_id: 'chain_id',
    platform: 'platform',
    trend: 'trend',
  },
  
  development: {
    // ACTUAL dev API structure (from console logs)
    token: 't',           // Dev API changed 'token' to 't'
    chain_id: 'c',        // Dev API changed 'chain_id' to 'c'  
    platform: 'p',       // Dev API changed 'platform' to 'p'
    trend: 'trend',       // No trend field found in dev API, keeping as fallback
  },
  
  staging: {
    // Staging API structure (if different from prod/dev)
    token: 'token',
    chain_id: 'chain_id',
    platform: 'platform', 
    trend: 'trend',
  }
}

/**
 * Platform nested object key mappings
 * This handles the complex nested structure inside platform
 */
export const PLATFORM_KEY_MAPPINGS: Record<ApiEnvironment, KeyMappingConfig> = {
  production: {
    // Current production structure
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
    // ACTUAL dev API structure (from console logs)
    name: 'n',                      // Dev API: 'n' = name
    platform_name: 'pn',            // Dev API: 'pn' = platform_name
    protocol_identifier: 'pi',      // Dev API: 'pi' = protocol_identifier
    logo: 'l',                      // Dev API: 'l' = logo
    additional_rewards: 'ar',       // Dev API: 'ar' = additional_rewards
    max_ltv: 'ml',                  // Dev API: 'ml' = max_ltv
    liquidity: 'li',                // Dev API: 'li' = liquidity
    borrows: 'bo',                  // Dev API: 'bo' = borrows
    utilization_rate: 'ur',         // Dev API: 'ur' = utilization_rate
    apy: 'ap',                      // Dev API: 'ap' = apy
    rewards: 'r',                   // Dev API: 'r' = rewards
    collateral_exposure: 'ce',      // Dev API: 'ce' = collateral_exposure
    collateral_tokens: 'ct',        // Dev API: 'ct' = collateral_tokens (guessed)
    collateral_token_price: 'ctp',  // Dev API: 'ctp' = collateral_token_price (guessed)
    isVault: 'iv',                  // Dev API: 'iv' = isVault (guessed)
  },
  
  staging: {
    // Same as production for now
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
  }
}

/**
 * APY nested object key mappings
 * Current: apy.current, apy.avg_7days, apy.avg_30days
 * New dev format might be different
 */
export const APY_KEY_MAPPINGS: Record<ApiEnvironment, KeyMappingConfig> = {
  production: {
    // Current production structure
    current: 'current',
    avg_7days: 'avg_7days',
    avg_30days: 'avg_30days',
  },
  
  development: {
    // ACTUAL dev API structure (from console logs)
    current: 'c',           // Dev API: 'c' = current
    avg_7days: 'a',         // Dev API: 'a' = average (using for 7-day avg)
    avg_30days: 'a',        // Dev API: 'a' = average (using same value for 30-day avg)
  },
  
  staging: {
    current: 'current',
    avg_7days: 'avg_7days',
    avg_30days: 'avg_30days',
  }
}

/**
 * Trend nested object key mappings
 */
export const TREND_KEY_MAPPINGS: Record<ApiEnvironment, KeyMappingConfig> = {
  production: {
    // Current production structure
    value: 'value',
    type: 'type',
  },
  
  development: {
    // New dev API structure (examples - adjust based on actual changes)
    value: 'trendValue',    // Example change
    type: 'trendType',      // Example change
  },
  
  staging: {
    value: 'value',
    type: 'type',
  }
}

/**
 * Get current API environment based on HOST URL
 */
export function getApiEnvironment(): ApiEnvironment {
  const host = process.env.NEXT_PUBLIC_HOST as string
  
  if (host?.includes('api.superlend.xyz')) {
    return 'production'
  } else if (host?.includes('api.dev.superlend.xyz')) {
    return 'development'
  } else if (host?.includes('api.staging.superlend.xyz')) {
    return 'staging'
  }
  
  // Default to development for local development
  return 'development'
}

/**
 * TEMPORARY: Bypass mapping for debugging
 * Set this to true to see raw API response without any transformations
 */
export const BYPASS_MAPPING_FOR_DEBUG = false

/**
 * Get key mappings for current environment
 */
export function getOpportunitiesKeyMappings(): KeyMappingConfig {
  const environment = getApiEnvironment()
  return OPPORTUNITIES_KEY_MAPPINGS[environment]
}

/**
 * Get platform key mappings for current environment
 */
export function getPlatformKeyMappings(): KeyMappingConfig {
  const environment = getApiEnvironment()
  return PLATFORM_KEY_MAPPINGS[environment]
}

/**
 * Get APY key mappings for current environment
 */
export function getApyKeyMappings(): KeyMappingConfig {
  const environment = getApiEnvironment()
  return APY_KEY_MAPPINGS[environment]
}

/**
 * Get token key mappings for current environment
 */
export function getTokenKeyMappings(): KeyMappingConfig {
  const environment = getApiEnvironment()
  return TOKEN_KEY_MAPPINGS[environment]
}

/**
 * Get trend key mappings for current environment
 */
export function getTrendKeyMappings(): KeyMappingConfig {
  const environment = getApiEnvironment()
  return TREND_KEY_MAPPINGS[environment]
} 