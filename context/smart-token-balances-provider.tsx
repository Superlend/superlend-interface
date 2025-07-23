import React, { createContext, useContext, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useERC20Balance } from '@/hooks/useERC20Balance'
import { useAssetsDataContext } from './data-provider'
import { TChain } from '@/types/chain'

interface SmartTokenBalancesContextType {
    erc20TokensBalanceData: any
    isLoading: boolean
    isRefreshing: boolean
    setIsRefreshing: (value: boolean) => void
    addTokensToFetch: (tokens: { chainId: number; tokenAddress: string }[]) => void
    formattedTokenBalances: TTokenBalance[]
}

export type TTokenBalance = {
    token: any
    chain: TChain
}

const SmartTokenBalancesContext = createContext<SmartTokenBalancesContextType | undefined>(undefined)

export const useSmartTokenBalancesContext = () => {
    const context = useContext(SmartTokenBalancesContext)
    if (!context) {
        throw new Error('useSmartTokenBalancesContext must be used within SmartTokenBalancesProvider')
    }
    return context
}

export default function SmartTokenBalancesProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { allTokensData, allChainsData } = useAssetsDataContext()

    // State for additional tokens requested by components
    const [additionalTokens, setAdditionalTokens] = React.useState<{ chainId: number; tokenAddress: string }[]>([])

    // Clear additional tokens when URL changes to prevent accumulation
    React.useEffect(() => {
        setAdditionalTokens([])
    }, [pathname, searchParams?.toString()])

    // Function to add tokens for fetching
    const addTokensToFetch = React.useCallback((tokens: { chainId: number; tokenAddress: string }[]) => {
        setAdditionalTokens(prev => {
            // Normalize incoming tokens to lowercase
            const normalizedTokens = tokens.map(token => ({
                ...token,
                tokenAddress: token.tokenAddress.toLowerCase()
            }))

            const newTokens = normalizedTokens.filter(token =>
                !prev.some(prevToken =>
                    prevToken.chainId === token.chainId &&
                    prevToken.tokenAddress.toLowerCase() === token.tokenAddress.toLowerCase()
                )
            )
            if (newTokens.length > 0) {
                console.log('🎯 Adding additional tokens to fetch:', newTokens)
            }
            return [...prev, ...newTokens]
        })
    }, [])

    // Smart token fetching based on current page
    const smartTokens = useMemo(() => {
        if (!isWalletConnected) return []

        // For position management: Extract URL tokens + additional tokens requested by components
        if (pathname?.includes('/position-management')) {
            const urlTokens = getPositionManagementTokens(searchParams)
            const combinedTokens = [...urlTokens, ...additionalTokens]

            // Remove duplicates based on chainId + tokenAddress
            const uniqueTokens = combinedTokens.filter((token, index, self) =>
                index === self.findIndex(t =>
                    t.chainId === token.chainId &&
                    t.tokenAddress.toLowerCase() === token.tokenAddress.toLowerCase()
                )
            )

            console.log('🎯 Smart Provider: Fetching URL tokens + component tokens:', {
                urlTokens,
                additionalTokens,
                uniqueTokens,
                totalTokens: uniqueTokens.length
            })

            return uniqueTokens
        }

        // For other pages, also use default behavior for now
        return []
    }, [pathname, searchParams, isWalletConnected, additionalTokens])

    const {
        data: erc20TokensBalanceData,
        isLoading,
        isRefreshing,
        setIsRefreshing,
    } = useERC20Balance(
        walletAddress as `0x${string}`,
        smartTokens.length > 0 ? smartTokens : [], // Pass empty array to explicitly fetch nothing when no tokens requested
        undefined // No specific chains - let the hook determine chains from the tokens
    )

    const fallbackTokenBalanceData =
        getFormattedFallbackTokenBalances(allTokensData)

    const formattedTokenBalances = getFormattedTokenBalances(
        isWalletConnected ? erc20TokensBalanceData : fallbackTokenBalanceData,
        allTokensData,
        allChainsData
    )

    // Debug logging
    React.useEffect(() => {
        if (pathname?.includes('/position-management')) {
            const searchParamToken = searchParams?.get('token')?.toLowerCase()
            const searchParamChainId = Number(searchParams?.get('chain_id') || '1')
            const hasTokenInBalanceData = searchParamToken ? erc20TokensBalanceData[searchParamChainId]?.[searchParamToken] : undefined

            // console.log('🔍 Smart Provider Debug:', {
            //     pathname,
            //     searchParams: Object.fromEntries(searchParams?.entries() || []),
            //     smartTokens,
            //     additionalTokens,
            //     totalTokensToFetch: smartTokens.length,
            //     searchParamToken,
            //     searchParamChainId,
            //     hasTokenInBalanceData,
            //     tokenBalance: hasTokenInBalanceData?.balanceFormatted,
            //     erc20TokensBalanceData,
            //     walletAddress,
            //     isLoading,
            //     hookReceives: `specificTokens=${smartTokens.length > 0 ? 'array' : 'empty'}`
            // })

            // Additional debug for specific token
            if (searchParamToken) {
                console.log('🔍 Token-specific debug:', {
                    searchParamToken,
                    balanceData: erc20TokensBalanceData[searchParamChainId]?.[searchParamToken],
                    allTokensInChain: Object.keys(erc20TokensBalanceData[searchParamChainId] || {}),
                    usingDefaultHookBehavior: smartTokens.length === 0
                })
            }
        }
    }, [pathname, searchParams, smartTokens, erc20TokensBalanceData, walletAddress, isLoading])

    const contextValue: SmartTokenBalancesContextType = {
        erc20TokensBalanceData,
        isLoading,
        isRefreshing,
        setIsRefreshing,
        addTokensToFetch,
        formattedTokenBalances
    }

    return (
        <SmartTokenBalancesContext.Provider value={contextValue}>
            {children}
        </SmartTokenBalancesContext.Provider>
    )
}

