import { useWriteContract } from 'wagmi'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { checkTransactionResult } from '@/lib/transactionUtils'
import { useEffect, useState } from 'react'

export function TransactionExample() {
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    
    const { writeContractAsync, data: hash, error } = useWriteContract()
    const txStatus = useTransactionStatus(hash)
    
    // Handle transaction completion
    useEffect(() => {
        if (txStatus.isComplete) {
            const result = checkTransactionResult(error, txStatus.receipt)
            
            if (result.isSuccessful) {
                setStatus('success')
                setErrorMessage('')
                // Handle success - update UI, show success message, etc.
                console.log('Transaction successful!')
            } else if (result.isFailed) {
                setStatus('error')
                setErrorMessage(result.errorMessage)
                // Handle failure - show error message, allow retry, etc.
                console.error('Transaction failed:', result.errorMessage)
            }
        }
    }, [txStatus.isComplete, txStatus.receipt, error])
    
    const handleTransaction = async () => {
        try {
            setStatus('idle')
            setErrorMessage('')
            
            await writeContractAsync({
                address: '0x...', // your contract address
                abi: [], // your contract ABI
                functionName: 'yourFunction',
                args: ['arg1', 'arg2'],
            })
        } catch (error: any) {
            // Handle immediate errors (user rejection, etc.)
            const result = checkTransactionResult(error, null)
            setStatus('error')
            setErrorMessage(result.errorMessage)
        }
    }
    
    return (
        <div>
            <button 
                onClick={handleTransaction}
                disabled={txStatus.isPending || txStatus.isConfirming}
            >
                {txStatus.isPending ? 'Pending...' : 
                 txStatus.isConfirming ? 'Confirming...' : 
                 'Execute Transaction'}
            </button>
            
            {status === 'success' && (
                <div style={{ color: 'green' }}>
                    ✅ Transaction successful!
                </div>
            )}
            
            {status === 'error' && (
                <div style={{ color: 'red' }}>
                    ❌ {errorMessage}
                </div>
            )}
        </div>
    )
} 