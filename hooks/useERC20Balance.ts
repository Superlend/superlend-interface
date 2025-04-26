import { useEffect, useState } from 'react'
import { TToken } from '../types'
import { useEthersMulticall } from './useEthereumMulticall'
import { ContractCallContext, ContractCallResults } from 'ethereum-multicall'
import ERC20ABI from '../data/abi/erc20ABI.json'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useAssetsDataContext } from '@/context/data-provider'
import { ETH_ADDRESSES, ETH_DECIMALS } from '../lib/constants'

export const useERC20Balance = (address: string | undefined) => {
    const { allTokensData, allChainsData } = useAssetsDataContext()
    const { ethMulticall, fetchNativeBalance } = useEthersMulticall()
    const tokenList = allTokensData as unknown as Record<number, TToken[]>
    const chainList: string[] = allChainsData.map((chain) =>
        chain.chain_id.toString()
    )
    const [data, setData] = useState<
        Record<
            number,
            Record<string, { balanceRaw: string; balanceFormatted: number }>
        >
    >({})
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isError, setIsError] = useState<boolean>(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const getERC20Balance = async (address: string | undefined) => {
        try {
            if (isLoading) return

            setIsError(false)
            setIsLoading(true)

            const chainLevelRequest: Promise<ContractCallResults[]>[] = []
            const ethBalanceRequest: Promise<BigNumber>[] = []
            for (const key of Object.keys(tokenList)) {
                // if (!key) continue
                const calls: ContractCallContext[][] = [[]]
                let currentIdx = 0
                for (const token of tokenList[Number(key)]) {
                    if (calls[currentIdx].length > 20) {
                        calls.push([])
                        currentIdx++
                    }

                    calls[currentIdx].push({
                        reference: `${token.address.toLowerCase()}-${key}`,
                        contractAddress: token.address,
                        abi: ERC20ABI,
                        calls: [
                            {
                                reference: 'balance',
                                methodName: 'balanceOf',
                                methodParameters: [address],
                            },
                        ],
                    })
                }

                const requests: Promise<ContractCallResults>[] = []
                const ethCallRequest = fetchNativeBalance(
                    address as string,
                    Number(key)
                )

                ethBalanceRequest.push(ethCallRequest)
                for (const calldata of calls) {
                    requests.push(ethMulticall(calldata, Number(key)))
                }
                chainLevelRequest.push(Promise.all(requests))
            }

            const multichainResults = await Promise.all(chainLevelRequest)
            const ethBalanceResults = await Promise.all(ethBalanceRequest)

            const result: Record<
                number,
                Record<string, { balanceRaw: string; balanceFormatted: number }>
            > = {}
            for (let idx = 0; idx < multichainResults.length; idx++) {
                const singlechainResult = multichainResults[idx]
                let chainId = 0
                for (const tokenResults of singlechainResult) {
                    if (!tokenResults) continue
                    for (const key of Object.keys(tokenResults.results)) {
                        // if (!key) continue
                        const shards = key.split('-')
                        const tokenAddress = shards[0]
                        chainId = Number(shards[1])

                        const tokenResult =
                            tokenResults?.results[key]?.callsReturnContext[0]
                        if (!tokenResult.success) continue

                        const balanceBN = BigNumber.from(
                            tokenResult?.returnValues[0]
                        )
                        if (!result[chainId]) result[chainId] = {}
                        const balanceRaw = balanceBN.toString()
                        const balanceFormatted = 0
                        // if (result?.[chainId]?.[tokenAddress]) {
                        result[chainId][tokenAddress] = {
                            balanceRaw,
                            balanceFormatted,
                        }
                        // }
                    }
                    for (const ethAddress of ETH_ADDRESSES) {
                        const balanceRaw = ethBalanceResults[idx]?.toString()
                        const balanceFormatted = Number(
                            formatUnits(balanceRaw, ETH_DECIMALS)
                        )
                        result[chainId][ethAddress] = {
                            balanceRaw: ethBalanceResults[idx]?.toString(),
                            balanceFormatted: balanceFormatted,
                        }
                    }
                }
            }

            for (const key of Object.keys(tokenList)) {
                const chainId = Number(key)
                if (!result[chainId]) continue
                for (const token of tokenList[chainId]) {
                    const tokenResult =
                        result[chainId][token.address.toLowerCase()]
                    if (
                        !tokenResult ||
                        ETH_ADDRESSES.includes(token.address.toLowerCase())
                    )
                        continue
                    result[chainId][
                        token.address.toLowerCase()
                    ].balanceFormatted = Number(
                        formatUnits(tokenResult.balanceRaw, token.decimals)
                    )
                }
            }
            setData(result)
        } catch (error) {
            console.log(error)
            setIsError(true)
        } finally {
            setIsRefreshing(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (
            (!!address &&
                !!tokenList &&
                chainList.length > 0 &&
                Object.keys(data).length === 0) ||
            isRefreshing
        ) {
            getERC20Balance(address)
            setIsRefreshing(false)
        }
    }, [!!address, !!tokenList, chainList.length > 0, data, isRefreshing])

    return {
        data,
        isLoading,
        isError,
        getERC20Balance,
        isRefreshing,
        setIsRefreshing,
    }
}
