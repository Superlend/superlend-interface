// import CustomButton from '@components/ui/CustomButton'
import { useWriteContract } from 'wagmi'
import COMPOUND_ABI from '@/data/abi/compoundABI.json'
import { parseUnits } from 'ethers/lib/utils'
// import { AddressType } from '@/types/address'
// import { getActionName } from '@/lib/getActionName'
// import { Action } from '@/types/assetsTable'
// import toast from 'react-hot-toast'
import {
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'
import { useEffect, useState } from 'react'
import CustomAlert from '@/components/alerts/CustomAlert'
// import { getErrorText } from '@utils/getErrorText'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface ISupplyETHCompoundButtonProps {
    disabled: boolean
    cTokenAddress: string
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const SupplyETHCompoundButton = ({
    cTokenAddress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ISupplyETHCompoundButtonProps) => {
    const { writeContractAsync, isPending, data: hash, error } = useWriteContract()
    const [errorMessage, setErrorMessage] = useState<string>('')
    
    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash, 2)
    
    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful) {
            // Transaction succeeded, close modal
            handleCloseModal(false)
        } else if (txStatus.isFailed) {
            const failureMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setErrorMessage(failureMessage)
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt, handleCloseModal])
    
    // const { createToast } = useCreatePendingToast()

    const onSupply = async () => {
        try {
            // Clear any previous error
            setErrorMessage('')
            
            await writeContractAsync({
                address: cTokenAddress as `0x${string}`,
                abi: COMPOUND_ABI,
                functionName: 'mint',
                args: [],
                value: parseUnits(amount, decimals) as unknown as bigint,
            })
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMsg = humaniseWagmiError(error)
            setErrorMessage(errorMsg)
        }
    }
    return (
        <div className="flex flex-col gap-2">
            {(error || errorMessage) && (
                <CustomAlert
                    description={errorMessage || (error?.message)}
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={isPending || txStatus.isConfirming || disabled}
                onClick={onSupply}
            >
                {txStatus.isConfirming ? 'Confirming...' : isPending ? 'Lending...' : 'Lend'}
                {!isPending && !txStatus.isConfirming && (
                    <ArrowRightIcon
                        width={16}
                        height={16}
                        className="stroke-white group-[:disabled]:opacity-50"
                    />
                )}
            </Button>
        </div>
    )
}

export default SupplyETHCompoundButton
