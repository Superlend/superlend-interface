import { useEthersMulticall, OptimizedMulticall } from '../useEthereumMulticall'
import { TPlatform } from '../../types'
import { Market, MarketId, MarketParams, Position } from '@morpho-org/blue-sdk'
import { ContractCallContext } from 'ethereum-multicall'
import MorphoMarketABI from '@/data/abi/morphoMarketABI.json'
import MorphoOracleABI from '@/data/abi/morphoOracleABI.json'
import MorphoIRMABI from '@/data/abi/morphoIRMABI.json'
import { BigNumber } from 'ethers'
import { zeroAddress } from 'viem'

export const useMorphoMarketData = () => {
    const { ethMulticall } = useEthersMulticall()

    const getMarketDataFromPlatformData = async (
        platformData: TPlatform,
        multicall?: OptimizedMulticall
    ): Promise<Market> => {
        try {
            const chainId = platformData?.platform?.chain_id
            const marketId = platformData?.platform?.morpho_market_id
            const reference = 'market-data'
            let calls: ContractCallContext[] = []
            calls.push({
                reference: reference,
                contractAddress: platformData?.platform?.core_contract,
                abi: MorphoMarketABI,
                calls: [
                    {
                        reference: 'marketParams',
                        methodName: 'idToMarketParams',
                        methodParameters: [marketId],
                    },
                    {
                        reference: 'market',
                        methodName: 'market',
                        methodParameters: [marketId],
                    },
                ],
            })

            const multicallResult = await ethMulticall(
                calls,
                Number(chainId),
                multicall
            )
            const marketParams =
                multicallResult.results[reference]?.callsReturnContext[0]
                    .returnValues
            const market =
                multicallResult.results[reference]?.callsReturnContext[1]
                    .returnValues
            const loanAsset = marketParams[0]
            const collateralAsset = marketParams[1]
            const oracle = marketParams[2]
            const irm = marketParams[3]
            const lltv = BigNumber.from(marketParams[4]).toBigInt()

            const totalSupplyAssets = BigNumber.from(market[0]).toBigInt()
            const totalSupplyShares = BigNumber.from(market[1]).toBigInt()
            const totalBorrowAssets = BigNumber.from(market[2]).toBigInt()
            const totalBorrowShares = BigNumber.from(market[3]).toBigInt()
            const lastUpdate = BigNumber.from(market[4]).toBigInt()
            const fee = BigNumber.from(market[5]).toBigInt()

            calls = []
            const oracleReference = 'oracle'
            const irmReference = 'irm'
            calls.push(
                {
                    reference: oracleReference,
                    contractAddress: oracle,
                    abi: MorphoOracleABI,
                    calls: [
                        {
                            reference: 'oracle',
                            methodName: 'price',
                            methodParameters: [],
                        },
                    ],
                },
                {
                    reference: irmReference,
                    contractAddress: irm,
                    abi: MorphoIRMABI,
                    calls: [
                        {
                            reference: 'irm',
                            methodName: 'rateAtTarget',
                            methodParameters: [marketId],
                        },
                    ],
                }
            )
            const multicallResultOracleIRM = await ethMulticall(
                calls,
                Number(chainId),
                multicall
            )
            const price = BigNumber.from(
                multicallResultOracleIRM.results[oracleReference]
                    ?.callsReturnContext[0].returnValues[0]
            ).toBigInt()
            const rateAtTarget = BigNumber.from(
                multicallResultOracleIRM.results[irmReference]
                    ?.callsReturnContext[0].returnValues[0]
            ).toBigInt()

            return createMarketInstance(
                new MarketParams({
                    loanToken: loanAsset,
                    collateralToken: collateralAsset,
                    oracle,
                    irm,
                    lltv,
                }),
                totalSupplyAssets,
                totalBorrowAssets,
                totalSupplyShares,
                totalBorrowShares,
                lastUpdate,
                fee,
                price,
                rateAtTarget
            )
        } catch (error) {
            console.error(error)
            return createMarketInstance(
                new MarketParams({
                    loanToken: zeroAddress,
                    collateralToken: zeroAddress,
                    oracle: zeroAddress,
                    irm: zeroAddress,
                    lltv: BigInt(0),
                }),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0)
            )
        }
    }

    const getPositionDataFromPlatformData = async (
        platformData: TPlatform,
        walletAddress: `0x${string}`,
        multicall?: OptimizedMulticall
    ): Promise<Position> => {
        const marketId = platformData?.platform?.morpho_market_id
        try {
            const chainId = platformData?.platform?.chain_id

            const reference = 'position-data'
            const calls: ContractCallContext[] = []
            calls.push({
                reference: reference,
                contractAddress: platformData?.platform?.core_contract,
                abi: MorphoMarketABI,
                calls: [
                    {
                        reference: 'position',
                        methodName: 'position',
                        methodParameters: [marketId, walletAddress],
                    },
                ],
            })

            const multicallResult = await ethMulticall(
                calls,
                Number(chainId),
                multicall
            )

            const position =
                multicallResult.results[reference]?.callsReturnContext[0]
                    .returnValues
            const supplyShares = BigNumber.from(position[0]).toBigInt()
            const borrowShares = BigNumber.from(position[1]).toBigInt()
            const collateral = BigNumber.from(position[2]).toBigInt()

            return createPositionInstance(
                supplyShares,
                borrowShares,
                collateral,
                walletAddress,
                marketId as MarketId
            )
        } catch (error) {
            console.error(error)
            return createPositionInstance(
                BigInt(0),
                BigInt(0),
                BigInt(0),
                walletAddress,
                marketId as MarketId
            )
        }
    }

    return {
        getMarketDataFromPlatformData,
        getPositionDataFromPlatformData,
    }
}

function createMarketInstance(
    params: MarketParams,
    totalSupplyAssets: bigint,
    totalBorrowAssets: bigint,
    totalSupplyShares: bigint,
    totalBorrowShares: bigint,
    lastUpdate: bigint,
    fee: bigint,
    price: bigint,
    rateAtTarget: bigint
) {
    return new Market({
        params,
        totalSupplyAssets,
        totalBorrowAssets,
        totalSupplyShares,
        totalBorrowShares,
        lastUpdate,
        fee,
        price,
        rateAtTarget,
    })
}

function createPositionInstance(
    supplyShares: bigint,
    borrowShares: bigint,
    collateral: bigint,
    user: `0x${string}`,
    marketId: MarketId
) {
    return new Position({
        supplyShares,
        borrowShares,
        collateral,
        user,
        marketId,
    })
}
