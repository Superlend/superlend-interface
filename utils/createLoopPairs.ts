import { TOpportunity, TOpportunityTable } from '@/types'
import { TPlatform } from '@/types/platform'
import { TChain } from '@/types/chain'

export type TLoopPair = TOpportunityTable & {
    borrowToken: {
        address: string
        symbol: string
        name: string
        logo: string
        decimals: number
        price_usd: number
    }
    pairId: string
    maxAPY: number // Interim: using lend APY as placeholder
}

export function createLoopPairs(
    lendOpportunities: TOpportunity[],
    platformData: TPlatform | null,
    allChainsData: TChain[]
): TLoopPair[] {
    if (!platformData?.assets || !lendOpportunities.length) {
        return []
    }

    const pairs: TLoopPair[] = []
    
    // Get borrowable tokens from platform data
    const borrowableTokens = platformData.assets.filter(asset => asset.borrow_enabled)
    
    lendOpportunities.forEach(item => {
        // Transform TOpportunity to TOpportunityTable format (copied from top-apy-opportunities.tsx)
        const liquidityInUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
        const borrowsInUSD = Number(item.platform.borrows) * Number(item.token.price_usd)
        
        const lendOpp: TOpportunityTable = {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: allChainsData?.filter(
                (chain: TChain) => chain.chain_id === Number(item.chain_id)
            )[0]?.logo || '',
            chain_id: item.chain_id,
            chainName:
                allChainsData.find(
                    (chain: any) =>
                        Number(chain.chain_id) === Number(item.chain_id)
                )?.name || '',
            protocol_identifier: item.platform.protocol_identifier,
            platformName: `${item.platform.platform_name.split('-')[0]}`,
            platformWithMarketName: `${item.platform.name}`,
            platformId: `${item.platform.platform_name}`,
            platformLogo: item.platform.logo,
            apy_current: item.platform.apy.current,
            apy_avg_7days: item.platform.apy.avg_7days,
            max_ltv: item.platform.max_ltv,
            deposits: `${liquidityInUSD}`,
            borrows: `${borrowsInUSD}`,
            utilization: item.platform.utilization_rate,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
            isVault: item.platform.isVault || false,
            collateral_exposure: item.platform.collateral_exposure,
            collateral_tokens: item.platform.collateral_tokens,
            available_liquidity: liquidityInUSD - borrowsInUSD,
            apple_farm_apr: 0, // TODO: Add apple farm logic if needed
            has_apple_farm_rewards: false, // TODO: Add apple farm logic if needed
        }

        borrowableTokens.forEach(borrowAsset => {
            // Validation: Avoid same token pairs (e.g., USDC → USDC)
            if (lendOpp.tokenAddress.toLowerCase() === borrowAsset.token.address.toLowerCase()) {
                return
            }
            
            // Create pair object
            const pair: TLoopPair = {
                ...lendOpp,
                borrowToken: {
                    address: borrowAsset.token.address,
                    symbol: borrowAsset.token.symbol,
                    name: borrowAsset.token.name,
                    logo: borrowAsset.token.logo,
                    decimals: borrowAsset.token.decimals,
                    price_usd: borrowAsset.token.price_usd
                },
                pairId: `${lendOpp.tokenSymbol.toLowerCase()}_${borrowAsset.token.symbol.toLowerCase()}`,
                // TODO: Replace with actual Max APY calculation
                // Interim: Using lend token APY as placeholder
                maxAPY: Number(lendOpp.apy_current)
            }
            
            pairs.push(pair)
        })
    })
    
    // Sort by Max APY (descending)
    return pairs.sort((a, b) => b.maxAPY - a.maxAPY)
} 