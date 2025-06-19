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
    const isBorrowableToken = (tokenAddress: string) => borrowableTokens.some(asset => asset.token.address.toLowerCase() === tokenAddress.toLowerCase())

    lendOpportunities.forEach(item => {
        if (!isBorrowableToken(item.token.address)) return;
        console.log('item in createLoopPairs', item)   
        // {
        //     "token": {
        //         "address": "0x2c03058c8afc06713be23e58d2febc8337dbfe6a",
        //         "name": "Tether USD",
        //         "symbol": "USDT",
        //         "decimals": 6,
        //         "logo": "https://superlend-public-assets.s3.ap-south-1.amazonaws.com/42793-usdt.svg",
        //         "price_usd": 1.00002748,
        //         "coin_gecko_id": "layerzero-bridged-usdt-etherlink"
        //     },
        //     "chain_id": 42793,
        //     "platform": {
        //         "name": "Superlend",
        //         "protocol_identifier": "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf",
        //         "platform_name": "SUPERLEND-ETHERLINK",
        //         "core_contract": "0x3bd16d195786fb2f509f2e2d7f69920262ef114d",
        //         "logo": "https://superlend-public-assets.s3.ap-south-1.amazonaws.com/superlend.svg",
        //         "additional_rewards": false,
        //         "max_ltv": 75,
        //         "liquidity": "16794074.086307",
        //         "borrows": "15108024.821267",
        //         "utilization_rate": 89.96,
        //         "protocol_type": "aaveV3",
        //         "collateral_exposure": [
        //             "0xbfc94cd2b1e55999cfc7347a9313e88702b83d0f",
        //             "0xfc24f770f94edbca6d6f885e12d4317320bcb401",
        //             "0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab",
        //             "0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9"
        //         ],
        //         "apy": {
        //             "current": 4.8325397190042585,
        //             "avg_7days": 6.104875723764036
        //         }
        //     }
        // }
        // Transform TOpportunity to TOpportunityTable format (copied from top-apy-opportunities.tsx)
        const liquidityInUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
        const borrowsInUSD = Number(item.platform.borrows) * Number(item.token.price_usd)
        const availableLiquidity = liquidityInUSD - borrowsInUSD

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
            available_liquidity: availableLiquidity,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
            isVault: item.platform.isVault || false,
            collateral_exposure: item.platform.collateral_exposure,
            collateral_tokens: item.platform.collateral_tokens,
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