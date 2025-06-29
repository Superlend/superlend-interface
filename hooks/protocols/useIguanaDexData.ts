import { ChainId, ERC20Token, TradeType, WETH9, WXTZ } from '@iguanadex/sdk'
import { USDC, USDT, WBTC } from '@iguanadex/tokens'
import { SmartRouter } from '@iguanadex/smart-router'
import { CurrencyAmount } from '@iguanadex/sdk'
import { useEffect, useState } from 'react'
import { Chain, http } from 'viem'
import { PublicClient } from 'viem'
import { Transport } from 'wagmi'
import { createPublicClient } from 'viem'
import { etherlink } from 'viem/chains'
import { GraphQLClient } from 'graphql-request'
import CREDIT_DELEGATION_ABI from '../../data/abi/creditDelegationABI.json'
import LOOPING_LEVERAGE_ABI from '../../data/abi/loopingLeverageABI.json'

const nodeUrl =
    'https://plend-etherlink-mainnet-djs2w.zeeve.net/TuychDxGCScIED1nCk0m/rpc'

const IguanaSubgraphV2 =
    'https://api.studio.thegraph.com/query/69431/exchange-v2-etherlink/version/latest'
const IguanaSubgraphV3 =
    'https://api.studio.thegraph.com/query/69431/exchange-v3-etherlink/version/latest'

// @Shreyas: Missing tokens
const EtherlinkTokens: Record<string, ERC20Token> = {
    '0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab': WXTZ[ChainId.ETHERLINK],
    '0x2c03058c8afc06713be23e58d2febc8337dbfe6a': USDT[ChainId.ETHERLINK],
    '0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9': USDC[ChainId.ETHERLINK],
    '0xfc24f770f94edbca6d6f885e12d4317320bcb401': WETH9[ChainId.ETHERLINK],
    '0xbfc94cd2b1e55999cfc7347a9313e88702b83d0f': WBTC[ChainId.ETHERLINK],
    '0xdd629e5241cbc5919847783e6c96b2de4754e438': new ERC20Token(
                                                    ChainId.ETHERLINK, 
                                                    '0xdd629e5241cbc5919847783e6c96b2de4754e438', 
                                                    18, 
                                                    'mTBILL', 
                                                    'Midas US Treasury Bill Token'),
    '0x2247b5a46bb79421a314ab0f0b67ffd11dd37ee4': new ERC20Token(
                                                    ChainId.ETHERLINK, 
                                                    '0x2247b5a46bb79421a314ab0f0b67ffd11dd37ee4', 
                                                    18, 
                                                    'mBASIS', 
                                                    'Midas Basis Trading Token'),
}

const DEBT_TOKENS: Record<string, string> = {}

