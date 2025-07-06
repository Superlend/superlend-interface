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
import { ETH_ADDRESSES } from '@/lib/constants'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TScAmount } from '@/types'
import { useAuth } from '@/context/auth-provider'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'

interface IRepayButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
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
    
    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash, 2)
    
    const { walletAddress } = useWalletConnection()
    const { repayTx, setRepayTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    // const amountBN = useMemo(() => {
    //     return amount ? BigNumber.from(amount.amountRaw) : BigNumber.from(0)
    // }, [amount])

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
        isSuccessful: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isSuccessful
                    ? repayTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, txStatus.isConfirming, txStatus.isSuccessful)

    // Memoize logging data to prevent unnecessary re-renders
    const repayCompletedLogData = useMemo(() => ({
        amount: amount.amountRaw,
        token_symbol: assetDetails?.asset?.token?.symbol,
        platform_name: assetDetails?.name,
        chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
        wallet_address: walletAddress,
    }), [amount.amountRaw, assetDetails?.asset?.token?.symbol, assetDetails?.name, assetDetails?.chain_id, walletAddress])

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    // Initialize transaction status based on token type
    useEffect(() => {
        if (repayTx.status === 'view' || repayTx.status === 'approve' || repayTx.status === 'repay') {
            return; // Don't re-initialize if already set
        }

        if (ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            // For ETH/native tokens, no approval needed
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                status: 'repay',
                hash: '',
                errorMessage: '',
            }))
        } else {
            // For ERC20 tokens, start with approval
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))
        }
    }, [underlyingAssetAdress, repayTx.status])

    useEffect(() => {
        if (repayTx.status === 'repay' && !ETH_ADDRESSES.includes(underlyingAssetAdress)) {
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
        const isFluidVault = isFluid && assetDetails?.isVault
        const isFluidLend = isFluid && !assetDetails?.isVault

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
                        amount.amountParsed,
                        0,
                        walletAddress,
                        '0x',
                    ],
                })
                    .then((data) => {
                        // Transaction initiated successfully, let useEffect handle completion
                        setRepayTx((prev: TRepayTx) => ({
                            ...prev,
                            errorMessage: '',
                        }))

                        logUserEvent({
                            user_address: walletAddress as `0x${string}`,
                            event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                            platform_type: 'superlend_aggregator',
                            protocol_identifier: assetDetails?.protocol_identifier,
                            event_data: 'REPAY',
                            authToken: accessToken || '',
                        })
                    })
                    .catch((error) => {
                        if (repayTx.isPending || repayTx.isConfirming || repayTx.isConfirmed) {
                            setRepayTx((prev: TRepayTx) => ({
                                ...prev,
                                errorMessage: '',
                            }))
                            return;
                        }
                        console.error('Repay Morpho Market error (SC catch block):\n', error)
                        setRepayTx((prev: TRepayTx) => ({
                            ...prev,
                            isPending: false,
                            isConfirming: false,
                            isConfirmed: false,
                            status: 'repay', // Reset to repay status for retry
                            errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                        }))
                    })
            } catch (error) {
                if (repayTx.isPending || repayTx.isConfirming || repayTx.isConfirmed) {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        errorMessage: '',
                    }))
                    return;
                }
                console.error('Repay Morpho Market error (Catch block):\n', error)
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    status: 'repay', // Reset to repay status for retry
                    errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                }))
            }
        },
        [
            amount,
            poolContractAddress,
            underlyingAssetAdress,
            walletAddress,
            handleCloseModal,
            writeContractAsync,
            decimals,
        ]
    )

    const repayFluidVault = useCallback(async () => {
        let amountToRepay = amount.scValue
        //  parseUnits(
        //     `${-Number(amount)}`,
        //     assetDetails.asset.token.decimals
        // )

        try {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                status: 'repay',
                hash: '',
                errorMessage: '',
            }))

            logEvent('repay_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: poolContractAddress,
                abi: FLUID_VAULTS_ABI,
                functionName: 'operate',
                args: [
                    assetDetails?.fluid_vault_nftId,
                    0,
                    BigInt(amountToRepay.toString()),
                    walletAddress,
                ],
                value: ETH_ADDRESSES.includes(underlyingAssetAdress)
                    ? BigInt(amount.amountParsed.toString())
                    : BigInt('0'),
            })
                .then((data) => {
                    // Transaction initiated successfully, let useEffect handle completion
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        errorMessage: '',
                    }))

                    logUserEvent({
                        user_address: walletAddress as `0x${string}`,
                        event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                        platform_type: 'superlend_aggregator',
                        protocol_identifier: assetDetails?.protocol_identifier,
                        event_data: 'REPAY',
                        authToken: accessToken || '',
                    })
                })
                .catch((error) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        status: 'repay', // Reset to repay status for retry
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                status: 'repay', // Reset to repay status for retry
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
                amount: amount.amountRaw,
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
                    amount.amountParsed,
                    2,
                    walletAddress,
                ],
            })
                .then((data) => {
                    // Transaction initiated successfully, let useEffect handle completion
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        errorMessage: '',
                    }))

                    logUserEvent({
                        user_address: walletAddress as `0x${string}`,
                        event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                        platform_type: 'superlend_aggregator',
                        protocol_identifier: assetDetails?.protocol_identifier,
                        event_data: 'REPAY',
                        authToken: accessToken || '',
                    })
                })
                .catch((error) => {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        status: 'repay', // Reset to repay status for retry
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                status: 'repay', // Reset to repay status for retry
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

    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful) {
            if (repayTx.status === 'approve') {
                // Approval successful, move to repay
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    status: 'repay',
                    hash: hash || '',
                    isConfirmed: true,
                }))
            } else if (repayTx.status === 'repay') {
                // Repay successful, move to view
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    isConfirmed: true,
                }))
                
                logEvent('repay_completed', repayCompletedLogData)
            }
        } else if (txStatus.isFailed) {
            const errorMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
                // Reset status to retry - keep the same status to allow retry
                status: repayTx.status === 'approve' ? 'approve' : 'repay',
            }))
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt, hash, repayTx.status, logEvent, repayCompletedLogData])

    // Update the status(Loading states) of the repayTx based on the isPending and txStatus states
    useEffect(() => {
        setRepayTx((prev: TRepayTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: txStatus.isConfirming,
            isConfirmed: txStatus.isSuccessful,
            isRefreshingAllowance: txStatus.isSuccessful,
        }))
    }, [isPending, txStatus.isConfirming, txStatus.isSuccessful])

    // useEffect(() => {
    //     if (repayTx.status === 'view') return

    //     if (
    //         !repayTx.isConfirmed &&
    //         !repayTx.isPending &&
    //         !repayTx.isConfirming &&
    //         Number(amount.amountParsed) > 0
    //     ) {
    //         if (repayTx.allowanceBN.gte(amount.amountParsed)) {
    //             setRepayTx((prev: TRepayTx) => ({
    //                 ...prev,
    //                 status: 'repay',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         } else {
    //             setRepayTx((prev: TRepayTx) => ({
    //                 ...prev,
    //                 status: 'approve',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         }
    //     }
    // }, [repayTx.allowanceBN])

    // Update hash when transaction is initiated
    useEffect(() => {
        if (
            (repayTx.status === 'approve' || repayTx.status === 'repay') &&
            hash &&
            repayTx.hash !== hash
        ) {
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
    }, [hash, repayTx.status, repayTx.hash])

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
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress as `0x${string}`,
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
                args: [poolContractAddress, amount.amountParsed],
            }).catch((error) => {
                // Handle immediate errors (like user rejection)
                const errorMessage = humaniseWagmiError(error)
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    errorMessage: errorMessage,
                    status: 'approve', // Reset to approve status for retry
                }))
            })
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMessage = humaniseWagmiError(error)
            setRepayTx((prev: TRepayTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
                status: 'approve', // Reset to approve status for retry
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
                disabled={isPending || txStatus.isConfirming || disabled}
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
                {repayTx.status !== 'view' && !isPending && !txStatus.isConfirming && (
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
