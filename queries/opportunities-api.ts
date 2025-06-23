import { request } from './request'
import { TGetOpportunitiesParams, TOpportunity } from '@/types'
import { 
    getOpportunitiesKeyMappings, 
    getPlatformKeyMappings, 
    getApyKeyMappings,
    getTokenKeyMappings,
    getTrendKeyMappings,
    BYPASS_MAPPING_FOR_DEBUG 
} from '@/config/api-mappings'
import { 
    logApiResponseStructure, 
    validateMappedResponse 
} from '@/lib/api-migration-utils'

// Environment-aware response key mapping function
function mapOpportunityResponse(apiResponse: any[]): TOpportunity[] {
    const keyMappings = getOpportunitiesKeyMappings()
    const platformKeyMappings = getPlatformKeyMappings()
    const apyKeyMappings = getApyKeyMappings()
    const tokenKeyMappings = getTokenKeyMappings()
    const trendKeyMappings = getTrendKeyMappings()

    return apiResponse.map((item) => {
        // Get the actual data using environment-specific key mappings
        const tokenData = item[keyMappings.token as string]
        const chainId = item[keyMappings.chain_id as string]
        const platformData = item[keyMappings.platform as string]
        const trendData = item[keyMappings.trend as string]
        
        // Map token data with nested structure
        const mappedToken = tokenData ? {
            address: tokenData[tokenKeyMappings.address as string] || '',
            decimals: tokenData[tokenKeyMappings.decimals as string] || 0,
            logo: tokenData[tokenKeyMappings.logo as string] || '',
            name: tokenData[tokenKeyMappings.name as string] || '',
            price_usd: tokenData[tokenKeyMappings.price_usd as string] || 0,
            symbol: tokenData[tokenKeyMappings.symbol as string] || '',
        } : {
            address: '',
            decimals: 0,
            logo: '',
            name: '',
            price_usd: 0,
            symbol: '',
        }
        
        // Map APY data if it exists
        const apyData = platformData?.[platformKeyMappings.apy as string]
        const mappedApy = apyData ? {
            current: apyData[apyKeyMappings.current as string] || '0',
            avg_7days: apyData[apyKeyMappings.avg_7days as string] || '0',
            avg_30days: apyData[apyKeyMappings.avg_30days as string] || '0',
        } : {
            current: '0',
            avg_7days: '0', 
            avg_30days: '0',
        }

        // Map trend data with nested structure
        const mappedTrend = trendData ? {
            value: trendData[trendKeyMappings.value as string] || '',
            type: trendData[trendKeyMappings.type as string] || '',
        } : {
            value: '',
            type: '',
        }

        // Map rewards array - handle potential structure changes
        const rewardsData = platformData?.[platformKeyMappings.rewards as string] || []
        const mappedRewards = Array.isArray(rewardsData) ? rewardsData.map((reward: any) => {
            // If the reward structure is different in dev API, handle it here
            if (reward && typeof reward === 'object') {
                // Try to preserve the expected structure for backwards compatibility
                return {
                    ...reward,
                    // Ensure asset property exists with address
                    asset: reward.asset || {
                        address: reward.a || reward.address || reward.addr || '',
                        symbol: reward.s || reward.symbol || '',
                        name: reward.n || reward.name || '',
                        logo: reward.l || reward.logo || '',
                        decimals: reward.d || reward.decimals || 0,
                    }
                }
            }
            return reward
        }) : []

        return {
            token: mappedToken,
            chain_id: chainId || 0,  // Fallback to 0 if chainId is undefined
            platform: {
                name: platformData?.[platformKeyMappings.name as string] || '',
                platform_name: platformData?.[platformKeyMappings.platform_name as string] || '',
                protocol_identifier: platformData?.[platformKeyMappings.protocol_identifier as string] || '',
                logo: platformData?.[platformKeyMappings.logo as string] || '',
                additional_rewards: platformData?.[platformKeyMappings.additional_rewards as string] ?? false,
                max_ltv: platformData?.[platformKeyMappings.max_ltv as string] ?? 0,
                liquidity: platformData?.[platformKeyMappings.liquidity as string] || '0',
                borrows: platformData?.[platformKeyMappings.borrows as string] || '0',
                utilization_rate: platformData?.[platformKeyMappings.utilization_rate as string] || '0',
                apy: mappedApy,
                rewards: mappedRewards,
                collateral_exposure: platformData?.[platformKeyMappings.collateral_exposure as string] || [],
                collateral_tokens: platformData?.[platformKeyMappings.collateral_tokens as string] || [],
                collateral_token_price: platformData?.[platformKeyMappings.collateral_token_price as string] ?? 0,
                isVault: platformData?.[platformKeyMappings.isVault as string] ?? false,
            },
            trend: mappedTrend,
        }
    })
}

export async function getOpportunitiesData(params: TGetOpportunitiesParams) {
    const {
        type,
        chain_ids = [],
        tokens = [],
        trend = true,
        limit = 0,
    } = params

    const rawResponse = await request<any[]>({
        method: 'POST',
        path: `/opportunities/${type}`,
        body: {
            chain_ids,
            tokens,
            trend,
            limit,
        },
    })

    // Optional: Keep minimal logging for debugging (can be removed later)
    if (process.env.NODE_ENV === 'development' && rawResponse && rawResponse.length > 0) {
        console.log('🔍 API Migration Status: Active mapping from', process.env.NEXT_PUBLIC_HOST)
    }

    // Debug: Log the raw API response structure in development
    logApiResponseStructure(rawResponse, `/opportunities/${type}`)

    // Map the response to handle key name changes (or bypass for debugging)
    const mappedResponse = BYPASS_MAPPING_FOR_DEBUG ? rawResponse : mapOpportunityResponse(rawResponse)

    // Optional: Keep minimal validation logging
    if (process.env.NODE_ENV === 'development' && mappedResponse && mappedResponse.length > 0) {
        console.log('✅ API Mapping: Successfully transformed', mappedResponse.length, 'opportunities')
    }

    // Debug: Validate the mapped response in development
    validateMappedResponse(mappedResponse, `/opportunities/${type}`)

    return mappedResponse
}
