export type Asset = {
    address: string
    decimals: bigint
    symbol: string
    priceUsd: number
}

export type MetaMorphoAPIData = {
    symbol: string
    name: string
    address: string
    asset: Asset
    metadata: { curators: { name: string }[] }
    state: {
        totalAssets: number
        apy: number
        netApy: number
        fee: number
        allocation: {
            market: {
                uniqueKey: string
                loanAsset: {
                    address: string
                }
                collateralAsset: {
                    address: string
                }
                oracleAddress: string
                irmAddress: string
                lltv: number
                state: {
                    liquidityAssetsUsd: number
                }
            }
            supplyAssets: number
            supplyCap: number
        }[]
    }
}
