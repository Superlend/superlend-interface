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
    TLendTx,
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
    const [lastTx, setLastTx] = useState<boolean>(false);
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 5,
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

    console.log("isPending", isPending)
    console.log("isConfirming", isConfirming)
    console.log("isConfirmed", isConfirmed)

    const supply = useCallback(async () => {
        try {
            setLastTx(false)
            setLendTx((prev: TLendTx) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            // if (!lendTx.allowanceBN.gte(amountBN)) {
            //     setLendTx((prev: TLendTx) => ({
            //         ...prev,
            //         status: 'approve',
            //         hash: '',
            //         errorMessage: 'Insufficient allowance',
            //     }))
            //     return
            // }

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
            }).catch((error) => {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
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

    // Update the status(Loading states) of the lendTx based on the isPending and isConfirming states
    useEffect(() => {
        setLendTx((prev: TLendTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed
        }))
    }, [isPending, isConfirming, isConfirmed])

    // useEffect(() => {
    //     if (isConfirmed) {
    //         setLendTx((prev: TLendTx) => ({
    //             ...prev,
    //             isRefreshingAllowance: true,
    //             isConfirmed: false,
    //         }))
    //     }
    // }, [isConfirmed])

    // Update the status of the lendTx based on the allowance and the confirmation state
    useEffect(() => {
        if (lendTx.status === 'view') return

        if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
            // Only update status based on allowance when not in a confirmed state
            if (lendTx.allowanceBN.gte(amountBN)) {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'lend',
                    hash: '',
                    errorMessage: '',
                }))
                // console.log("changing status to lend")
            } else {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: 'Insufficient allowance',
                }))
                // console.log("changing status to approve")
            }
        } else if (lendTx.isConfirmed && !lendTx.isConfirming && !lendTx.isPending) {
            // Handle confirmation state transitions
            console.log("lendTx", lendTx)
            if (lendTx.status === 'approve') {
                // The below condition needs to be checked after the allowance is refreshed
                if (lendTx.allowanceBN.gte(amountBN)) {
                    // console.log("changing status to lend from approve")
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: 'lend',
                        hash: hash || '',
                        errorMessage: '',
                    }))
                    setLastTx(true)
                } else {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: 'approve',
                        hash: '',
                        errorMessage: 'Insufficient allowance',
                    }))
                }
            } else if (lendTx.status === 'lend' && !lastTx) {
                // console.log("changing status to view")
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    errorMessage: '',
                }))
            }
        }
    }, [
        amount,
        decimals,
        lendTx.allowanceBN,
        lendTx.isPending,
        lendTx.isConfirming,
        lendTx.isConfirmed,
        // lendTx.status
    ]
    )

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
            // console.log("underlyingAssetAdress", underlyingAssetAdress)
            // console.log("poolContractAddress", poolContractAddress)
            // console.log("amount", amount)
            // console.log("decimals", decimals)

            setLendTx((prev: TLendTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [poolContractAddress, parseUnits(amount, decimals)],
            })
                // .then((data) => {
                //     console.log("data", data)
                //     setLendTx((prev: TLendTx) => ({
                //         ...prev,
                //         isRefreshingAllowance: true,
                //     }))
                // })
                .catch((error) => {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                    }))
                })
        } catch (error) {
            error
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {/* {lendTx.errorMessage.length > 0 && (
                <CustomAlert description={lendTx.errorMessage} />
            )} */}
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
        </div>
    )
}

export default SupplyAaveButton
