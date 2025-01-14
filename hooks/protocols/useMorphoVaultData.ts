import { useVault } from '@morpho-org/blue-sdk-wagmi'
import { useQuery } from '@tanstack/react-query'

export const useMorphoVaultData = () => {
    return {
        getVaultData,
    }
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
