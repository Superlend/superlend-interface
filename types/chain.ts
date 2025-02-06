export type TChain = {
    chain_id: number
    logo: string | null
    name: string
}

export enum ChainId {
    Polygon = 137,
    Base = 8453,
    Ethereum = 1,
    Avalanche = 43114,
    Bsc = 56,
    Gnosis = 100,
    Optimism = 10,
    Scroll = 534352,
    Arbitrum = 42161,
    Metis = 1088,
    Etherlink = 42793,
}

export enum ChainName {
    Polygon = 'polygon',
    Base = 'base',
    Ethereum = 'ethereum',
    Avalanche = 'avalanche',
    Bsc = 'bsc',
    Gnosis = 'gnosis',
    Optimism = 'optimism',
    Scroll = 'scroll',
    Metis = 'metis',
    Etherlink = 'etherlink',
    Arbitrum = 'arbitrum',
}
