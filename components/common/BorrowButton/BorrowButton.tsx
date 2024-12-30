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

import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'

import type { Market } from "@morpho-org/blue-sdk";
import { BLUE_API } from '@/lib/constants'
import { MetaMorphoAPIData } from '@/types/morpho/morpho'



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
    // const activeAccount = useActiveAccount()
    // const walletAddress = activeAccount?.address
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
                    args: [parseUnits(amount, asset.decimals)],
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
            } catch (error) {
                error
            }
        },
        [writeContractAsync, asset, handleCloseModal]
    )

    const borrowMorpho = useCallback(
        async (asset: any, amount: string) => {
            const morphoMarketData: Market = asset?.morphoMarketData
            const assetDetails = asset?.asset
            const platform = asset?.platform

            try {
                writeContractAsync({
                    address: platform.core_contract,
                    abi: MORPHO_MARKET_ABI,
                    functionName: 'borrow',
                    args: [
                        {
                            loanToken: morphoMarketData.params.loanToken,
                            collateralToken:
                                morphoMarketData.params.collateralToken,
                            oracle: morphoMarketData.params.oracle,
                            irm: morphoMarketData.params.irm,
                            lltv: morphoMarketData.params.lltv,
                        },
                        parseUnits(amount, assetDetails.token.decimals),
                        0,
                        walletAddress,
                        walletAddress,
                    ],
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
        if (asset?.protocol_type === PlatformType.MORPHO) {
            await borrowMorpho(asset, amount)
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
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled) &&
                    borrowTx.status !== 'view'
                }
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




// 0xef653419000000000000000000000000a090dd1a701408df1d4d0b85b716c87565f90467000000000000000000000000a0e430870c4604ccfc7b38ca7845b1ff653d0ff1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000004200000000000000000000000000000000000006000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000d09048c8b568dbf5f189302bea26c9edabfc485800000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000bef55718ad6000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000004200000000000000000000000000000000000006000000000000000000000000c1cba3fcea344f92d9239c08c0568f6f2f0ee4520000000000000000000000004a11590e5326138b514e08a9b52202d42077ca6500000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000d1d507e40be8000000000000000000000000000000000000000000000000000040327dbf2ad1b20

// 0xef653419000000000000000000000000a090dd1a701408df1d4d0b85b716c87565f90467000000000000000000000000a0e430870c4604ccfc7b38ca7845b1ff653d0ff1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000004200000000000000000000000000000000000006000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000d09048c8b568dbf5f189302bea26c9edabfc485800000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000bef55718ad6000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000004200000000000000000000000000000000000006000000000000000000000000c1cba3fcea344f92d9239c08c0568f6f2f0ee4520000000000000000000000004a11590e5326138b514e08a9b52202d42077ca6500000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000d1d507e40be8000000000000000000000000000000000000000000000000000040327dbf2ad1b00


// 0x62577ad00000000000000000000000004200000000000000000000000000000000000006000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000d09048c8b568dbf5f189302bea26c9edabfc485800000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000bef55718ad60000000000000000000000000000000000000000000000000000000016c59cad0c33000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000159c4a968d0a5a59c00000000000000000000000003adfaa573ac1a9b19d2b8f79a5aaffb9c2a0532

// 0x62577ad00000000000000000000000004200000000000000000000000000000000000006000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000d09048c8b568dbf5f189302bea26c9edabfc485800000000000000000000000046415998764c29ab2a25cbea6254146d50d226870000000000000000000000000000000000000000000000000bef55718ad60000000000000000000000000000000000000000000000000000000019819d7525350000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006400000000000000000000000003adfaa573ac1a9b19d2b8f79a5aaffb9c2a0532