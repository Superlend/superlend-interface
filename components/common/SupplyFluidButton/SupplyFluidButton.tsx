import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    BaseError,
    useAccount,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import { parseUnits } from 'ethers/lib/utils'
import {
    APPROVE_MESSAGE,
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    EIP_20_SIGNED_APPROVALS_LINK,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import CustomAlert from '@/components/alerts/CustomAlert'
import { TTxContext, TLendTx, useTxContext } from '@/context/tx-provider'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'
import FLUID_LEND_ABI from '@/data/abi/fluidLendABI.json'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import ExternalLink from '@/components/ExternalLink'
import { PlatformType } from '@/types/platform'
import { TPositionType, TScAmount } from '@/types'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import FLUID_VAULTS_ABI from '@/data/abi/fluidVaultsABI.json'
import { ETH_ADDRESSES } from '@/lib/constants'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { useAuth } from '@/context/auth-provider'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'

interface ISupplyFluidButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}

const SupplyFluidButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
    setActionType,
}: ISupplyFluidButtonProps) => {
    const { asset , ...platform } = assetDetails
    const tokenDetails = asset
    const isFluidProtocol = platform.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluidProtocol && !platform?.isVault
    const isFluidVaults = isFluidProtocol && platform?.isVault
    const { logEvent } = useAnalytics()

    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    
    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash, 1)
    
    const { walletAddress } = useWalletConnection()
    const { lendTx, setLendTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    // const amountBN = useMemo(() => {
    //     return amount
    //         ? parseUnits(amount, tokenDetails?.token?.decimals || 18)
    //         : BigNumber.from(0)
    // }, [amount, tokenDetails?.token?.decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: 'Close',
        default:
            lendTx.status === 'approve'
                ? isFluidVaults
                    ? 'Start earning'
                    : 'Start supplying'
                : isFluidLend
                  ? 'Supply to vault'
                  : 'Earn',
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
                  ? lendTx.status === 'view'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, txStatus.isConfirming, txStatus.isSuccessful)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    useEffect(() => {
        if (lendTx.status === 'lend') {
            if (isFluidVaults) {
                handleVaultsLendTx()
            } else {
                handleLendTx()
            }
        }
    }, [lendTx.status])

    const handleVaultsLendTx = useCallback(async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            if (!walletAddress) {
                throw new Error('Wallet address is required')
            }

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
                abi: FLUID_VAULTS_ABI,
                functionName: 'operate',
                args: [
                    assetDetails?.fluid_vault_nftId,
                    amount.amountParsed,
                    0,
                    walletAddress,
                ],
                value: ETH_ADDRESSES.includes(underlyingAssetAdress)
                    ? BigInt(amount.amountParsed)
                    : BigInt('0'),
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
                    console.log('catch error', error)
                })
        } catch (error) {
            error
            console.log('error', error)
        }
    }, [amount, tokenDetails, platform, walletAddress, writeContractAsync])

    const handleLendTx = useCallback(async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            if (!walletAddress) {
                throw new Error('Wallet address is required')
            }

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
                abi: FLUID_LEND_ABI,
                functionName: 'deposit',
                args: [amount.amountParsed, walletAddress as `0x${string}`],
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
    }, [amount, tokenDetails, platform, walletAddress, writeContractAsync])

    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful) {
            // Only set to 'view' if this was a supply transaction (not an approval)
            if (lendTx.status === 'lend') {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    errorMessage: '',
                }))

                logEvent('lend_completed', {
                    amount: amount.amountRaw,
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
                    event_data: 'SUPPLY',
                    authToken: accessToken || '',
                })
            } else if (lendTx.status === 'approve') {
                // For approval transactions, transition to 'lend' status to trigger supply
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'lend',
                    hash: hash || '',
                    errorMessage: '',
                }))

                logEvent('approve_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
            }
        } else if (txStatus.isFailed) {
            const errorMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setLendTx((prev: TLendTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
            }))
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt, hash, amount, assetDetails, walletAddress])

    // Update the status(Loading states) of the lendTx based on the isPending and txStatus states
    useEffect(() => {
        setLendTx((prev: any) => ({
            ...prev,
            isPending: isPending,
            isConfirming: txStatus.isConfirming,
            isConfirmed: txStatus.isSuccessful,
            isRefreshingAllowance: txStatus.isSuccessful,
        }))
    }, [isPending, txStatus.isConfirming, txStatus.isSuccessful])

    // useEffect(() => {
    //     if (lendTx.status === 'view') return

    //     if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
    //         if (lendTx.allowanceBN.gte(amount.amountParsed)) {
    //             setLendTx((prev: any) => ({
    //                 ...prev,
    //                 status: 'lend',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         } else {
    //             setLendTx((prev: any) => ({
    //                 ...prev,
    //                 status: 'approve',
    //                 hash: '',
    //                 errorMessage: '',
    //             }))
    //         }
    //     }
    // }, [lendTx.allowanceBN])

    useEffect(() => {
        if ((lendTx.status === 'approve' || lendTx.status === 'lend') && hash) {
            setLendTx((prev: any) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (lendTx.status === 'view' && hash) {
            setLendTx((prev: any) => ({
                ...prev,
                hash: hash || '',
            }))
        }
    }, [hash, lendTx.status])

    const onApproveSupply = async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            logEvent('approve_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.protocol_type,
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
                console.log(error)
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
                            the <span className="mr-1">asset.</span>
                            <ExternalLink href={EIP_20_SIGNED_APPROVALS_LINK}>
                                Learn more
                            </ExternalLink>
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
            {((lendTx.errorMessage.length > 0) && !error) && (
                <CustomAlert description={lendTx.errorMessage} />
            )}
            <Button
                disabled={isPending || txStatus.isConfirming || disabled}
                onClick={() => {
                    if (lendTx.status === 'approve') {
                        onApproveSupply()
                    } else if (lendTx.status === 'lend') {
                        if (isFluidVaults) {
                            handleVaultsLendTx()
                        } else {
                            handleLendTx()
                        }
                    } else {
                        handleCloseModal(false)
                        // setActionType?.('borrow')
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {lendTx.status !== 'view' && !isPending && !txStatus.isConfirming && (
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

export default SupplyFluidButton
