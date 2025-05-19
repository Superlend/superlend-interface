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
import { TLoopTx, TTxContext, useTxContext } from '@/context/tx-provider'
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
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'

interface ILoopButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const LoopButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ILoopButtonProps) => {
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
    const { walletAddress } = useWalletConnection()
    const { loopTx, setLoopTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    // const amountBN = useMemo(() => {
    //     return amount ? BigNumber.from(amount.amountRaw) : BigNumber.from(0)
    // }, [amount])

    const txBtnStatus: Record<string, string> = {
        pending:
            loopTx.status === 'approve'
                ? 'Approving token...'
                : 'Looping token...',
        confirming: 'Confirming...',
        success: 'Close',
        default:
            loopTx.status === 'approve' ? 'Start looping' : 'Loop token',
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
                    ? loopTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    useEffect(() => {
        if (loopTx.status === 'loop' && !ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            loop()
        }
    }, [loopTx.status])

    const loop = useCallback(async () => {
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
                        amount.amountRaw,
                        0,
                        walletAddress,
                        '0x',
                    ],
                })
                    .then((data) => {
                        setLoopTx((prev: TLoopTx) => ({
                            ...prev,
                            status: 'view',
                            errorMessage: '',
                        }))

                        logEvent('repay_completed', {
                            amount: amount.amountRaw,
                            token_symbol: assetDetails?.asset?.token?.symbol,
                            platform_name: assetDetails?.name,
                            chain_name:
                                CHAIN_ID_MAPPER[
                                Number(assetDetails?.chain_id) as ChainId
                                ],
                            wallet_address: walletAddress,
                        })

                        logUserEvent({
                            user_address: walletAddress,
                            event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                            platform_type: 'superlend_aggregator',
                            protocol_identifier: assetDetails?.protocol_identifier,
                            event_data: 'REPAY',
                            authToken: accessToken || '',
                        })
                    })
                    .catch((error) => {
                        setLoopTx((prev: TLoopTx) => ({
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
            setLoopTx((prev: TLoopTx) => ({
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
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('repay_completed', {
                        amount: amount.amountRaw,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
                    })

                    logUserEvent({
                        user_address: walletAddress,
                        event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                        platform_type: 'superlend_aggregator',
                        protocol_identifier: assetDetails?.protocol_identifier,
                        event_data: 'REPAY',
                        authToken: accessToken || '',
                    })
                })
                .catch((error) => {
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
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
            setLoopTx((prev: TLoopTx) => ({
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
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('repay_completed', {
                        amount: amount.amountRaw,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
                    })

                    logUserEvent({
                        user_address: walletAddress,
                        event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                        platform_type: 'superlend_aggregator',
                        protocol_identifier: assetDetails?.protocol_identifier,
                        event_data: 'REPAY',
                        authToken: accessToken || '',
                    })
                })
                .catch((error) => {
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                    }))
                })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
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
        setLoopTx((prev: TLoopTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    // useEffect(() => {
    //     if (loopTx.status === 'view') return

    //     if (
    //         !loopTx.isConfirmed &&
    //         !loopTx.isPending &&
    //         !loopTx.isConfirming &&
    //         Number(amount.amountParsed) > 0
    //     ) {
    //         if (loopTx.allowanceBN.gte(amount.amountParsed)) {
    //             setLoopTx((prev: TLoopTx) => ({
    //                 ...prev,
    //                 status: 'repay',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         } else {
    //             setLoopTx((prev: TLoopTx) => ({
    //                 ...prev,
    //                 status: 'approve',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         }
    //     }
    // }, [loopTx.allowanceBN])

    useEffect(() => {
        if (
            (loopTx.status === 'approve' || loopTx.status === 'loop') &&
            hash
        ) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (loopTx.status === 'view' && hash) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
            }))

            logEvent('loop_completed', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })
        }
    }, [hash, loopTx.status])

    const onApproveSupply = async () => {
        try {
            logEvent('approve_loop_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
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
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
                }))
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
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
            {/* {loopTx.status === 'approve' && (
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
            {loopTx.errorMessage.length > 0 && (
                <CustomAlert description={loopTx.errorMessage} />
            )}
            <Button
                disabled={isPending || isConfirming || disabled}
                onClick={() => {
                    if (loopTx.status === 'approve') {
                        onApproveSupply()
                    } else if (loopTx.status === 'loop') {
                        loop()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {loopTx.status !== 'view' && !isPending && !isConfirming && (
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

export default LoopButton
