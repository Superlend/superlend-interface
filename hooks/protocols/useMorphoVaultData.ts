import { MarketId, Vault } from '@morpho-org/blue-sdk'
import { useMarket, usePosition, useVault } from '@morpho-org/blue-sdk-wagmi'
import { TPlatform } from '../../types'
import { ContractCallContext } from 'ethereum-multicall'
import VaultABI from '@/data/abi/erc4626ABI.json'
import { useEthersMulticall } from '../useEthereumMulticall'
import { BigNumber } from 'ethers'
import { Multicall } from 'ethereum-multicall'
import { MORPHO_BLUE_API_CHAINIDS } from '@/lib/constants'

export const useMorphoVaultData = () => {
    const { ethMulticall } = useEthersMulticall()

    async function getVaultDataFromPlatformData({
        platformData,
        multicall,
    }: {
        platformData: TPlatform
        multicall?: Multicall
    }): Promise<Vault> {
        try {
            const chainId = platformData?.platform?.chain_id

            const reference = 'vault-data'
            const calls: ContractCallContext[] = []
            calls.push({
                reference,
                contractAddress: platformData.platform.core_contract,
                abi: VaultABI,
                calls: [
                    {
                        reference: 'totalAssets',
                        methodName: 'totalAssets',
                        methodParameters: [],
                    },
                    {
                        reference: 'totalSupply',
                        methodName: 'totalSupply',
                        methodParameters: [],
                    },
                    {
                        reference: 'decimals',
                        methodName: 'DECIMALS_OFFSET',
                        methodParameters: [],
                    },
                ],
            })

            const multicallResult = await ethMulticall(
                calls,
                Number(chainId),
                multicall
            )
            const totalAssets = BigNumber.from(
                multicallResult.results[reference]?.callsReturnContext[0]
                    .returnValues[0]
            )
            const totalSupply = BigNumber.from(
                multicallResult.results[reference]?.callsReturnContext[1]
                    .returnValues[0]
            )
            const decimals = BigNumber.from(
                multicallResult.results[reference]?.callsReturnContext[2]
                    .returnValues[0]
            )

            return createVaultInstance(
                platformData?.assets[0]?.token?.address as `0x${string}`,
                platformData?.platform?.core_contract as `0x${string}`,
                totalAssets.toBigInt(),
                totalSupply.toBigInt(),
                decimals.toBigInt()
            )
        } catch (error) {
            console.error(error)
            return createVaultInstance(
                platformData?.assets[0]?.token?.address as `0x${string}`,
                platformData?.platform?.core_contract as `0x${string}`,
                BigInt(0),
                BigInt(0),
                BigInt(18)
            )
        }
    }

    function getMarketData({
        marketId,
        chainId,
        enabled,
        walletAddress,
    }: {
        marketId: MarketId
        chainId: number
        enabled: boolean
        walletAddress: `0x${string}`
    }) {
        const isSupported = MORPHO_BLUE_API_CHAINIDS.includes(chainId)
        if (!isSupported) {
            return { marketData: null, position: null }
        }

        const { data: marketData } = useMarket({
            marketId,
            chainId,
            query: {
                enabled,
            },
        })

        const { data: position } = usePosition({
            marketId,
            user: walletAddress,
            chainId: Number(chainId),
            query: {
                enabled,
            },
        })

        return { marketData, position }
    }

    function getVaultData({
        vaultId,
        chainId,
        enabled,
    }: {
        vaultId: `0x${string}`
        chainId: number
        enabled: boolean
    }) {
        const isSupported = MORPHO_BLUE_API_CHAINIDS.includes(chainId)
        if (!isSupported) {
            return undefined
        }

        const { data: vaultData } = useVault({
            vault: vaultId as `0x${string}`,
            chainId: Number(chainId),
            query: {
                enabled,
            },
        })
        return vaultData
    }

    return {
        getMarketData,
        getVaultData,
        getVaultDataFromPlatformData,
    }
}

function createVaultInstance(
    asset: string,
    address: string,
    totalAssets: bigint,
    totalSupply: bigint,
    decimalOffset: bigint
) {
    return new Vault({
        asset: asset as `0x${string}`,
        address: address as `0x${string}`,
        decimalsOffset: decimalOffset,
        totalAssets: totalAssets,
        totalSupply: totalSupply,
        curator: '0x' as `0x${string}`,
        owner: '0x' as `0x${string}`,
        guardian: '0x' as `0x${string}`,
        fee: BigInt(0),
        feeRecipient: '0x' as `0x${string}`,
        skimRecipient: '0x' as `0x${string}`,
        pendingTimelock: { value: BigInt(0), validAt: BigInt(0) },
        pendingGuardian: { value: '0x' as `0x${string}`, validAt: BigInt(0) },
        pendingOwner: '0x' as `0x${string}`,
        timelock: BigInt(0),
        supplyQueue: [] as MarketId[],
        withdrawQueue: [] as MarketId[],
        lastTotalAssets: BigInt(0),
        symbol: '',
        name: '',
    })
}
