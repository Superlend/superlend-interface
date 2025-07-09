'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface WalletState {
    // Connection state
    isConnected: boolean
    isConnecting: boolean
    address?: `0x${string}`
    
    // Wallet management
    wallet?: any
    wallets: any[]
    
    // Actions
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    switchChain: (chainId: number) => Promise<void>
    
    // Status
    isReady: boolean
    error?: string
}

/**
 * Unified wallet hook that abstracts Privy + Wagmi complexity
 * Provides a clean, single interface for wallet operations
 */
export const useWallet = (): WalletState => {
    const { isConnecting: isConnectingWagmi, isConnected: isConnectedWagmi, address: walletAddressWagmi } = useAccount()
    const { user, ready, authenticated, login, logout } = usePrivy()
    const { wallets } = useWallets()
    const { disconnect: wagmiDisconnect } = useDisconnect()
    const queryClient = useQueryClient()
    
    const previousWalletAddress = useRef<string | undefined>()
    const previousAuthenticated = useRef<boolean | undefined>()
    
    // Strict connection logic - both providers must agree
    const privyConnected = !!user && authenticated
    const wagmiConnected = isConnectedWagmi && !!walletAddressWagmi
    const isConnected = privyConnected && wagmiConnected
    const isConnecting = isConnectingWagmi || !ready
    
    // Wallet address prioritizing Privy when authenticated
    const address = (privyConnected && user?.wallet?.address) ? 
        user.wallet.address as `0x${string}` : 
        (wagmiConnected ? walletAddressWagmi as `0x${string}` : undefined)
    
    // Active wallet
    const wallet = wallets.find((wallet: any) => wallet.address === address)
    
    // Clear cache when wallet disconnects
    useEffect(() => {
        const currentWalletAddress = address
        const currentIsConnected = isConnected
        
        const wasConnected = previousWalletAddress.current && previousAuthenticated.current
        const isNowDisconnected = !currentWalletAddress || !currentIsConnected
        
        if (wasConnected && isNowDisconnected) {
            // Clear all wallet-dependent data
            queryClient.clear()
            queryClient.removeQueries({ queryKey: ['portfolio'] })
            queryClient.removeQueries({ queryKey: ['portfolio-group'] })
            queryClient.removeQueries({ queryKey: ['user-details'] })
            queryClient.removeQueries({ queryKey: ['merkl-user-rewards-data'] })
            
            // Clear localStorage
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage)
                keys.forEach(key => {
                    if (key.startsWith('opportunities_') || 
                        key.includes('wallet') || 
                        key.includes('user') ||
                        key.includes('portfolio')) {
                        localStorage.removeItem(key)
                    }
                })
            }
            
            // Reset multicall providers to prevent stale connections
            // Note: We're not importing useEthersMulticall here to avoid circular deps
            // The reset will happen automatically on next hook usage
        }
        
        previousWalletAddress.current = currentWalletAddress
        previousAuthenticated.current = currentIsConnected
        
    }, [address, isConnected, queryClient])
    
    // Listen for external wallet disconnection
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0 && address) {
                // setTimeout(() => window.location.reload(), 100)
            }
        }

        const handleDisconnect = () => {
            if (address) {
                // setTimeout(() => window.location.reload(), 100)
            }
        }

        const ethereum = (window as any).ethereum
        if (ethereum && typeof ethereum.on === 'function') {
            ethereum.on('accountsChanged', handleAccountsChanged)
            ethereum.on('disconnect', handleDisconnect)
        }

        return () => {
            if (ethereum && typeof ethereum.removeListener === 'function') {
                ethereum.removeListener('accountsChanged', handleAccountsChanged)
                ethereum.removeListener('disconnect', handleDisconnect)
            }
        }
    }, [address])
    
    // Connect function
    const connect = useCallback(async () => {
        try {
            await login()
        } catch (error) {
            console.error('Failed to connect wallet:', error)
            throw error
        }
    }, [login])
    
    // Disconnect function with cleanup
    const disconnect = useCallback(async () => {
        try {
            // Clear cache before logout
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage)
                keys.forEach(key => {
                    if (key.startsWith('opportunities_') || 
                        key.includes('portfolio') ||
                        key.includes('user') ||
                        key.includes('wallet')) {
                        localStorage.removeItem(key)
                    }
                })
            }
            
            // Disconnect from both providers
            await Promise.all([
                logout(),
                wagmiDisconnect()
            ])
            
            // Force reload for complete state reset
            // setTimeout(() => window.location.reload(), 100)
        } catch (error) {
            console.error('Failed to disconnect wallet:', error)
            throw error
        }
    }, [logout, wagmiDisconnect])
    
    // Switch chain function
    const switchChain = useCallback(async (chainId: number) => {
        try {
            if (wallet && typeof wallet.switchChain === 'function') {
                await wallet.switchChain(chainId)
            } else {
                throw new Error('Chain switching not supported by current wallet')
            }
        } catch (error) {
            console.error('Failed to switch chain:', error)
            throw error
        }
    }, [wallet])
    
    return {
        // State
        isConnected,
        isConnecting,
        address,
        wallet,
        wallets,
        isReady: ready,
        
        // Actions
        connect,
        disconnect,
        switchChain,
    }
}

/**
 * Hook for components that require wallet connection
 * Throws error if wallet is not connected
 */
export const useRequiredWallet = () => {
    const wallet = useWallet()
    
    if (!wallet.isConnected || !wallet.address) {
        throw new Error('Wallet connection required')
    }
    
    return wallet as Required<Pick<WalletState, 'address' | 'wallet'>> & WalletState
}

/**
 * Hook that provides wallet connection state for conditional rendering
 */
export const useWalletStatus = () => {
    const { isConnected, isConnecting, isReady, address } = useWallet()
    
    return {
        isConnected: isConnected && !!address,
        isConnecting: isConnecting || !isReady,
        needsConnection: isReady && !isConnecting && (!isConnected || !address),
    }
} 