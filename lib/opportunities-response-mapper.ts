import { TOpportunity, TOpportunityAbbreviated, TReward, TRewardAbbreviated } from '@/types'

/**
 * Maps abbreviated reward format to full TReward format
 */
function mapRewardFromAbbreviated(abbreviated: TRewardAbbreviated): TReward {
    return {
        supply_apy: abbreviated.s,
        borrow_apy: abbreviated.b,
        asset: {
            symbol: abbreviated.a.s,
            name: abbreviated.a.n,
            address: abbreviated.a.a as `0x${string}`,
            decimals: abbreviated.a.d,
            logo: abbreviated.a.l,
            price_usd: abbreviated.a.p,
        }
    }
}

/**
 * Maps abbreviated opportunity format to full TOpportunity format
 */
export function mapOpportunityFromAbbreviated(abbreviated: TOpportunityAbbreviated): TOpportunity {
    try {
        return {
            token: {
                address: abbreviated.t.a,
                name: abbreviated.t.n,
                symbol: abbreviated.t.s,
                decimals: abbreviated.t.d,
                logo: abbreviated.t.l,
                price_usd: abbreviated.t.p,
                coin_gecko_id: abbreviated.t.c,
            },
            chain_id: abbreviated.c,
            platform: {
                name: abbreviated.p.n,
                protocol_identifier: abbreviated.p.pi,
                platform_name: abbreviated.p.pn,
                core_contract: abbreviated.p.cc,
                logo: abbreviated.p.l,
                additional_rewards: abbreviated.p.ar,
                max_ltv: abbreviated.p.ml,
                liquidity: abbreviated.p.li,
                borrows: abbreviated.p.bo,
                collateral_token_price: abbreviated.p.cp,
                utilization_rate: abbreviated.p.ur,
                protocol_type: abbreviated.p.pt,
                collateral_tokens: abbreviated.p.ct,
                collateral_exposure: abbreviated.p.ce,
                morpho_market_id: abbreviated.p.mi,
                isVault: abbreviated.p.iv,
                apy: {
                    current: abbreviated.p.ap.c,
                    avg_7days: abbreviated.p.ap.a,
                },
                rewards: (abbreviated.p.r || []).map(mapRewardFromAbbreviated),
            },
        }
    } catch (error) {
        console.error('❌ Opportunity mapping error for token:', abbreviated.t?.s || 'Unknown')
        console.error('Error details:', error)
        console.error('Input structure:', {
            hasToken: !!abbreviated.t,
            hasPlatform: !!abbreviated.p,
            hasChainId: !!abbreviated.c,
            tokenSymbol: abbreviated.t?.s
        })
        throw error
    }
}

/**
 * Maps array of abbreviated opportunities to full TOpportunity format
 */
export function mapOpportunitiesFromAbbreviated(abbreviated: TOpportunityAbbreviated[]): TOpportunity[] {
    return abbreviated.map(mapOpportunityFromAbbreviated)
}

/**
 * Type guard to check if response is in abbreviated format
 */
export function isAbbreviatedResponse(response: any): response is TOpportunityAbbreviated[] {
    if (!Array.isArray(response) || response.length === 0) {
        return false
    }
    
    const firstItem = response[0]
    return (
        typeof firstItem === 'object' &&
        firstItem !== null &&
        't' in firstItem &&
        'c' in firstItem &&
        'p' in firstItem &&
        typeof firstItem.t === 'object' &&
        typeof firstItem.p === 'object' &&
        'a' in firstItem.t &&
        'n' in firstItem.t &&
        's' in firstItem.t &&
        'pi' in firstItem.p &&
        'pn' in firstItem.p
    )
}

/**
 * Automatically detects response format and maps to TOpportunity[] if needed
 */
export function normalizeOpportunitiesResponse(response: any): TOpportunity[] {
    if (!Array.isArray(response)) {
        return []
    }
    
    if (isAbbreviatedResponse(response)) {
        return mapOpportunitiesFromAbbreviated(response)
    }
    
    // Already in full format
    return response as TOpportunity[]
} 