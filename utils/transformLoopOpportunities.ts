import { TLoopOpportunityResponse, TOpportunityTable } from '@/types'
import { TChain } from '@/types/chain'
import { TLoopPair } from './createLoopPairs'

export function transformLoopOpportunities(
    loopOpportunities: TLoopOpportunityResponse[],
    allChainsData: TChain[]
): TLoopPair[] {
    if (!loopOpportunities.length || !allChainsData.length) {
        return []
    }

    return loopOpportunities.map((opportunity) => {
        const { platform, lendReserve, borrowReserve, strategy } = opportunity
        
        const liquidityInUSD = Number(lendReserve.liquidity) * lendReserve.token.price_usd
        const borrowsInUSD = Number(lendReserve.borrows) * lendReserve.token.price_usd
        const availableLiquidity = liquidityInUSD - borrowsInUSD
        
        const borrowTokenAvailableLiquidity = Number(borrowReserve.liquidity) * borrowReserve.token.price_usd - Number(borrowReserve.borrows) * borrowReserve.token.price_usd

        const chainId = extractChainId(platform.platform_name)
        const chainInfo = allChainsData.find((chain: TChain) => chain.chain_id === chainId)

        // Calculate Apple Farm rewards from API rewards data
        const appleFarmRewards = lendReserve.rewards?.filter(reward => 
            reward.asset.symbol === 'APPL' || reward.asset.name.toLowerCase().includes('apple')
        ) || []
        const appleFarmAPR = appleFarmRewards.reduce((total, reward) => total + reward.supply_apy, 0)

        const baseOpportunity: TOpportunityTable = {
            tokenAddress: lendReserve.token.address,
            tokenSymbol: lendReserve.token.symbol,
            tokenName: lendReserve.token.name,
            tokenLogo: lendReserve.token.logo,
            chainLogo: chainInfo?.logo || '',
            chain_id: chainId,
            chainName: chainInfo?.name || '',
            protocol_identifier: platform.protocol_identifier,
            platformName: platform.name,
            platformWithMarketName: platform.name,
            platformId: platform.platform_name,
            platformLogo: platform.logo,
            apy_current: lendReserve.apy.current.toString(),
            apy_avg_7days: lendReserve.apy.avg_7days.toString(),
            max_ltv: lendReserve.max_ltv,
            deposits: liquidityInUSD.toString(),
            borrows: borrowsInUSD.toString(),
            utilization: lendReserve.utilization_rate.toString(),
            additional_rewards: Boolean(lendReserve.rewards?.length),
            rewards: lendReserve.rewards?.map(reward => ({
                supply_apy: reward.supply_apy,
                borrow_apy: reward.borrow_apy,
                asset: {
                    symbol: reward.asset.symbol,
                    name: reward.asset.name,
                    address: reward.asset.address as `0x${string}`,
                    decimals: reward.asset.decimals,
                    logo: reward.asset.logo,
                    price_usd: reward.asset.price_usd
                }
            })) || [],
            isVault: false,
            collateral_exposure: undefined,
            collateral_tokens: undefined,
            available_liquidity: borrowTokenAvailableLiquidity,
            apple_farm_apr: appleFarmAPR,
            has_apple_farm_rewards: appleFarmAPR > 0,
            positionType: 'loop'
        }

        const loopPair: TLoopPair = {
            ...baseOpportunity,
            borrowToken: {
                address: borrowReserve.token.address,
                symbol: borrowReserve.token.symbol,
                name: borrowReserve.token.name,
                logo: borrowReserve.token.logo,
                decimals: borrowReserve.token.decimals,
                price_usd: borrowReserve.token.price_usd
            },
            pairId: `${lendReserve.token.symbol.toLowerCase()}_${borrowReserve.token.symbol.toLowerCase()}`,
            maxAPY: strategy.max_apy.current,
            lendReserve,
            borrowReserve,
            strategy,
            emode_category: lendReserve.emode_category
        }

        return loopPair
    })
}

function extractChainId(platformName: string): number {
    if (platformName.includes('ETHERLINK')) return 42793
    if (platformName.includes('POLYGON')) return 137
    if (platformName.includes('ETHEREUM')) return 1
    if (platformName.includes('BASE')) return 8453
    if (platformName.includes('ARBITRUM')) return 42161
    if (platformName.includes('OPTIMISM')) return 10
    return 1
} 