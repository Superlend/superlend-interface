// import CustomButton from '@components/ui/CustomButton'
// import { getActionName } from '@utils/getActionName'
// import { Action } from '../../../types/assetsTable'
import {
    BaseError,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import { useEffect, useState } from 'react'
// import { AddressType } from '../../../types/address'
import COMPOUND_ABI from '@/data/abi/compoundABIerc20.json'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
import {
    APPROVE_MESSAGE,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import CustomAlert from '@/components/alerts/CustomAlert'
import { TTxContext, useTxContext } from '@/context/tx-provider'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'
// import { getErrorText } from '@utils/getErrorText'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface ISupplyERC20CompoundButtonProps {
    underlyingToken: string
    cTokenAddress: string
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
    disabled: boolean
}

const SupplyERC20CompoundButton = ({
    underlyingToken,
    cTokenAddress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ISupplyERC20CompoundButtonProps) => {
    const {
        writeContractAsync,
        data: hash,
        isPending,
        error,
    } = useWriteContract()
    const [lastTx, setLastTx] = useState<'mint' | 'approve'>('mint')
    // const { createToast } = useCreatePendingToast()
    const { lendTx, setLendTx } = useTxContext() as TTxContext

    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash, 2)

    const txBtnStatus: Record<string, string> = {
        pending: lastTx === 'mint' ? 'Approving token...' : 'Lending token...',
        confirming: 'Confirming...',
        success: 'View position',
        default: lastTx === 'mint' ? 'Start lending' : 'Lend token',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isSuccessful: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isSuccessful
                  ? lastTx === 'approve'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, txStatus.isConfirming, txStatus.isSuccessful)

    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful) {
            if (lastTx === 'mint') {
                setLendTx({ status: 'lend', hash: hash || '' })
                supply()
            } else if (lastTx === 'approve') {
                setLendTx({ status: 'view', hash: hash || '' })
            }
        } else if (txStatus.isFailed) {
            const errorMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setLendTx({ 
                status: 'view', 
                hash: hash || '',
                errorMessage: errorMessage
            })
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt, lastTx, hash])

    const supply = async () => {
        try {
            setLastTx('approve')
            writeContractAsync({
                address: cTokenAddress as `0x${string}`,
                abi: COMPOUND_ABI,
                functionName: 'mint',
                args: [parseUnits(amount, decimals)],
            })
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMessage = humaniseWagmiError(error)
            setLendTx({ 
                status: 'view', 
                hash: hash || '',
                errorMessage: errorMessage
            })
        }
    }

    const onApproveSupply = async () => {
        try {
            // createToast()
            setLastTx('mint')
            // await toast.promise(
            //   writeContractAsync({
            //     address: underlyingToken,
            //     abi: COMPOUND_ABI,
            //     functionName: 'approve',
            //     args: [cTokenAddress, parseUnits(amount, decimals)],
            //   }),
            //   {
            //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
            //     success: APPROVE_MESSAGE,
            //     error: (error: { message: string }) => {
            //       if (error && error.message) {
            //         return getErrorText(error)
            //       }
            //       return SOMETHING_WENT_WRONG_MESSAGE
            //     },
            //   },
            //   ERROR_TOAST_ICON_STYLES
            // )

            // console.log("address", underlyingToken);
            // console.log("cTokenAddress", cTokenAddress);
            // console.log("amount", amount);
            // console.log("decimals", decimals);
            // console.log("parseUnits", parseUnits(amount, decimals));

            writeContractAsync({
                address: underlyingToken as `0x${string}`,
                abi: COMPOUND_ABI,
                functionName: 'approve',
                args: [cTokenAddress, parseUnits(amount, decimals)],
            })
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMessage = humaniseWagmiError(error)
            setLendTx({ 
                status: 'view', 
                hash: hash || '',
                errorMessage: errorMessage
            })
        }
    }
    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={
                        (error as BaseError).shortMessage || error.message
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={isPending || txStatus.isConfirming || disabled}
                onClick={onApproveSupply}
            >
                {txBtnText}
                <ArrowRightIcon
                    width={16}
                    height={16}
                    className="stroke-white group-[:disabled]:opacity-50"
                />
            </Button>
        </div>
    )
}

export default SupplyERC20CompoundButton
