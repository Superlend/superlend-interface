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
    MORPHO_ETHERSCAN_TUTORIAL_LINK,
    MORPHO_WEBSITE_LINK,
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
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import { Market, Vault } from '@morpho-org/blue-sdk'
import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'
import { BUNDLER_ADDRESS_MORPHO } from '@/lib/constants'

import { BundlerAction } from '@morpho-org/morpho-blue-bundlers/pkg'
import ExternalLink from '@/components/ExternalLink'
import { PlatformType } from '@/types/platform'
import { TPositionType } from '@/types'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

interface ISupplyMorphoButtonProps {
    disabled: boolean
    assetDetails: any // Replace with proper type
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}

const SupplyMorphoButton = ({
    disabled,
    assetDetails,
    amount,
    handleCloseModal,
    setActionType,
}: ISupplyMorphoButtonProps) => {
    const tokenDetails = assetDetails.asset
    const platform = assetDetails.platform
    const morphoMarketData = assetDetails.morphoMarketData
    const isMorpho = assetDetails.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault
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
    const { address: walletAddress } = useAccount()
    const { lendTx, setLendTx } = useTxContext() as TTxContext
    const amountBN = useMemo(() => {
        return amount
            ? parseUnits(amount, tokenDetails?.token?.decimals || 18)
            : BigNumber.from(0)
    }, [amount, tokenDetails?.token?.decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: isMorphoMarkets ? 'Go To Borrow' : 'Close',
        default:
            lendTx.status === 'approve'
                ? 'Approve token'
                : isMorphoMarkets
                    ? 'Add Collateral'
                    : isMorphoVault
                        ? 'Supply to vault'
                        : 'Lend Collateral',
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
            setLendTx((prev: any) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            if (!walletAddress) {
                throw new Error('Wallet address is required')
            }

            const isVault = assetDetails.isVault

            if (isVault) {
                const vault = morphoMarketData as Vault
                const newAmount = parseUnits(
                    amount,
                    tokenDetails.token.decimals
                )
                const shares = vault.toShares(newAmount.toBigInt())

                // minAmount of share will be 0.99% of the shares
                const minAmount = BigNumber.from(shares)
                    .mul(99)
                    .div(100)
                    .toBigInt()

                const calls = [
                    BundlerAction.erc20TransferFrom(
                        vault.asset,
                        newAmount.toBigInt()
                    ),
                    BundlerAction.erc4626Deposit(
                        vault.address,
                        newAmount.toBigInt(),
                        minAmount,
                        walletAddress
                    ),
                ]

                logEvent('lend_initiated', {
                    amount,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })

                writeContractAsync({
                    address: BUNDLER_ADDRESS_MORPHO[
                        assetDetails.chainId
                    ] as `0x${string}`,
                    abi: MORPHO_BUNDLER_ABI,
                    functionName: 'multicall',
                    args: [calls],
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
                            chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
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
            } else {
                //  check if asset is collateral or borrow
                // If collateral, supplyCollateral if borrowSupply supply
                const isCollateral = !tokenDetails.borrow_enabled

                if (isCollateral) {
                    logEvent('add_collateral_initiated', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                        wallet_address: walletAddress,
                    })
                    // call morpho market supplyCollateral
                    writeContractAsync({
                        address: platform.core_contract,
                        abi: MORPHO_MARKET_ABI,
                        functionName: 'supplyCollateral',

                        // marketParams
                        // assets
                        // onBehalf
                        // data
                        args: [
                            {
                                loanToken: morphoMarketData.params.loanToken,
                                collateralToken:
                                    morphoMarketData.params.collateralToken,
                                oracle: morphoMarketData.params.oracle,
                                irm: morphoMarketData.params.irm,
                                lltv: morphoMarketData.params.lltv,
                            },
                            parseUnits(amount, tokenDetails.token.decimals),
                            walletAddress,
                            '0x',
                        ],
                    })
                        .then((data) => {
                            setLendTx((prev: TLendTx) => ({
                                ...prev,
                                status: 'view',
                                errorMessage: '',
                            }))

                            logEvent('add_collateral_completed', {
                                amount,
                                token_symbol: assetDetails?.asset?.token?.symbol,
                                platform_name: assetDetails?.name,
                                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
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
                } else {
                    logEvent('lend_initiated', {
                        amount,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name,
                        chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                        wallet_address: walletAddress,
                    })

                    // call morpho market supply
                    writeContractAsync({
                        address: platform.core_contract,
                        abi: MORPHO_MARKET_ABI,
                        functionName: 'supply',
                        args: [
                            {
                                loanToken: morphoMarketData.params.loanToken,
                                collateralToken:
                                    morphoMarketData.params.collateralToken,
                                oracle: morphoMarketData.params.oracle,
                                irm: morphoMarketData.params.irm,
                                lltv: morphoMarketData.params.lltv,
                            },
                            parseUnits(amount, tokenDetails.token.decimals),
                            0,
                            walletAddress,
                            '0x',
                        ],
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
                                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
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
                }
            }

            // TODO: Implement Morpho supply logic here
            // Example structure:
            // writeContractAsync({
            //     address: asset.core_contract,
            //     abi: MORPHO_POOL_ABI,
            //     functionName: 'supply',
            //     args: [
            //         asset.asset.token.address,
            //         parseUnits(amount, asset.asset.token.decimals),
            //         walletAddress,
            //         0,
            //     ],
            // })
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
            // status: (isConfirmed && prev.status === 'lend' && hash) ? 'view' : prev.status,
        }))
    }, [isPending, isConfirming, isConfirmed])

    useEffect(() => {
        if (lendTx.status === 'view') return

        if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
            if (lendTx.allowanceBN.gte(amountBN)) {
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
                platform_name: assetDetails?.name,
                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            // TODO: Implement Morpho approve logic here
            // Example structure:
            writeContractAsync({
                address: assetDetails.asset.token.address,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [
                    assetDetails.isVault
                        ? BUNDLER_ADDRESS_MORPHO[assetDetails.chainId]
                        : platform.core_contract,
                    parseUnits(amount, assetDetails.asset.token.decimals),
                ],
            })
        } catch (error) {
            error
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {lendTx.status === 'approve' && !assetDetails.isVault && (
                <CustomAlert
                    variant="info"
                    hasPrefixIcon={false}
                    description={
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-secondary-500"
                        >
                            Note: Adding collateral to Morpho Markets does not yield.
                        </BodyText>
                    }
                />
            )}
            {lendTx.status === 'approve' && (
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
            )}
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
            {!morphoMarketData && (
                <CustomAlert
                    description={
                        <div className="flex flex-col items-start gap-2">
                            <BodyText level="body2" weight="medium">
                                Error: Service Unavailable
                            </BodyText>
                            <BodyText level="body2" weight="normal">
                                The Morpho API is temporarily down. Please try
                                again later.
                            </BodyText>
                            <ExternalLink
                                href={MORPHO_WEBSITE_LINK}
                                className="text-xs md:text-sm"
                            >
                                Morpho Website
                            </ExternalLink>
                        </div>
                    }
                />
            )}
            <Button
                disabled={
                    (isPending ||
                        isConfirming ||
                        disabled ||
                        !morphoMarketData) &&
                    lendTx.status !== 'view'
                }
                onClick={() => {
                    if (lendTx.status === 'approve') {
                        onApproveSupply()
                    } else if (lendTx.status === 'lend') {
                        supply()
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

export default SupplyMorphoButton
