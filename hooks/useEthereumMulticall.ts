import { providers as ethersProviders } from 'ethers'
import { useEffect, useState } from 'react'
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from 'ethereum-multicall'

export const useEthersMulticall = (walletAddress: string | undefined) => {
    const [providers, setProviders] = useState<
        Record<number, ethersProviders.JsonRpcProvider>
    >({})
    const [multicall, setMulticall] = useState<Record<number, Multicall>>({})
    const [isLoading, setIsLoading] = useState<Boolean>(false)
    const [isError, setIsError] = useState(false)

    const initalizeEthMulticall = () => {
        try {
            if (isLoading) return
            setIsLoading(true)
            const _providers: Record<number, ethersProviders.JsonRpcProvider> =
                {
                    1: new ethersProviders.JsonRpcProvider(
                        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    10: new ethersProviders.JsonRpcProvider(
                        `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    56: new ethersProviders.JsonRpcProvider(
                        `https://bnb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    100: new ethersProviders.JsonRpcProvider(
                        `https://gnosis-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    137: new ethersProviders.JsonRpcProvider(
                        `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    1088: new ethersProviders.JsonRpcProvider(
                        `https://metis-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    8453: new ethersProviders.JsonRpcProvider(
                        `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    42161: new ethersProviders.JsonRpcProvider(
                        `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    43114: new ethersProviders.JsonRpcProvider(
                        `https://avax-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                    534352: new ethersProviders.JsonRpcProvider(
                        `https://scroll-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
                    ),
                }

            const _multicall: Record<number, Multicall> = {}
            for (const chain of Object.keys(_providers)) {
                const chainId = Number(chain)
                _multicall[chainId] = new Multicall({
                    ethersProvider: _providers[chainId],
                    tryAggregate: true,
                })
            }
            setMulticall(_multicall)
            setProviders(_providers)
            setIsLoading(false)
        } catch (error) {
            console.log(error)
            setIsError(true)
            setIsLoading(false)
        }
    }

    const ethMulticall = (
        calldata: ContractCallContext[],
        chainId: number
    ): Promise<ContractCallResults> => {
        const multicallProvider = multicall[chainId]
        if (!multicallProvider) return undefined as any
        return new Promise(async (resolve, reject) => {
            try {
                const result = await multicallProvider.call(calldata)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

    useEffect(() => {
        if (
            !!walletAddress &&
            (!Object.keys(providers).length || !Object.keys(multicall).length)
        ) {
            initalizeEthMulticall()
        }
    }, [providers, multicall, isError, walletAddress])

    return {
        providers,
        setProviders,
        multicall,
        setMulticall,
        ethMulticall,
    }
}
