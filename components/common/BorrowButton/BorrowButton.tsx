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
import { useCallback, useEffect, useMemo } from 'react'
// import { AddressType } from '../../../types/address'
// import { IAssetData } from '@interfaces/IAssetData'
import {
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
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
import { TBorrowTx, TTxContext, useTxContext } from '@/context/tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { getMaxAmountAvailableToBorrow } from '@/lib/getMaxAmountAvailableToBorrow'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'

import type { Market } from '@morpho-org/blue-sdk'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { BigNumber } from 'ethers'
import FLUID_VAULTS_ABI from '@/data/abi/fluidVaultsABI.json'
import { TScAmount } from '@/types'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { useAuth } from '@/context/auth-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
interface IBorrowButtonProps {
    disabled: boolean
    assetDetails: any
    amount: TScAmount
    handleCloseModal: (isVisible: boolean) => void
}

const txBtnStatus: Record<string, string> = {
    pending: 'Borrowing...',
    confirming: 'Confirming...',
    success: 'Close',
    default: 'Start borrowing',
}

const BorrowButton = ({
    disabled,
    assetDetails,
    amount,
    handleCloseModal,
}: IBorrowButtonProps) => {
    const { logEvent } = useAnalytics()
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { walletAddress } = useWalletConnection()
    const { borrowTx, setBorrowTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    // Protocol types
    const isCompound = assetDetails?.protocol_type === PlatformType.COMPOUND
    const isAave = assetDetails?.protocol_type === PlatformType.AAVE
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoVault = isMorpho && assetDetails?.vault
    const isMorphoMarket = isMorpho && assetDetails?.market
    const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
    const isFluidVault = isFluid && assetDetails?.isVault
    const isFluidLend = isFluid && !assetDetails?.isVault

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

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
                hash,
                isConfirmed: isConfirmed,
            }))
            logEvent('borrow_completed', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })
            logUserEvent({
                user_address: walletAddress as `0x${string}`,
                event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                platform_type: 'superlend_aggregator',
                protocol_identifier: assetDetails?.protocol_identifier,
                event_data: 'BORROW',
                authToken: accessToken || '',
            })
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
    // const amountBN = useMemo(() => {
    //     return amount
    //         ? parseUnits(amount.amountRaw ?? '0', assetDetails?.asset?.token?.decimals || 18)
    //         : BigNumber.from(0)
    // }, [amount, assetDetails?.asset?.token?.decimals])

    // const borrowCompound = useCallback(
    //     async (cTokenAddress: string, amount: TScAmount) => {
    //         try {
    //             writeContractAsync({
    //                 address: cTokenAddress as `0x${string}`,
    //                 abi: COMPOUND_ABI,
    //                 functionName: 'borrow',
    //                 args: [parseUnits(amount.amountRaw, assetDetails.decimals)],
    //             })
    //         } catch (error) {
    //             error
    //         }
    //     },
    //     [writeContractAsync, assetDetails]
    // )

    const borrowAave = useCallback(
        async (
            poolContractAddress: string,
            underlyingAssetAdress: string,
            amount: TScAmount,
            addressOfWallet: string
        ) => {
            try {
                logEvent('borrow_initiated', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                        Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })
                writeContractAsync({
                    address: poolContractAddress as `0x${string}`,
                    abi: AAVE_POOL_ABI,
                    functionName: 'borrow',
                    args: [
                        underlyingAssetAdress,
                        amount.amountParsed,
                        2,
                        0,
                        addressOfWallet,
                    ],
                }).catch((error) => {
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
        [writeContractAsync, assetDetails, handleCloseModal]
    )

    const borrowFluidVault = useCallback(
        async (
            poolContractAddress: string,
            amount: TScAmount,
        ) => {
            try {
                logEvent('borrow_initiated', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                        Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })

                writeContractAsync({
                    address: poolContractAddress as `0x${string}`,
                    abi: FLUID_VAULTS_ABI,
                    functionName: 'operate',
                    args: [
                        assetDetails?.fluid_vault_nftId,
                        0,
                        amount.amountParsed,
                        walletAddress,
                    ],
                }).catch((error) => {
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
        [writeContractAsync, assetDetails, handleCloseModal]
    )

    const borrowMorpho = useCallback(
        async (assetDetails: any, amount: TScAmount) => {
            const { asset, morphoMarketData, ...platform } = assetDetails

            try {
                logEvent('borrow_initiated', {
                    amount: amount.amountRaw,
                    token_symbol: asset?.token?.symbol,
                    platform_name: platform?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                        Number(platform?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })
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
                        amount.amountParsed,
                        0,
                        walletAddress,
                        walletAddress,
                    ],
                })
            } catch (error) {
                error
            }
        },
        [writeContractAsync, assetDetails, handleCloseModal]
    )

    const onBorrow = async () => {
        // if (isCompound) {
        //     await borrowCompound(assetDetails?.asset?.token?.address, amount)
        //     return
        // }
        if (isAave) {
            await borrowAave(
                assetDetails?.core_contract,
                assetDetails?.asset?.token?.address,
                amount,
                walletAddress as string
            )
            return
        }
        if (isMorpho) {
            await borrowMorpho(assetDetails, amount)
            return
        }
        if (isFluidVault) {
            await borrowFluidVault(
                assetDetails?.core_contract,
                amount,
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
            {/* {borrowTx.errorMessage.length > 0 && (
                <CustomAlert description={borrowTx.errorMessage} />
            )} */}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={isPending || isConfirming || disabled}
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