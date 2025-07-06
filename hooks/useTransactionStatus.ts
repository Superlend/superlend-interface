import { useWaitForTransactionReceipt } from 'wagmi'
import { useMemo } from 'react'

export interface TransactionStatus {
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
    isSuccessful: boolean
    isFailed: boolean
    isComplete: boolean
    receipt: any
    error: any
}

/**
 * Enhanced transaction status hook that properly detects success/failure
 * Unlike the basic useWaitForTransactionReceipt, this actually checks the transaction status
 */
export const useTransactionStatus = (hash: `0x${string}` | undefined, confirmations: number = 2): TransactionStatus => {
    const { 
        data: receipt, 
        isLoading: isConfirming, 
        isSuccess: isConfirmed,
        error: receiptError 
    } = useWaitForTransactionReceipt({
        hash,
        confirmations,
    })

    const status = useMemo(() => {
        const isPending = !hash || (!isConfirming && !isConfirmed)
        const isComplete = isConfirmed && !!receipt

        console.log('receipt', receipt)
        
        // Check actual transaction status from receipt
        const isSuccessful = isComplete && receipt?.status === 'success'
        const isFailed = isComplete && receipt?.status === 'reverted'
        
        return {
            isPending,
            isConfirming,
            isConfirmed,
            isSuccessful,
            isFailed,
            isComplete,
            receipt,
            error: receiptError
        }
    }, [hash, isConfirming, isConfirmed, receipt, receiptError])

    return status
}

/**
 * Get user-friendly error message from transaction receipt
 */
export const getTransactionErrorMessage = (receipt: any): string | null => {
    if (!receipt || receipt.status === 'success') return null
    
    // Try to extract revert reason from receipt
    // This varies by network and situation
    if (receipt.logs && receipt.logs.length > 0) {
        // Look for error events in logs
        const errorLog = receipt.logs.find((log: any) => 
            log.topics && log.topics[0] && log.topics[0].includes('Error')
        )
        if (errorLog) {
            // Decode error message if possible
            // This would require ABI decoding for specific error types
            return 'Transaction failed with contract error'
        }
    }
    
    return 'Transaction was reverted by the smart contract'
} 