// Helper functions for different token sets
function getPositionManagementTokens(searchParams: URLSearchParams | null) {
    if (!searchParams) return []

    const tokens: { chainId: number; tokenAddress: string }[] = []
    const chainId = Number(searchParams.get('chain_id') || '1')

    // Extract tokens from URL parameters
    const token = searchParams.get('token')
    const lendToken = searchParams.get('lend_token')
    const borrowToken = searchParams.get('borrow_token')

    // Add main token (normalize to lowercase)
    if (token) {
        tokens.push({ chainId, tokenAddress: token.toLowerCase() })
    }

    // Add loop position tokens (normalize to lowercase)
    if (lendToken) {
        tokens.push({ chainId, tokenAddress: lendToken.toLowerCase() })
    }
    if (borrowToken) {
        tokens.push({ chainId, tokenAddress: borrowToken.toLowerCase() })
    }

    // No fallback tokens - let components request what they need
    // This ensures we only fetch tokens that are actually needed

    console.log(`🎯 Position Management URL Tokens: ${tokens.length} tokens for chain ${chainId}`, tokens)

    return tokens
}

function getFormattedTokenBalances(
    erc20TokensBalanceData: Record<
        number,
        Record<string, { balanceRaw: string; balanceFormatted: number }>
    >,
    allTokensData: any,
    allChainsData: TChain[]
): TTokenBalance[] {
    const result: TTokenBalance[] = []

    for (const chainId in erc20TokensBalanceData) {
        const chainIdNumber = Number(chainId)
        const tokenBalances = erc20TokensBalanceData[chainIdNumber]

        for (const tokenAddress in tokenBalances) {
            const balanceData = tokenBalances[tokenAddress]
            const token = allTokensData[chainIdNumber]?.find(
                (token: any) =>
                    token.address.toLowerCase() ===
                    tokenAddress.toLowerCase()
            )
            const chain = allChainsData.find(
                (chain) => chain.chain_id === chainIdNumber
            )

            result.push({
                token: {
                    ...token,
                    balance: balanceData.balanceFormatted,
                },
                chain: chain as TChain,
            })
        }
    }

    return result
}

function getFormattedFallbackTokenBalances(allTokensData: any) {
    const output: any = {}

    for (const chainId in allTokensData) {
        if (allTokensData.hasOwnProperty(chainId)) {
            const tokens = allTokensData[chainId]
            output[chainId] = {}

            tokens.forEach((token: any) => {
                const normalizedAddress = token.address.toLowerCase().trim()
                if (!output[chainId][normalizedAddress]) {
                    output[chainId][normalizedAddress] = {
                        balanceRaw: '0',
                        balanceFormatted: 0,
                    }
                }
            })
        }
    }

    return output
}