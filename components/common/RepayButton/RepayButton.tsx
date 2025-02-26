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
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
// import { getErrorText } from '@/lib/getErrorText'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { TRepayTx, TTxContext, useTxContext } from '@/context/tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'

import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import { PlatformType } from '@/types/platform'
import { Market } from '@morpho-org/blue-sdk'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
// import { useCreatePendingToast } from '@/hooks/useCreatePendingToast'
import FLUID_VAULTS_ABI from '@/data/abi/fluidVaultsABI.json'

interface IRepayButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const RepayButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: IRepayButtonProps) => {
    const { logEvent } = useAnalytics()
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 2,
            hash,
        })
    const { address: walletAddress } = useAccount()
    const { repayTx, setRepayTx } = useTxContext() as TTxContext

    const amountBN = useMemo(() => {
        return amount ? parseUnits(amount, decimals) : BigNumber.from(0)
    }, [amount, decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            repayTx.status === 'approve'
                ? 'Approving token...'
                : 'Repaying token...',
        confirming: 'Confirming...',
        success: 'Close',
        default:
            repayTx.status === 'approve' ? 'Start repaying' : 'Repay token',
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
                  ? repayTx.status === 'view'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    useEffect(() => {
        if (repayTx.status === 'repay') {
            repay()
        }
    }, [repayTx.status])

    const repay = useCallback(async () => {
        const isCompound = assetDetails?.protocol_type === PlatformType.COMPOUND
        const isAave = assetDetails?.protocol_type === PlatformType.AAVE
        const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
        const isMorphoVault = isMorpho && assetDetails?.vault
        const isMorphoMarket = isMorpho && assetDetails?.market
        const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
        const isFluidVault = isFluid && assetDetails?.vault
        const isFluidLend = isFluid && !assetDetails?.vault

        if (isAave) {
            await repayAave()
            return
        }
        if (isMorphoMarket && assetDetails?.market) {
            await repayMorphoMarket(assetDetails)
            return
        }
        if (isFluidVault) {
            await repayFluidVault()
            return
        }
    }, [amount])

    const repayMorphoMarket = useCallback(
        async (assetDetails: any) => {
            try {
                const morphoMarketData = assetDetails?.market as Market

            logEvent('repay_initiated', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: assetDetails.core_contract as `0x${string}`,
                abi: MORPHO_MARKET_ABI,
                functionName: 'repay',
                args: [

                    {
                        loanToken: morphoMarketData.params.loanToken,
                        collateralToken:
                            morphoMarketData.params.collateralToken,
                        oracle: morphoMarketData.params.oracle,
                        irm: morphoMarketData.params.irm,
                        lltv: morphoMarketData.params.lltv,
                    },
                    amountBN,
                    0,
                    walletAddress,
                    '0x',
                ],
            }).then((data) => {
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    status: 'view',
                    errorMessage: '',
                }))

                logEvent('repay_completed', {
                    amount,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
            }).catch((error) => {
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
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

    const repayFluidVault = useCallback(async () => {
        try {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                status: 'repay',
                hash: '',
                errorMessage: '',
            }))

            logEvent('repay_initiated', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: poolContractAddress,
                abi: FLUID_VAULTS_ABI,
                functionName: 'repay',
                args: [
                    underlyingAssetAdress,
                    parseUnits(amount, decimals),
                    2,
                    walletAddress,
                ],
            })
                .then((data) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('repay_completed', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                        wallet_address: walletAddress,
                    })
                })
                .catch((error) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
            }))
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

    const repayAave = useCallback(async () => {
        try {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                status: 'repay',
                hash: '',
                errorMessage: '',
            }))

            logEvent('repay_initiated', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: poolContractAddress,
                abi: AAVE_POOL_ABI,
                functionName: 'repay',
                args: [
                    underlyingAssetAdress,
                    parseUnits(amount, decimals),
                    2,
                    walletAddress,
                ],
            })
                .then((data) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('repay_completed', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                        wallet_address: walletAddress,
                    })
                })
                .catch((error) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
            }))
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
        setRepayTx((prev: TRepayTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    useEffect(() => {
        if (repayTx.status === 'view') return

        if (
            !repayTx.isConfirmed &&
            !repayTx.isPending &&
            !repayTx.isConfirming &&
            amountBN.gt(0)
        ) {
            if (repayTx.allowanceBN.gte(amountBN)) {
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    status: 'repay',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: '',
                }))
            }
        }
    }, [repayTx.allowanceBN])

    useEffect(() => {
        if (
            (repayTx.status === 'approve' || repayTx.status === 'repay') &&
            hash
        ) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (repayTx.status === 'view' && hash) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                hash: hash || '',
            }))

            logEvent('repay_completed', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })
        }
    }, [hash, repayTx.status])

    const onApproveSupply = async () => {
        // if (!isConnected) {
        //     // If not connected, prompt connection first
        //     try {
        //         const connector = connectors[0] // Usually metamask/injected connector
        //         await connect({ connector })
        //         return
        //     } catch (error) {
        //         console.error('Connection failed:', error)
        //         return
        //     }
        // }

        try {
            logEvent('approve_repay_initiated', {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setRepayTx((prev: TRepayTx) => ({
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
            }).catch((error) => {
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                }))
            })
        } catch (error: any) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
            }))
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {/* {repayTx.status === 'approve' && (
                <CustomAlert
                    variant="info"
                    hasPrefixIcon={false}
                    description={
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-secondary-500"
                        >
                            Note: You need to complete an &apos;approval
                            transaction&apos; granting permission to move funds from your wallet as the
                            first step before supplying the asset.
                            <a
                                href="https://eips.ethereum.org/EIPS/eip-2612"
                                target="_blank"
                                className="text-secondary-500 pb-[0.5px] border-b border-secondary-500 hover:border-secondary-200 ml-1"
                            >
                                Learn more
                            </a>
                            .
                        </BodyText>
                    }
                />
            )} */}
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {repayTx.errorMessage.length > 0 && (
                <CustomAlert description={repayTx.errorMessage} />
            )}
            <Button
                disabled={isPending || isConfirming || disabled}
                onClick={() => {
                    if (repayTx.status === 'approve') {
                        onApproveSupply()
                    } else if (repayTx.status === 'repay') {
                        repay()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {repayTx.status !== 'view' && !isPending && !isConfirming && (
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

export default RepayButton