export const useIguanaDexData = () => {
    const [viemClient, setViemClient] = useState<PublicClient<
        Transport,
        Chain
    > | null>(null)
    const [iguanaSubgraphClientV2, setIguanaSubgraphClientV2] =
        useState<GraphQLClient | null>(null)
    const [iguanaSubgraphClientV3, setIguanaSubgraphClientV3] =
        useState<GraphQLClient | null>(null)

    /**
     * Calculates optimal trading path for token swap using IguanaDEX
     * @param fromTokenAddress Source token address
     * @param toTokenAddress Target token address
     * @param amountToSell Amount of source token to swap
     * @returns Best trading route with minimal price impact
     *
     * Considers both V2 and V3 liquidity pools to find:
     * - Best price execution
     * - Optimal routing through multiple pools
     * - Gas costs for different paths
     */
    const getTradePath = async (
        fromTokenAddress: string,
        toTokenAddress: string,
        amountToSell: string
    ) => {
        if (!viemClient || !iguanaSubgraphClientV2 || !iguanaSubgraphClientV3)
            return null
        try {
            const swapFrom = EtherlinkTokens[fromTokenAddress]
            const swapTo = EtherlinkTokens[toTokenAddress]

            const quoteProvider = SmartRouter.createQuoteProvider({
                onChainProvider: () => viemClient as any,
            })
            const amount = CurrencyAmount.fromRawAmount(swapFrom, amountToSell)

            console.log('IGUANA DEX: amount', amount, "swapFrom", swapFrom, "swapTo", swapTo)

            const [v2Pools, v3Pools] = await Promise.all([
                SmartRouter.getV2CandidatePools({
                    onChainProvider: () => viemClient as any,
                    v2SubgraphProvider: () => iguanaSubgraphClientV2 as any,
                    v3SubgraphProvider: () => iguanaSubgraphClientV3 as any,
                    currencyA: amount.currency,
                    currencyB: swapTo,
                }),
                SmartRouter.getV3CandidatePools({
                    onChainProvider: () => viemClient as any,
                    subgraphProvider: () => iguanaSubgraphClientV3 as any,
                    currencyA: amount.currency,
                    currencyB: swapTo,
                    subgraphFallback: false,
                }),
            ])

            console.log('IGUANA DEX: v2Pools', v2Pools)
            console.log('IGUANA DEX: v3Pools', v3Pools)


            const pools = [...v2Pools, ...v3Pools]
            const trade = await SmartRouter.getBestTrade(
                amount,
                swapTo,
                TradeType.EXACT_INPUT,
                {
                    gasPriceWei: () => viemClient.getGasPrice(),
                    maxHops: 3,
                    maxSplits: 1,
                    poolProvider: SmartRouter.createStaticPoolProvider(pools),
                    quoteProvider,
                    quoterOptimization: true,
                }
            )

            return trade
        } catch (error) {
            console.error(error)
        }
    }

    const loopingApproval = async (assetAddress: string, amount: string) => {
        const loopingLeverageScAddress = ''
        // writeContractAsync({
        //     address: underlyingAssetAdress,
        //     abi: AAVE_APPROVE_ABI,
        //     functionName: 'approve',
        //     args: [loopingLeverageScAddress, amount],
        // }).catch((error) => {
        //     setLendTx((prev: TLendTx) => ({
        //         ...prev,
        //         isPending: false,
        //         isConfirming: false,
        //     }))
        // })
    }

    const delegationCallApproval = async (borrowTokenAddress: string) => {
        const loopingLeverageScAddress = ''
        const debtToken = DEBT_TOKENS[borrowTokenAddress]

        // writeContractAsync({
        //     address: debtToken,
        //     abi: CREDIT_DELEGATION_ABI,
        //     functionName: 'approveDelegation',
        //     args: [loopingLeverageScAddress, uint256_MAX],
        // }).catch((error) => {
        //     setLendTx((prev: TLendTx) => ({
        //         ...prev,
        //         isPending: false,
        //         isConfirming: false,
        //     }))
        // })
    }

    const loopingCall = async (
        supplyToken: string,
        borrowToken: string,
        supplyAmount: string,
        flashLoanAmount: string,
        pathTokens: string[],
        pathFees: string[]
    ) => {
        const loopingLeverageScAddress = ''
        // writeContractAsync({
        //     address: loopingLeverageScAddress,
        //     abi: LOOPING_LEVERAGE_ABI,
        //     functionName: 'loop',
        //     args: [supplyToken, borrowToken, supplyAmount, flashLoanAmount, pathTokens, pathFees],
        // }).catch((error) => {
        //     setLendTx((prev: TLendTx) => ({
        //         ...prev,
        //         isPending: false,
        //         isConfirming: false,
        //     }))
        // })
    }

    useEffect(() => {
        if (!viemClient) {
            const _viemClient = createPublicClient({
                chain: etherlink,
                transport: http(nodeUrl),
                batch: {
                    multicall: {
                        batchSize: 1024 * 200,
                    },
                },
            })
            setViemClient(_viemClient)
        }
        if (!iguanaSubgraphClientV2) {
            const _iguanaSubgraphClientV2 = new GraphQLClient(IguanaSubgraphV2)
            setIguanaSubgraphClientV2(_iguanaSubgraphClientV2)
        }
        if (!iguanaSubgraphClientV3) {
            const _iguanaSubgraphClientV3 = new GraphQLClient(IguanaSubgraphV3)
            setIguanaSubgraphClientV3(_iguanaSubgraphClientV3)
        }
    }, [viemClient, iguanaSubgraphClientV2, iguanaSubgraphClientV3])

    return {
        getTradePath,
    }
}
