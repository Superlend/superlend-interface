import { request } from './request'
import { TGetOpportunitiesParams, TOpportunity } from '@/types'
import { 
    getOpportunitiesKeyMappings, 
    getPlatformKeyMappings, 
    getApyKeyMappings,
    getTokenKeyMappings,
    getTrendKeyMappings,
    getRewardKeyMappings,
    getAssetKeyMappings,
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
    const rewardKeyMappings = getRewardKeyMappings()
    const assetKeyMappings = getAssetKeyMappings()

    // ENHANCED DEBUG: Log rewards mapping details
    // if (process.env.NODE_ENV === 'development') {
    //     console.log('🎯 REWARDS DEBUG: Key mappings config:')
    //     console.log('  - rewards key:', platformKeyMappings.rewards)
    //     console.log('  - additional_rewards key:', platformKeyMappings.additional_rewards)
    //     console.log('  - reward supply_apy key:', rewardKeyMappings.supply_apy)
    //     console.log('  - reward borrow_apy key:', rewardKeyMappings.borrow_apy)
    //     console.log('  - reward asset key:', rewardKeyMappings.asset)
        
    //     // Sample first item to inspect rewards structure
    //     if (apiResponse.length > 0) {
    //         const sampleItem = apiResponse[0]
    //         const platformData = sampleItem[keyMappings.platform as string]
    //         const rewardsData = platformData?.[platformKeyMappings.rewards as string]
    //         const additionalRewards = platformData?.[platformKeyMappings.additional_rewards as string]
            
    //         console.log('🎯 REWARDS DEBUG: Sample platform data keys:', Object.keys(platformData || {}))
    //         console.log('🎯 REWARDS DEBUG: Raw rewards data:', rewardsData)
    //         console.log('🎯 REWARDS DEBUG: Additional rewards flag:', additionalRewards)
    //         console.log('🎯 REWARDS DEBUG: Is rewards data array?', Array.isArray(rewardsData))
    //         console.log('🎯 REWARDS DEBUG: Rewards data length:', rewardsData?.length)
            
    //         if (rewardsData && rewardsData.length > 0) {
    //             console.log('🎯 REWARDS DEBUG: First reward structure:', rewardsData[0])
    //             console.log('🎯 REWARDS DEBUG: First reward keys:', Object.keys(rewardsData[0] || {}))
    //         }
    //     }
    // }

    return apiResponse.map((item, index) => {
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

        // ENHANCED REWARDS MAPPING - handle potential structure changes
        const rewardsData = platformData?.[platformKeyMappings.rewards as string] || []
        
        // Debug specific item rewards
        if (process.env.NODE_ENV === 'development' && index < 3) {
            console.log(`🎯 REWARDS DEBUG [Item ${index}]: Raw rewards for ${mappedToken.symbol}:`, rewardsData)
        }
        
        const mappedRewards = Array.isArray(rewardsData) ? rewardsData.map((reward: any, rewardIndex: number) => {
            // Enhanced debug logging for reward structure
            if (process.env.NODE_ENV === 'development' && index < 3) {
                console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Raw reward:`, reward)
                console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Reward keys:`, Object.keys(reward || {}))
            }
            
            // If the reward structure is different in dev API, handle it here
            if (reward && typeof reward === 'object') {
                // Get the asset data using environment-specific key mappings
                const rawAssetData = reward[rewardKeyMappings.asset as string]
                
                // Map asset data with proper key mappings
                const mappedAsset = rawAssetData ? {
                    address: rawAssetData[assetKeyMappings.address as string] || '',
                    symbol: rawAssetData[assetKeyMappings.symbol as string] || '',
                    name: rawAssetData[assetKeyMappings.name as string] || '',
                    logo: rawAssetData[assetKeyMappings.logo as string] || '',
                    decimals: rawAssetData[assetKeyMappings.decimals as string] || 0,
                    price_usd: rawAssetData[assetKeyMappings.price_usd as string] || 0,
                } : {
                    // Fallback: try to construct from reward properties directly (backwards compatibility)
                    address: reward.addr || reward.address || reward.a || '',
                    symbol: reward.symbol || reward.s || '',
                    name: reward.name || reward.n || '',
                    logo: reward.logo || reward.l || '',
                    decimals: reward.decimals || reward.d || 0,
                    price_usd: reward.price_usd || reward.p || 0,
                }
                
                // Map the complete reward structure using environment-specific keys
                const mappedReward = {
                    supply_apy: reward[rewardKeyMappings.supply_apy as string] || 0,
                    borrow_apy: reward[rewardKeyMappings.borrow_apy as string] || 0,
                    asset: mappedAsset
                }
                
                // Debug the mapped reward
                if (process.env.NODE_ENV === 'development' && index < 3) {
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Mapped reward:`, mappedReward)
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Asset details:`, mappedReward.asset)
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Supply APY:`, mappedReward.supply_apy)
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Borrow APY:`, mappedReward.borrow_apy)
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Raw reward value at '${rewardKeyMappings.supply_apy}':`, reward[rewardKeyMappings.supply_apy as string])
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Raw reward value at 's':`, reward.s)
                    console.log(`🎯 REWARDS DEBUG [Item ${index}, Reward ${rewardIndex}]: Raw reward keys available:`, Object.keys(reward))
                }
                
                return mappedReward
            }
            return reward
        }) : []

        // Debug final mapped rewards
        // if (process.env.NODE_ENV === 'development' && index < 3) {
        //     console.log(`🎯 REWARDS DEBUG [Item ${index}]: Final mapped rewards for ${mappedToken.symbol}:`, mappedRewards)
        //     console.log(`🎯 REWARDS DEBUG [Item ${index}]: Mapped rewards length:`, mappedRewards.length)
        // }

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
