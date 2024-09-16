import { IChain } from "@/types/chain";

export const allChains: IChain[] = [
    {
        id: 0,
        name: "All networks",
        chainId: 0,
        chainName: "All networks",
        image: "/images/chains/all-networks.webp",
    },
    {
        id: 1,
        name: "Ethereum",
        chainId: 1,
        chainName: "Ethereum",
        image: "/images/chains/eth.webp",
    },
    {
        id: 2,
        name: "Bitcoin",
        chainId: 10000,
        chainName: "Bitcoin",
        image: "/images/chains/btc.webp",
    },
    {
        id: 3,
        name: "Optimism",
        chainId: 10,
        chainName: "Optimism",
        image: "/images/chains/op.webp",
    },
    {
        id: 4,
        name: "BNB Chain",
        chainId: 56,
        chainName: "BNB Chain",
        image: "/images/chains/bnb.webp",
    },
    {
        id: 5,
        name: "Matic",
        chainId: 137,
        chainName: "Matic",
        image: "/images/chains/matic.webp",
    },
    {
        id: 6,
        name: "Solana",
        chainId: 101,
        chainName: "Solana",
        image: "/images/chains/sol.webp",
    },
]