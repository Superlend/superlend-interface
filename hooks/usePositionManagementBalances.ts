import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useERC20Balance } from './useERC20Balance'
import { TPlatform } from '@/types/platform'
import { TPortfolio } from '@/types/queries/portfolio'

export const usePositionManagementBalances = (
    walletAddress: string | undefined,
    platformData?: TPlatform,
    portfolioData?: TPortfolio
) => {
    const searchParams = useSearchParams()
    
    // Extract tokens from URL parameters
    const urlTokens = useMemo(() => {
        const tokens: { chainId: number; tokenAddress: string }[] = []
        
        const chainId = Number(searchParams?.get('chain_id') || '1')
        const token = searchParams?.get('token')
        const lendToken = searchParams?.get('lend_token') 
        const borrowToken = searchParams?.get('borrow_token')
        
        // Add main token
        if (token) {
            tokens.push({ chainId, tokenAddress: token })
        }
        
        // Add loop position tokens
        if (lendToken) {
            tokens.push({ chainId, tokenAddress: lendToken })
        }
        if (borrowToken) {
            tokens.push({ chainId, tokenAddress: borrowToken })
        }
        
        return tokens
    }, [searchParams])
    
    // Extract tokens from platform data
    const platformTokens = useMemo(() => {
        if (!platformData?.assets?.length) return []
        
        const chainId = Number(searchParams?.get('chain_id') || '1')
        return platformData.assets.map(asset => ({
            chainId,
            tokenAddress: asset.token.address
        }))
    }, [platformData, searchParams])
    
    // Extract tokens from user portfolio positions
    const portfolioTokens = useMemo(() => {
        if (!portfolioData?.platforms?.length) return []
        
        const chainId = Number(searchParams?.get('chain_id') || '1')
        const tokens: { chainId: number; tokenAddress: string }[] = []
        
        portfolioData.platforms.forEach(platform => {
            platform.positions?.forEach(position => {
                tokens.push({
                    chainId,
                    tokenAddress: position.token.address
                })
            })
        })
        
        return tokens
    }, [portfolioData, searchParams])
    
    // Combine and deduplicate tokens
    const allRequiredTokens = useMemo(() => {
        const allTokens = [...urlTokens, ...platformTokens, ...portfolioTokens]
        
        // Deduplicate by creating a map key from chainId + address
        const uniqueTokensMap = new Map()
        allTokens.forEach(token => {
            const key = `${token.chainId}-${token.tokenAddress.toLowerCase()}`
            uniqueTokensMap.set(key, token)
        })
        
        const uniqueTokens = Array.from(uniqueTokensMap.values())
        
        console.log(`🎯 Position Management: Fetching balances for ${uniqueTokens.length} specific tokens`)
        
        return uniqueTokens
    }, [urlTokens, platformTokens, portfolioTokens])
    
    // Use optimized ERC20 balance hook with specific tokens
    const balanceResult = useERC20Balance(walletAddress, allRequiredTokens)
    
    return {
        ...balanceResult,
        requiredTokens: allRequiredTokens,
        urlTokens,
        platformTokens,
        portfolioTokens,
    }
} 