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
import { TLendTx, TTxContext, useTxContext } from '@/context/tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { ChainId } from '@/types/chain'
import { useAssetsDataContext } from '@/context/data-provider'
// import { useCreatePendingToast } from '@/hooks/useCreatePendingToast'
import { TScAmount } from '@/types'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAuth } from '@/context/auth-provider'

interface ISupplyAaveButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const SupplyAaveButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ISupplyAaveButtonProps) => {
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
    const { lendTx, setLendTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    // const amountBN = useMemo(() => {
    //     return amount ? parseUnits(amount, decimals) : BigNumber.from(0)
    // }, [amount, decimals])

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: 'Close',
        default: lendTx.status === 'approve' ? 'Start earning' : 'Earn',
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

    useEffect(() => {
        if (lendTx.status === 'lend') {
            supply()
        }
    }, [lendTx.status])

    const supply = useCallback(async () => {
        try {
            setLendTx((prev: TLendTx) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            logEvent('lend_initiated', {
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
                functionName: 'supply',
                args: [
                    underlyingAssetAdress,
                    amount.amountParsed,
                    walletAddress,
                    0,
                ],
            })
                .then((data) => {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('lend_completed', {
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
                        event_data: 'SUPPLY',
                        authToken: accessToken || '',
                    })
                })
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
        setLendTx((prev: TLendTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    useEffect(() => {
        if (lendTx.status === 'view') return

        if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
            if (lendTx.allowanceBN.gte(amount.amountParsed)) {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'lend',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: '',
                }))
            }
        }
    }, [lendTx.allowanceBN])

    useEffect(() => {
        if ((lendTx.status === 'approve' || lendTx.status === 'lend') && hash) {
            setLendTx((prev: TLendTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (lendTx.status === 'view' && hash) {
            setLendTx((prev: TLendTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
    }, [hash, lendTx.status])

    const onApproveSupply = async () => {
        logEvent('approve_clicked', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name,
            chain_name:
                CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
            wallet_address: walletAddress,
        })

        try {
            setLendTx((prev: TLendTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            logEvent('approve_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [poolContractAddress, amount.amountParsed],
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
    }

    return (
        <div className="flex flex-col gap-2">
            {/* {lendTx.status === 'approve' && (
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
                            transaction&apos; granting permission to move funds
                            from your wallet as the first step before supplying
                            the asset.
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
        </div>
    )
}

export default SupplyAaveButton
