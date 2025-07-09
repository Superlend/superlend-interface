import { useEffect, useState, useCallback, useRef, useReducer } from 'react'
import { TToken } from '../types'
import { useEthersMulticall } from './useEthereumMulticall'
import { ContractCallContext, ContractCallResults } from 'ethereum-multicall'
import ERC20ABI from '../data/abi/erc20ABI.json'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useAssetsDataContext } from '@/context/data-provider'
import { ETH_ADDRESSES, ETH_DECIMALS } from '../lib/constants'

// Types
type TokenSpec = { chainId: number; tokenAddress: string }
type BalanceData = Record<number, Record<string, { balanceRaw: string; balanceFormatted: number }>>

// State management with useReducer
type State = {
    data: BalanceData
    isLoading: boolean
    isError: boolean
    isRefreshing: boolean
}

type Action = 
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: BalanceData }
    | { type: 'FETCH_ERROR' }
    | { type: 'SET_REFRESHING'; payload: boolean }
    | { type: 'RESET' }

const initialState: State = {
    data: {},
    isLoading: false,
    isError: false,
    isRefreshing: false
}

function balanceReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true, isError: false }
        case 'FETCH_SUCCESS':
            return { ...state, isLoading: false, data: action.payload, isRefreshing: false }
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, isError: true, isRefreshing: false }
        case 'SET_REFRESHING':
            return { ...state, isRefreshing: action.payload }
        case 'RESET':
            return initialState
        default:
            return state
    }
}

// Helper function for stable token list generation
function generateTokenList(
    allTokensData: Record<number, TToken[]>,
    specificTokens?: TokenSpec[],
    specificChains?: number[]
): Record<number, TToken[]> {
    // If specific tokens are provided, use only those
    if (specificTokens && specificTokens.length > 0) {
        const filtered: Record<number, TToken[]> = {}
        for (const { chainId, tokenAddress } of specificTokens) {
            if (allTokensData[chainId]) {
                const token = allTokensData[chainId].find(
                    t => t.address.toLowerCase() === tokenAddress.toLowerCase()
                )
                if (token) {
                    if (!filtered[chainId]) filtered[chainId] = []
                    filtered[chainId].push(token)
                }
            }
        }
        return filtered
    }
    
    // If specific tokens are explicitly passed as empty array, fetch nothing
    if (specificTokens && specificTokens.length === 0) {
        return {}
    }
    
    // If specific chains are provided, filter by chains
    if (specificChains && specificChains.length > 0) {
        const filtered: Record<number, TToken[]> = {}
        for (const chainId of specificChains) {
            if (allTokensData[chainId]) {
                filtered[chainId] = allTokensData[chainId]
            }
        }
        return filtered
    }
    
    // Default: minimal tokens for essential chains only
    const primaryChains = [1, 137] // Ethereum and Polygon only
    const filtered: Record<number, TToken[]> = {}
    const essentialTokenSymbols = ['ETH', 'USDC', 'USDT', 'WETH', 'WBTC', 'DAI']
    
    for (const chainId of primaryChains) {
        const chainTokens = allTokensData[Number(chainId)] || []
        const essentialTokens = chainTokens.filter(token => 
            essentialTokenSymbols.some(symbol => 
                token.symbol.toUpperCase().includes(symbol)
            )
        ).slice(0, 5) // Max 5 tokens per chain
        
        if (essentialTokens.length > 0) {
            filtered[Number(chainId)] = essentialTokens
        }
    }
    return filtered
}

// Create stable parameter signature for comparison
function createParamsSignature(
    address: string | undefined,
    specificTokens?: TokenSpec[],
    specificChains?: number[]
): string {
    return JSON.stringify({
        address,
        tokens: specificTokens?.map(t => ({ chainId: t.chainId, tokenAddress: t.tokenAddress.toLowerCase() })).sort((a, b) => a.chainId - b.chainId || a.tokenAddress.localeCompare(b.tokenAddress)),
        chains: specificChains?.sort((a, b) => a - b)
    })
}

