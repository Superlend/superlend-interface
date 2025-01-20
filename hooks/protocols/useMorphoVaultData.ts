import { Market, MarketId } from '@morpho-org/blue-sdk'
import { useMarket, usePosition, usePositions, useVault } from '@morpho-org/blue-sdk-wagmi'
import { useQuery } from '@tanstack/react-query'
import { Position } from 'postcss'

export const useMorphoVaultData = () => {
    return {
        getMarketData,
        getVaultData,
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

    if (!enabled) return null
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
    if (!enabled) return null
    const { data: vaultData } = useVault({
        vault: vaultId as `0x${string}`,
        chainId: Number(chainId),
        query: {
            enabled,
        },
    })
    return vaultData
}
