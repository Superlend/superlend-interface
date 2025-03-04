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
import { TPositionType } from '@/types'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import FLUID_VAULTS_ABI from '@/data/abi/fluidVaultsABI.json'
import { ETH_ADDRESSES } from '@/lib/constants'

interface ISupplyFluidButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: {
        amountRaw: string
        scValue: string
    }
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
    const tokenDetails = assetDetails.asset
    const platform = assetDetails.platform
    const isFluidProtocol = assetDetails.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluidProtocol && !assetDetails?.isVault
    const isFluidVaults = isFluidProtocol && assetDetails?.isVault
    const { logEvent } = useAnalytics()

    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 1,
            hash,
        })
    const { walletAddress } = useWalletConnection()
    const { lendTx, setLendTx } = useTxContext() as TTxContext

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
        success: isFluidVaults ? 'Go To Borrow' : 'Close',
        default:
            lendTx.status === 'approve'
                ? isFluidVaults
                    ? 'Start earning'
                    : 'Start supplying'
                :isFluidLend
                        ? 'Supply to vault'
                        : 'Earn',
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
                functionName: 'operate',
                args: [
                    assetDetails?.fluid_vault_nftId,
                    amount.amountRaw,
                    0,
                    walletAddress,
                ],
                value: underlyingAssetAdress === ETH_ADDRESSES[0] ? BigInt(amount.amountRaw) : BigInt('0'),
            })
                .then((data) => {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('lend_completed', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
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
                amount,
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
                args: [amount.amountRaw, walletAddress as `0x${string}`],
            })
                .then((data) => {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('lend_completed', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
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

    useEffect(() => {
        setLendTx((prev: any) => ({
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
            if (lendTx.allowanceBN.gte(amount.amountRaw)) {
                setLendTx((prev: any) => ({
                    ...prev,
                    status: 'lend',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setLendTx((prev: any) => ({
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
                amount,
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
                args: [poolContractAddress, amount.amountRaw],
            })
                .catch((error) => {
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
            {lendTx.errorMessage.length > 0 && (
                <CustomAlert description={lendTx.errorMessage} />
            )}
            <Button
                disabled={(isPending || isConfirming || disabled)}
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
                        setActionType?.('borrow')
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

export default SupplyFluidButton
