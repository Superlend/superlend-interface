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
import { TWithdrawTx, TTxContext, useTxContext } from '@/context/tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { getMaxAmountAvailableToBorrow } from '@/lib/getMaxAmountAvailableToBorrow'
import { Vault } from '@morpho-org/blue-sdk'
import { BundlerAction } from '@morpho-org/morpho-blue-bundlers/pkg'
import { walletActions } from 'viem'
import { BUNDLER_ADDRESS_MORPHO } from '@/lib/constants'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'

interface IWithdrawButtonProps {
    disabled: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
}

const txBtnStatus: Record<string, string> = {
    pending: 'Withdrawing...',
    confirming: 'Confirming...',
    success: 'Close',
    error: 'Close',
    default: 'Withdraw',
}

const WithdrawButton = ({
    disabled,
    asset,
    amount,
    handleCloseModal,
}: IWithdrawButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { address: walletAddress } = useAccount()
    const { withdrawTx, setWithdrawTx } = useTxContext() as TTxContext
    // console.log('error from useWriteContract', error)

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    useEffect(() => {
        if (hash) {
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                status: 'view',
                hash,
            }))
        }

        if (hash && isConfirmed) {
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                status: 'view',
                hash,
                isConfirmed: isConfirmed,
            }))
        }
    }, [hash, isConfirmed])

    // Update the status(Loading states) of the lendTx based on the isPending and isConfirming states
    useEffect(() => {
        setWithdrawTx((prev: TWithdrawTx) => ({
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
                    : !isPending &&
                        !isConfirming &&
                        !isConfirmed &&
                        withdrawTx.status === 'view'
                      ? 'error'
                      : 'default'
        ]

    const withdrawCompound = useCallback(
        async (cTokenAddress: string, amount: string) => {
            try {
                writeContractAsync({
                    address: cTokenAddress as `0x${string}`,
                    abi: COMPOUND_ABI,
                    functionName: 'withdraw',
                    args: [parseUnits(amount, asset.decimals)],
                })
            } catch (error) {
                error
            }
        },
        [writeContractAsync, asset]
    )

    const withdrawAave = useCallback(
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
                    functionName: 'withdraw',
                    args: [
                        underlyingAssetAdress,
                        parseUnits(amount, asset.asset.token.decimals),
                        // 2,
                        // 0,
                        addressOfWallet,
                    ],
                }).catch((error) => {
                    // console.log('error', error)
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        errorMessage:
                            error.message ||
                            'Something went wrong, please try again',
                    }))
                })
            } catch (error: any) {
                // console.log('error outer catch', error)
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    errorMessage:
                        error.message ||
                        'Something went wrong, please try again',
                }))
            }
        },
        [writeContractAsync, asset, handleCloseModal]
    )

    const withdrawMorphoVault = useCallback(
        async (asset: any, amount: string) => {
            let vault = asset?.vault as Vault

            let amountToWithdraw = parseUnits(
                amount,
                asset.asset.token.decimals
            )

            // //  convert asset to share
            let shareAmount = await vault.toShares(amountToWithdraw.toBigInt())

            // apprive the vault.address to bunder
            let bunder_address = BUNDLER_ADDRESS_MORPHO[asset.chain_id]

            let bunder_calls = [
                BundlerAction.erc4626Withdraw(
                    vault.address,
                    amountToWithdraw.toString(),
                    shareAmount.toString(),
                    walletAddress as string,
                    walletAddress as string
                ),
            ]

            writeContractAsync({
                address: vault.address,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [bunder_address as `0x${string}`, shareAmount.toString()],
            })
                .then(async () => {
                    writeContractAsync({
                        address: bunder_address as `0x${string}`,
                        abi: MORPHO_BUNDLER_ABI,
                        functionName: 'multicall',
                        args: [bunder_calls],
                    }).catch((error) => {
                        setWithdrawTx((prev: TWithdrawTx) => ({
                            ...prev,
                            isPending: false,
                            isConfirming: false,
                            isConfirmed: false,
                            // errorMessage: error.message || 'Something went wrong',
                        }))
                    })
                })
                .catch((error) => {
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage: error.message || 'Something went wrong',
                    }))
                })
        },
        []
    )

    const onWithdraw = async () => {
        if (asset?.protocol_type === PlatformType.COMPOUND) {
            await withdrawCompound(asset?.asset?.token?.address, amount)
            return
        }
        if (asset?.protocol_type === PlatformType.AAVE) {
            await withdrawAave(
                POOL_AAVE_MAP[asset?.platform_name as PlatformValue],
                asset?.asset?.token?.address,
                amount,
                walletAddress as string
            )
            return
        }
        if (asset?.protocol_type === PlatformType.MORPHO && asset?.vault) {
            await withdrawMorphoVault(asset, amount)
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
            {/* {borrowTx.errorMessage.length > 0 && (
                <CustomAlert description={borrowTx.errorMessage} />
            )} */}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled) &&
                    withdrawTx.status !== 'view'
                }
                onClick={
                    withdrawTx.status === 'withdraw'
                        ? onWithdraw
                        : () => handleCloseModal(false)
                }
            >
                {txBtnText}
                {withdrawTx.status !== 'view' &&
                    !isPending &&
                    !isConfirming && (
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

export default WithdrawButton
