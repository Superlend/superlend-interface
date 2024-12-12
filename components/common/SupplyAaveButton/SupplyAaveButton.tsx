import { useCallback, useEffect, useState } from 'react'
import {
    BaseError,
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
// import CustomButton from '@/components/ui/CustomButton'
// import { getActionName } from '@/lib/getActionName'
// import { Action } from '@/types/assetsTable'
// import { AddressType } from '@/types/address'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
import {
    APPROVE_MESSAGE,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
// import { getErrorText } from '@/lib/getErrorText'
import { Button } from '@/components/ui/button'
import { prepareContractCall } from 'thirdweb'
import { defineChain } from 'thirdweb'
import { useSearchParams } from 'next/navigation'
import { useLendBorrowTxContext } from '@/context/lend-borrow-tx-provider'
import { TLendBorrowTxContext } from '@/context/lend-borrow-tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
// import { useCreatePendingToast } from '@/hooks/useCreatePendingToast'

interface ISupplyAaveButtonProps {
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
    allowanceBN: BigNumber
}

const SupplyAaveButton = ({
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
    allowanceBN,
}: ISupplyAaveButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const [lastTx, setLastTx] = useState<'mint' | 'approve'>('mint')
    // const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })
    const { address: walletAddress } = useAccount()
    // const { createToast } = useCreatePendingToast()
    const { isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { lendTx, setLendTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    const txBtnStatus: Record<string, string> = {
        pending: lastTx === 'mint' ? 'Approving token...' : 'Lending token...',
        confirming: 'Confirming...',
        success: 'View position',
        default: lastTx === 'mint' ? 'Approve token' : 'Lend token',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isConfirmed
                    ? lastTx === 'approve'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    const supply = useCallback(async () => {
        try {
            setLastTx('approve')
            // handleCloseModal(false)
            // await toast.promise(
            //   writeContractAsync({
            //     // address: poolContractAddress,
            //     abi: AAVE_POOL_ABI,
            //     functionName: 'supply',
            //     args: [
            //       underlyingAssetAdress,
            //       parseUnits(amount, decimals),
            //       walletAddress,
            //       0,
            //     ],
            //   }),
            //   {
            //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
            //     success: SUCCESS_MESSAGE,
            //     error: (error: { message: string }) => {
            //       if (error && error.message) {
            //         return getErrorText(error)
            //       }
            //       return SOMETHING_WENT_WRONG_MESSAGE
            //     },
            //   },
            //   ERROR_TOAST_ICON_STYLES
            // )
            // toast.remove()

            writeContractAsync({
                address: poolContractAddress,
                abi: AAVE_POOL_ABI,
                functionName: 'supply',
                args: [
                    underlyingAssetAdress,
                    parseUnits(amount, decimals),
                    walletAddress,
                    0,
                ],
            })
        } catch (error) {
            // toast.remove()
            error
        }
    }, [
        amount,
        poolContractAddress,
        underlyingAssetAdress,
        walletAddress,
        handleCloseModal,
        writeContractAsync,
        decimals,
    ])

    useEffect(() => {
        if (amount) {
            const amountBN = parseUnits(amount, decimals)
            console.log('amountBN.gt(allowanceBN)', amountBN.gt(allowanceBN))
            console.log('amountBN', amountBN.toString())
            console.log('allowanceBN', allowanceBN.toString())
        }

        if (isConfirmed && lastTx === 'mint') {
            setLendTx({ status: 'lend', hash: hash || '' })
            supply()
        }

        if (isConfirmed && lastTx === 'approve') {
            setLendTx({ status: 'view', hash: hash || '' })
        }

        // if (isConfirmed && lastTx === 'mint') {
        //   void supply()
        // }
    }, [isConfirmed, lastTx])

    const onApproveSupply = async () => {
        if (!isConnected) {
            // If not connected, prompt connection first
            try {
                const connector = connectors[0] // Usually metamask/injected connector
                await connect({ connector })
                return
            } catch (error) {
                console.error('Connection failed:', error)
                return
            }
        }

        try {
            // createToast()
            setLastTx('mint')
            // await toast.promise(
            //   writeContractAsync({
            //     address: underlyingAssetAdress,
            //     abi: AAVE_APPROVE_ABI,
            //     functionName: 'approve',
            //     args: [
            //       // poolContractAddress,
            //       parseUnits(amount, decimals)],
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

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [poolContractAddress, parseUnits(amount, decimals)],
            })

            // console.log("underlyingAssetAdress", underlyingAssetAdress)
            // console.log("poolContractAddress", poolContractAddress)
            // console.log("amount", amount)
            // console.log("decimals", decimals)
        } catch (error) {
            // toast.remove()
            error
        }
    }

    return (
        <>
            {error && (
                <CustomAlert
                    description={
                        (error as BaseError).shortMessage || error.message
                    }
                />
            )}
            <Button
                disabled={isPending || isConfirming || disabled}
                onClick={() => {
                    if (lendTx.status === 'approve') {
                        onApproveSupply()
                    } else if (lendTx.status === 'lend') {
                        supply()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                <ArrowRightIcon
                    width={16}
                    height={16}
                    className="stroke-white group-[:disabled]:opacity-50"
                />
            </Button>
        </>
    )
}

export default SupplyAaveButton
