import { useCallback, useEffect, useMemo, useState } from 'react'
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
import {
    TLendBorrowTx,
    useLendBorrowTxContext,
} from '@/context/lend-borrow-tx-provider'
import { TLendBorrowTxContext } from '@/context/lend-borrow-tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
// import { useCreatePendingToast } from '@/hooks/useCreatePendingToast'

interface ISupplyAaveButtonProps {
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const SupplyAaveButton = ({
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ISupplyAaveButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const [lastTx, setLastTx] = useState<'mint' | 'approve'>('mint')
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })
    const { address: walletAddress } = useAccount()
    // const { createToast } = useCreatePendingToast()
    const { isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { lendTx, setLendTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext

    const amountBN = useMemo(() => {
        return amount ? parseUnits(amount, decimals) : BigNumber.from(0)
    }, [amount, decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: 'Close',
        default: lendTx.status === 'approve' ? 'Approve token' : 'Lend token',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        // console.log('isPending', isPending)
        // console.log('isConfirming', isConfirming)
        // console.log('isConfirmed', isConfirmed)
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isConfirmed
                  ? lendTx.status === 'view'
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
            setLendTx((prev: TLendBorrowTx) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

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
        if (lendTx.status === 'view') return

        if (!isConfirmed) {
            // Only update status based on allowance when not in a confirmed state
            if (lendTx.allowanceBN.gte(amountBN)) {
                setLendTx((prev: TLendBorrowTx) => ({
                    ...prev,
                    status: 'lend',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setLendTx((prev: TLendBorrowTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: 'Insufficient allowance',
                }))
            }
        } else {
            // Handle confirmation state transitions
            if (lendTx.status === 'approve') {
                supply().then(() => {
                    setLendTx((prev: TLendBorrowTx) => ({
                        ...prev,
                        status: 'lend',
                        hash: '',
                        errorMessage: '',
                    }))
                })
            } else if (lendTx.status === 'lend') {
                setLendTx((prev: TLendBorrowTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    errorMessage: '',
                }))
            }
        }
    }, [amount, decimals, lendTx.allowanceBN, isConfirmed, lendTx.status])

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
            setLendTx((prev: TLendBorrowTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
            }))

            // console.log("underlyingAssetAdress", underlyingAssetAdress)
            // console.log("poolContractAddress", poolContractAddress)
            // console.log("amount", amount)
            // console.log("decimals", decimals)

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [poolContractAddress, parseUnits(amount, decimals)],
            })
        } catch (error) {
            error
        }
    }

    return (
        <>
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {lendTx.errorMessage.length > 0 && (
                <CustomAlert description={lendTx.errorMessage} />
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
                {lendTx.status !== 'view' && !isPending && !isConfirming && (
                    <ArrowRightIcon
                        width={16}
                        height={16}
                        className="stroke-white group-[:disabled]:opacity-50"
                    />
                )}
            </Button>
        </>
    )
}

export default SupplyAaveButton
