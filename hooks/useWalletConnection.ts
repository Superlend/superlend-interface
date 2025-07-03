import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export const useWalletConnection = () => {
    const { isConnecting: isConnectingWagmi, isConnected: isConnectedWagmi, address: walletAddressWagmi } = useAccount()
    const { user, ready, authenticated } = usePrivy()
    const queryClient = useQueryClient()
    const previousWalletAddress = useRef<string | undefined>()
    const previousAuthenticated = useRef<boolean | undefined>()
    
    const isConnectingWallet = isConnectingWagmi || !ready
    
    // More strict wallet connection check - both Privy AND Wagmi must agree
    // If either shows disconnected, consider it disconnected to avoid race conditions
    const privyConnected = !!user && authenticated
    const wagmiConnected = isConnectedWagmi && !!walletAddressWagmi
    const isWalletConnected = privyConnected && wagmiConnected
    
    // Prioritize Privy's wallet address when authenticated, but ensure both agree
    const walletAddress = (privyConnected && user?.wallet?.address) ? 
        user.wallet.address as `0x${string}` : 
        (wagmiConnected ? walletAddressWagmi as `0x${string}` : undefined)
    

    const { wallets } = useWallets()
    const wallet = wallets.find(
        (wallet: any) => wallet.address === walletAddress
    )

    // Clear all cached data when wallet disconnects
    useEffect(() => {
        const currentWalletAddress = walletAddress
        const currentIsConnected = isWalletConnected
        
        // Check if wallet was connected before and now it's disconnected
        const wasConnected = previousWalletAddress.current && previousAuthenticated.current
        const isNowDisconnected = !currentWalletAddress || !currentIsConnected
        
        if (wasConnected && isNowDisconnected) {
            
            // Immediately clear all React Query cache
            queryClient.clear()
            
            // Also specifically remove wallet-dependent queries
            queryClient.removeQueries({ queryKey: ['portfolio'] })
            queryClient.removeQueries({ queryKey: ['portfolio-group'] })
            queryClient.removeQueries({ queryKey: ['user-details'] })
            queryClient.removeQueries({ queryKey: ['merkl-user-rewards-data'] })
            
            // Clear localStorage cache for wallet-dependent data
            if (typeof window !== 'undefined') {
                // Clear opportunities cache (might contain wallet-specific data)
                const keys = Object.keys(localStorage)
                keys.forEach(key => {
                    if (key.startsWith('opportunities_') || 
                        key.includes('wallet') || 
                        key.includes('user') ||
                        key.includes('portfolio')) {
                        localStorage.removeItem(key)
                    }
                })
                
                // Clear any Privy/Wagmi localStorage cache
                keys.forEach(key => {
                    if (key.includes('privy') || 
                        key.includes('wagmi') ||
                        key.includes('wallet') ||
                        key.includes('connector')) {
                        try {
                            localStorage.removeItem(key)
                        } catch (e) {
                            // Silent fail for protected keys
                        }
                    }
                })
            }
            

        }
        
        // Update refs for next comparison - use the actual connection state
        previousWalletAddress.current = currentWalletAddress
        previousAuthenticated.current = currentIsConnected
        
    }, [walletAddress, isWalletConnected, authenticated, queryClient])

    // Listen for external wallet disconnection events
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0 && walletAddress) {
                console.log('🔄 External wallet disconnection detected')
                // Force a brief delay to let Privy/Wagmi catch up
                // setTimeout(() => {
                //     window.location.reload()
                // }, 100)
            }
        }

        const handleDisconnect = () => {
            if (walletAddress) {
                console.log('🔄 Wallet disconnect event detected')
                // setTimeout(() => {
                //     window.location.reload()
                // }, 100)
            }
        }

        // Listen for MetaMask/injected wallet events
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
    }, [walletAddress])

    async function handleSwitchChain(chain_id: number) {
        await wallet?.switchChain(Number(chain_id))
    }

    return {
        user,
        wallet,
        walletAddress,
        isConnectingWallet,
        isWalletConnected,
        handleSwitchChain,
    }
}
