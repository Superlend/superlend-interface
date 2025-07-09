import { decodeErrorResult } from 'viem'

/**
 * Extract detailed error information from a failed transaction
 */
export const extractTransactionError = (receipt: any, contractAbi?: any[]): string => {
    if (!receipt || receipt.status === 'success') return ''
    
    // Try to decode revert reason if ABI is provided
    if (contractAbi && receipt.logs) {
        try {
            // Look for revert reasons in transaction data
            const errorData = receipt.logs.find((log: any) => 
                log.topics && log.topics[0] && log.data
            )
            
            if (errorData && contractAbi) {
                const decoded = decodeErrorResult({
                    abi: contractAbi,
                    data: errorData.data
                })
                return decoded.args ? decoded.args.join(', ') : 'Contract execution failed'
            }
        } catch (error) {
            console.warn('Failed to decode error result:', error)
        }
    }
    
    // Fallback to generic messages
    return 'Transaction was reverted by the smart contract'
}

/**
 * Common transaction error patterns and their user-friendly messages
 */
export const getTransactionErrorMessage = (error: any, receipt?: any): string => {
    if (!error && !receipt) return 'Unknown error occurred'
    
    // Handle receipt-based errors (transaction mined but reverted)
    if (receipt && receipt.status === 'reverted') {
        return extractTransactionError(receipt)
    }
    
    // Handle pre-transaction errors (before mining)
    if (error) {
        const errorMessage = error.message || error.toString()
        
        // User rejection
        if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
            return 'Transaction was cancelled in the wallet'
        }
        
        // Insufficient funds
        if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
            return 'Insufficient funds to complete this transaction'
        }
        
        // Gas issues
        if (errorMessage.includes('gas required exceeds allowance') || errorMessage.includes('out of gas')) {
            return 'Transaction requires more gas than available'
        }
        
        // Nonce issues
        if (errorMessage.includes('nonce too low')) {
            return 'Transaction nonce is too low. Please try again.'
        }
        
        // Contract revert during estimation
        if (errorMessage.includes('execution reverted')) {
            const revertMatch = errorMessage.match(/execution reverted(?:: (.+))?/)
            if (revertMatch && revertMatch[1] && revertMatch[1] !== 'undefined') {
                return `Transaction failed: ${revertMatch[1]}`
            }
            return 'Transaction would fail - contract requirements not met'
        }
        
        // Network issues
        if (errorMessage.includes('network not supported') || errorMessage.includes('unsupported chain')) {
            return 'This network is not supported. Please switch to a supported network.'
        }
        
        // Wallet connection issues
        if (errorMessage.includes('ConnectorNotConnectedError')) {
            return 'Wallet is not connected. Please connect your wallet and try again.'
        }
        
        // Chain mismatch
        if (errorMessage.includes('ChainMismatchError')) {
            return 'Wrong network detected. Please switch to the correct network.'
        }
        
        // Allowance issues
        if (errorMessage.includes('allowance')) {
            return 'Token allowance is insufficient. Please approve the token first.'
        }
        
        // Generic fallback
        return errorMessage.length > 100 
            ? errorMessage.substring(0, 100) + '...'
            : errorMessage
    }
    
    return 'Transaction failed for unknown reason'
}

/**
 * Comprehensive transaction status checker
 */
export const checkTransactionResult = (
    error: any,
    receipt: any,
    contractAbi?: any[]
): {
    isSuccessful: boolean
    isFailed: boolean
    isUserRejection: boolean
    errorMessage: string
} => {
    // Check for user rejection first
    const isUserRejection = error?.message?.includes('User rejected') ||
                           error?.message?.includes('user rejected') ||
                           error?.code === 4001 ||
                           error?.code === 'ACTION_REJECTED'
    
    // If no receipt, transaction never got mined
    if (!receipt) {
        return {
            isSuccessful: false,
            isFailed: !!error && !isUserRejection,
            isUserRejection,
            errorMessage: isUserRejection ? 'Transaction cancelled by user' : getTransactionErrorMessage(error)
        }
    }
    
    // Check receipt status
    const isSuccessful = receipt.status === 'success'
    const isFailed = receipt.status === 'reverted'
    
    return {
        isSuccessful,
        isFailed,
        isUserRejection,
        errorMessage: isFailed ? extractTransactionError(receipt, contractAbi) : ''
    }
} 