// Main hook
export const useERC20Balance = (
    address: string | undefined,
    specificTokens?: TokenSpec[],
    specificChains?: number[]
) => {
    const { allTokensData, allChainsData } = useAssetsDataContext()
    const { ethMulticall, fetchNativeBalance } = useEthersMulticall()
    const [state, dispatch] = useReducer(balanceReducer, initialState)
    
    // Use refs for stable references
    const lastFetchRef = useRef<string>('')
    const abortControllerRef = useRef<AbortController>()
    
    // Stable fetch function
    const fetchBalances = useCallback(async (
        walletAddress: string,
        tokenList: Record<number, TToken[]>
    ): Promise<BalanceData> => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        
        abortControllerRef.current = new AbortController()
        const { signal } = abortControllerRef.current
        
        const totalTokens = Object.values(tokenList).reduce((sum, tokens) => sum + tokens.length, 0)
        const totalChains = Object.keys(tokenList).length
        
        console.log(`🔄 useERC20Balance: Fetching ${totalTokens} tokens across ${totalChains} chains`)
        
        const chainLevelRequest: Promise<ContractCallResults[]>[] = []
        const ethBalanceRequest: Promise<BigNumber>[] = []
        
        for (const [chainIdStr, tokens] of Object.entries(tokenList)) {
            const chainId = Number(chainIdStr)
            
            if (!tokens || tokens.length === 0) continue
            if (signal.aborted) throw new Error('Request aborted')

            const calls: ContractCallContext[][] = [[]]
            let currentIdx = 0
            
            for (const token of tokens) {
                if (calls[currentIdx].length > 20) {
                    calls.push([])
                    currentIdx++
                }

                calls[currentIdx].push({
                    reference: `${token.address.toLowerCase()}-${chainId}`,
                    contractAddress: token.address,
                    abi: ERC20ABI,
                    calls: [
                        {
                            reference: 'balance',
                            methodName: 'balanceOf',
                            methodParameters: [walletAddress],
                        },
                    ],
                })
            }

            const requests: Promise<ContractCallResults>[] = []
            const ethCallRequest = fetchNativeBalance(walletAddress, chainId)

            ethBalanceRequest.push(ethCallRequest)
            for (const calldata of calls) {
                requests.push(ethMulticall(calldata, chainId))
            }
            chainLevelRequest.push(Promise.all(requests))
        }

        const multichainResults = await Promise.all(chainLevelRequest)
        const ethBalanceResults = await Promise.all(ethBalanceRequest)

        if (signal.aborted) throw new Error('Request aborted')

        const result: BalanceData = {}
        
        for (let idx = 0; idx < multichainResults.length; idx++) {
            const singlechainResult = multichainResults[idx]
            let chainId = 0
            
            for (const tokenResults of singlechainResult) {
                if (!tokenResults) continue
                for (const key of Object.keys(tokenResults.results)) {
                    const shards = key.split('-')
                    const tokenAddress = shards[0]
                    chainId = Number(shards[1])

                    const tokenResult = tokenResults?.results[key]?.callsReturnContext[0]
                    if (!tokenResult?.success) continue

                    const balanceBN = BigNumber.from(tokenResult?.returnValues[0])
                    if (!result[chainId]) result[chainId] = {}
                    const balanceRaw = balanceBN.toString()
                    
                    result[chainId][tokenAddress] = {
                        balanceRaw,
                        balanceFormatted: 0, // Will be calculated below
                    }
                }
                
                // Add ETH balances
                for (const ethAddress of ETH_ADDRESSES) {
                    const balanceRaw = ethBalanceResults[idx]?.toString()
                    const balanceFormatted = Number(
                        formatUnits(balanceRaw || '0', ETH_DECIMALS)
                    )
                    if (!result[chainId]) result[chainId] = {}
                    result[chainId][ethAddress] = {
                        balanceRaw: balanceRaw || '0',
                        balanceFormatted: balanceFormatted,
                    }
                }
            }
        }

        // Calculate formatted balances
        for (const [chainIdStr, tokens] of Object.entries(tokenList)) {
            const chainId = Number(chainIdStr)
            if (!result[chainId]) continue
            
            for (const token of tokens) {
                const tokenResult = result[chainId][token.address.toLowerCase()]
                if (!tokenResult || ETH_ADDRESSES.includes(token.address.toLowerCase())) continue
                
                result[chainId][token.address.toLowerCase()].balanceFormatted = Number(
                    formatUnits(tokenResult.balanceRaw, token.decimals)
                )
            }
        }

        return result
    }, [ethMulticall, fetchNativeBalance])

    // Main effect - only triggers when parameters actually change
    useEffect(() => {
        if (!address || !allTokensData || allChainsData.length === 0) {
            return
        }

        const currentParams = createParamsSignature(address, specificTokens, specificChains)
        
        // Only fetch if parameters actually changed
        if (lastFetchRef.current === currentParams && !state.isRefreshing) {
            return
        }

        lastFetchRef.current = currentParams
        
        const tokenList = generateTokenList(allTokensData, specificTokens, specificChains)
        const totalTokens = Object.values(tokenList).reduce((sum, tokens) => sum + tokens.length, 0)
        
        if (totalTokens === 0) {
            dispatch({ type: 'FETCH_SUCCESS', payload: {} })
            return
        }

        dispatch({ type: 'FETCH_START' })
        
        fetchBalances(address, tokenList)
            .then(result => {
                dispatch({ type: 'FETCH_SUCCESS', payload: result })
            })
            .catch(error => {
                if (error.message !== 'Request aborted') {
                    console.error('ERC20Balance error:', error)
                    dispatch({ type: 'FETCH_ERROR' })
                }
            })
    }, [address, allTokensData, allChainsData.length, specificTokens, specificChains, state.isRefreshing, fetchBalances])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Manual refresh function
    const setIsRefreshing = useCallback((refreshing: boolean) => {
        dispatch({ type: 'SET_REFRESHING', payload: refreshing })
    }, [])

    return {
        data: state.data,
        isLoading: state.isLoading,
        isError: state.isError,
        isRefreshing: state.isRefreshing,
        setIsRefreshing,
        getERC20Balance: fetchBalances, // For backward compatibility
    }
}

// Legacy version for backward compatibility
export const useERC20BalanceAll = (address: string | undefined) => {
    return useERC20Balance(address, undefined, undefined)
}
