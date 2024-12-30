import {
    useWriteContract,
    useWaitForTransactionReceipt,
    type BaseError,
    useAccount,
} from 'wagmi'
// import { Action } from '../../../types/assetsTable'
// import { getActionName } from '@utils/getActionName'
// import CustomButton from '@components/ui/CustomButton'
import COMPOUND_ABI from '@/data/abi/compoundABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
import { useCallback, useEffect } from 'react'
// import { AddressType } from '../../../types/address'
// import { IAssetData } from '@interfaces/IAssetData'
import {
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    POOL_AAVE_MAP,
    // POOL_AAVE_MAP,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '../../../constants'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
// import { getErrorText } from '@utils/getErrorText'
import { countCompoundDecimals } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
// import { useActiveAccount } from 'thirdweb/react'
import CustomAlert from '@/components/alerts/CustomAlert'
import {
    TBorrowTx,
    TLendBorrowTxContext,
    useLendBorrowTxContext,
} from '@/context/lend-borrow-tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { getMaxAmountAvailableToBorrow } from '@/lib/getMaxAmountAvailableToBorrow'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface IBorrowButtonProps {
    disabled: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
}

const txBtnStatus: Record<string, string> = {
    pending: 'Borrowing...',
    confirming: 'Confirming...',
    success: 'Close',
    default: 'Borrow',
}

const BorrowButton = ({
    disabled,
    asset,
    amount,
    handleCloseModal,
}: IBorrowButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { address: walletAddress } = useAccount()
    const { borrowTx, setBorrowTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    useEffect(() => {
        if (hash) {
            setBorrowTx((prev: TBorrowTx) => ({
                ...prev,
                status: 'view',
                hash,
            }))
        }

        if (hash && isConfirmed) {
            setBorrowTx((prev: TBorrowTx) => ({
                ...prev,
                status: 'view',
                isConfirmed: isConfirmed,
            }))
        }
    }, [hash, isConfirmed])

    // Update the status(Loading states) of the lendTx based on the isPending and isConfirming states
    useEffect(() => {
        setBorrowTx((prev: TBorrowTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    const txBtnText =
        txBtnStatus[
        isConfirming
            ? 'confirming'
            : isConfirmed
                ? 'success'
                : isPending
                    ? 'pending'
                    : 'default'
        ]

    const borrowCompound = useCallback(
        async (cTokenAddress: string, amount: string) => {
            try {
                writeContractAsync({
                    address: cTokenAddress as `0x${string}`,
                    abi: COMPOUND_ABI,
                    functionName: 'borrow',
                    args: [
                        parseUnits(
                            amount,
                            asset.decimals
                        ),
                    ],
                })
            } catch (error) {
                error
            }
        },
        [writeContractAsync, asset]
    )

    const borrowAave = useCallback(
        async (
            poolContractAddress: string,
            underlyingAssetAdress: string,
            amount: string,
            addressOfWallet: string
        ) => {
            try {
                writeContractAsync({
                    address: poolContractAddress as `0x${string}`,
                    abi: AAVE_POOL_ABI,
                    functionName: 'borrow',
                    args: [
                        underlyingAssetAdress,
                        parseUnits(amount, asset.asset.token.decimals),
                        2,
                        0,
                        addressOfWallet,
                    ],
                })
                    .catch((error) => {
                        setBorrowTx((prev: TBorrowTx) => ({
                            ...prev,
                            isPending: false,
                            isConfirming: false,
                            errorMessage: error.message || 'Something went wrong',
                        }))
                    })
            } catch (error) {
                error
            }
        },
        [writeContractAsync, asset, handleCloseModal]
    )

    const onBorrow = async () => {
        if (asset?.protocol_type === PlatformType.COMPOUND) {
            await borrowCompound(asset?.asset?.token?.address, amount)
            return
        }
        if (asset?.protocol_type === PlatformType.AAVE) {
            await borrowAave(
                POOL_AAVE_MAP[asset?.platform_name as PlatformValue],
                asset?.asset?.token?.address,
                amount,
                walletAddress as string
            )
            return
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
            {borrowTx.errorMessage.length > 0 && (
                <CustomAlert description={borrowTx.errorMessage} />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={(isPending || isConfirming || disabled) && borrowTx.status !== 'view'}
                onClick={
                    borrowTx.status === 'borrow'
                        ? onBorrow
                        : () => handleCloseModal(false)
                }
            >
                {txBtnText}
                {borrowTx.status !== 'view' && !isPending && !isConfirming && (
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

export default BorrowButton
