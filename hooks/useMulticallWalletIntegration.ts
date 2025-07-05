'use client'

import { useEffect } from 'react'
import { useWallet } from './useWallet'
import { useEthersMulticall } from './useEthereumMulticall'

/**
 * Hook that automatically resets multicall when wallet disconnects
 * Use this in components that depend on multicall data
 */
export const useMulticallWalletIntegration = () => {
    const { isConnected, address } = useWallet()
    const { resetMulticall, isInitialized } = useEthersMulticall()

    useEffect(() => {
        // If wallet gets disconnected and we have initialized multicall, reset it
        if (!isConnected && !address && isInitialized) {
            console.log('🔄 Wallet disconnected - resetting multicall providers')
            resetMulticall()
        }
    }, [isConnected, address, isInitialized, resetMulticall])

    return {
        isMulticallReady: isInitialized && isConnected,
    }
}

/**
 * Hook for components that require both wallet connection AND multicall
 * Throws error if either is not available
 */
export const useRequiredMulticallWallet = () => {
    const wallet = useWallet()
    const multicall = useEthersMulticall()
    
    if (!wallet.isConnected || !wallet.address) {
        throw new Error('Wallet connection required')
    }
    
    if (!multicall.isInitialized) {
        throw new Error('Multicall not initialized')
    }
    
    return {
        ...wallet,
        ...multicall,
    }
} 