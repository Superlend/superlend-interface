'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import { Button } from '@/components/ui/button'
import { TActionType, TPositionType } from '@/types'
import { PlatformTypeMap } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    Check,
    CircleCheckIcon,
    CircleXIcon,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import {
    abbreviateNumber,
    capitalizeText,
    decimalPlacesCount,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
    isLowestValue,
} from '@/lib/utils'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { SLIPPAGE_PERCENTAGE, TX_EXPLORER_LINKS } from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TRepayTx,
    TTxContext,
    useTxContext,
    TWithdrawTx,
} from '@/context/tx-provider'
import { BigNumber } from 'ethers'
import CustomAlert from '@/components/alerts/CustomAlert'
import { Checkbox } from '@/components/ui/checkbox'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { ChainId } from '@/types/chain'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import ImageWithBadge from '@/components/ImageWithBadge'
import { getTooltipContent } from '@/components/dialogs/TxDialog'
import { getChainDetails } from '@/app/position-management/helper-functions'
import { useAssetsDataContext } from '@/context/data-provider'
import ExternalLink from '@/components/ExternalLink'
import { parseUnits } from 'ethers/lib/utils'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { ETH_ADDRESSES } from '@/lib/constants'
import TxPointsEarnedBanner from '../TxPointsEarnedBanner'

export function WithdrawOrRepayTxDialog({
    isOpen,
    setIsOpen,
    disabled,
    actionType,
    assetDetails,
    maxWithdrawAmount,
    maxRepayAmount,
    isLoadingMaxAmount,
    healthFactorValues,
    amount,
    setAmount,
    positionTokenAmount,
    errorMessage,
    userHasNoBorrowings,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    disabled: boolean
    actionType: TActionType
    assetDetails: any
    maxWithdrawAmount: {
        maxToWithdraw: string
        maxToWithdrawFormatted: string
        maxToWithdrawSCValue: string
        user: any
    }
    maxRepayAmount: {
        maxToRepay: string
        maxToRepayFormatted: string
        maxToRepaySCValue: string
        user: any
    }
    isLoadingMaxAmount: boolean
    healthFactorValues: {
        healthFactor: any
        newHealthFactor: any
    }
    amount: string
    setAmount: (amount: string) => void
    positionTokenAmount: string | number | undefined
    errorMessage: string | null
    userHasNoBorrowings?: boolean
}) {
    const { withdrawTx, setWithdrawTx, repayTx, setRepayTx } =
        useTxContext() as TTxContext
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const [localAssetDetails, setLocalAssetDetails] = useState(assetDetails)
    const [localPositionTokenAmount, setLocalPositionTokenAmount] = useState(positionTokenAmount)
    const [localMaxWithdrawAmount, setLocalMaxWithdrawAmount] = useState(maxWithdrawAmount)
    const [localMaxRepayAmount, setLocalMaxRepayAmount] = useState(maxRepayAmount)
    const [localUserHasNoBorrowings, setLocalUserHasNoBorrowings] = useState(userHasNoBorrowings)
    const searchParams = useSearchParams()
    const chain_id = searchParams?.get('chain_id') || '1'
    const { width: screenWidth } = useDimensions()
    // const [amount, setAmount] = useState('')
    const isDesktop = screenWidth > 768
    const isWithdrawAction = actionType === 'withdraw'
    const isTxFailed = isWithdrawAction
        ? withdrawTx.errorMessage.length > 0
        : repayTx.errorMessage.length > 0
    const { handleSwitchChain, isWalletConnected, walletAddress } =
        useWalletConnection()
    const { allChainsData } = useAssetsDataContext()
    const chainDetails = getChainDetails({
        allChainsData,
        chainIdToMatch: localAssetDetails?.chain_id,
    })
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    const currentTokenBalanceInWallet = (
        erc20TokensBalanceData[Number(chain_id)]?.[localAssetDetails?.asset?.token?.address.toLowerCase()]
            ?.balanceFormatted ?? 0
    ).toString()

    const maxAmount = isWithdrawAction
        ? (localUserHasNoBorrowings 
            ? localMaxWithdrawAmount.maxToWithdrawFormatted
            : (Number(localMaxWithdrawAmount.maxToWithdrawFormatted) * SLIPPAGE_PERCENTAGE).toFixed(localAssetDetails?.asset?.token?.decimals) ??
            '0')
        : ((Number(localMaxRepayAmount.maxToRepayFormatted) * SLIPPAGE_PERCENTAGE).toFixed(localAssetDetails?.asset?.token?.decimals) ??
            '0')

    const isMorphoVaultsProtocol = !!localAssetDetails?.vault 

    const withdrawTxCompleted = withdrawTx.isConfirmed && withdrawTx.hash && withdrawTx.status === 'view'
    const repayTxCompleted = repayTx.isConfirmed && repayTx.hash && repayTx.status === 'view'
    const showPointsEarnedBanner = withdrawTxCompleted || repayTxCompleted

    useEffect(() => {
        if (isWithdrawAction) {
            if (isMorphoVaultsProtocol) {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'approve',
                }))
            } else {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'withdraw',
                }))
            }
        }
    }, [isMorphoVaultsProtocol, isOpen, isWithdrawAction])

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetLendwithdrawTx()
        }
    }, [])

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        if (isOpen) {
            // Update local states when dialog opens
            setLocalAssetDetails(assetDetails)
            setLocalPositionTokenAmount(positionTokenAmount)
            setLocalMaxWithdrawAmount(maxWithdrawAmount)
            setLocalMaxRepayAmount(maxRepayAmount)
            setLocalUserHasNoBorrowings(userHasNoBorrowings)
            // Switch chain when the dialog is opened
            if (!!walletAddress) {
                handleSwitchChain(Number(chain_id))
            }
        }
    }, [isOpen, chain_id, maxWithdrawAmount, maxRepayAmount, assetDetails, positionTokenAmount, userHasNoBorrowings])

    function resetLendwithdrawTx() {
        setRepayTx((prev: TRepayTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            allowanceBN: BigNumber.from(0),
            isRefreshingAllowance: false,
            errorMessage: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
        }))
        setWithdrawTx((prev: TWithdrawTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        setIsOpen(open)

        if (open) {
            resetLendwithdrawTx()
        } else if (!open) {
            setAmount('')
        }
    }

    function isShowBlock(status: { repay: boolean; withdraw: boolean }) {
        return isWithdrawAction ? status.withdraw : status.repay
    }

    const inputUsdAmount =
        Number(amount) * Number(localAssetDetails?.asset?.token?.price_usd)

    function handleInputUsdAmount(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        const amountFormattedForLowestValue = getLowestDisplayValue(
            Number(amountFormatted)
        )
        return `${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isRepayTxInProgress = repayTx.isPending || repayTx.isConfirming
    const isWithdrawTxInProgress =
        withdrawTx.isPending || withdrawTx.isConfirming

    const isTxInProgress = isRepayTxInProgress || isWithdrawTxInProgress

    const repayTxSpinnerColor = repayTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const withdrawTxSpinnerColor = withdrawTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const txSpinnerColor = isWithdrawAction
        ? repayTxSpinnerColor
        : withdrawTxSpinnerColor

    const canDisplayExplorerLinkWhileLoading = isWithdrawAction
        ? withdrawTx.hash.length > 0 &&
        (withdrawTx.isConfirming || withdrawTx.isPending)
        : repayTx.hash.length > 0 && (repayTx.isConfirming || repayTx.isPending)

    function getNewHfColor() {
        const newHF = Number(healthFactorValues.newHealthFactor.toString())
        const HF = Number(healthFactorValues.healthFactor.toString())

        // if (newHF < HF) {
        //     return 'text-danger-500'
        // } else if (newHF > HF) {
        //     return 'text-success-500'
        // } else {
        //     return 'text-warning-500'
        // }

        if (newHF < 2) {
            return 'text-danger-500'
        }
    }

    function isHfLow() {
        return (
            Number(healthFactorValues.newHealthFactor.toString()) < Number(1.5)
        )
    }

    const currentPositionAmountInUSD = Number(localPositionTokenAmount) * Number(localAssetDetails?.asset?.token?.price_usd)
    const inputAmountInUSD = (Number(amount) * Number(localAssetDetails?.asset?.token?.price_usd))
    const newPositionAmountInUSD = currentPositionAmountInUSD - inputAmountInUSD

    const disableActionButton = disabled || isTxInProgress
    // || (!hasAcknowledgedRisk && !isWithdrawAction && isHfLow())

    const isDisabledMaxBtn = () => {
        if (isWithdrawAction) {
            return (
                !isWalletConnected ||
                Number(amount) ===
                Number(localMaxWithdrawAmount.maxToWithdrawFormatted) ||
                isLoadingMaxAmount
            )
        }

        return !isWalletConnected || newPositionAmountInUSD < 0 || currentPositionAmountInUSD === inputAmountInUSD || isLoadingMaxAmount
    }

    // SUB_COMPONENT: Trigger button to open the dialog
    const triggerButton = (
        <Button
            onClick={() => handleOpenChange(true)}
            variant={'secondaryOutline'}
            className="uppercase max-w-[100px] w-full py-3 px-4"
        >
            <span className="uppercase leading-[0]">
                {isWithdrawAction ? 'Withdraw' : 'Repay'}
            </span>
        </Button>
    )

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = !isTxInProgress ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SUB_COMPONENT: Tx in progress - Loading state UI
    const txInProgressLoadingState = isTxInProgress ? (
        <div className="flex flex-col items-center justify-center gap-6 mt-6">
            <LoaderCircle
                className={`text-secondary-500 w-28 h-28 animate-spin rounded-full`}
                strokeWidth={2.5}
            />
            <BodyText
                level="body1"
                weight="normal"
                className="text-gray-800 text-center max-w-[400px]"
            >
                {getTxInProgressText({
                    amount,
                    tokenName: localAssetDetails?.asset?.token?.symbol,
                    txStatus: isWithdrawAction ? withdrawTx : repayTx,
                    actionType,
                    isMorphoVaults: !!localAssetDetails?.vault,
                })}
            </BodyText>
            {canDisplayExplorerLinkWhileLoading && (
                <div className="flex items-center justify-between w-full py-[16px] bg-gray-200 lg:bg-white rounded-5 px-[24px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-gray-600"
                    >
                        View on explorer
                    </BodyText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800 flex items-center gap-[4px]"
                        >
                            <a
                                href={getExplorerLink(
                                    isWithdrawAction
                                        ? withdrawTx.hash
                                        : repayTx.hash,
                                    localAssetDetails?.chain_id ||
                                    localAssetDetails?.platform?.chain_id
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary-500"
                            >
                                {getTruncatedTxHash(
                                    isWithdrawAction
                                        ? withdrawTx.hash
                                        : repayTx.hash
                                )}
                            </a>
                            <ArrowUpRightIcon
                                width={16}
                                height={16}
                                className="stroke-secondary-500"
                            />
                        </BodyText>
                    </div>
                </div>
            )}
        </div>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                repay: true,
                withdraw: true,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        {isWithdrawAction ? 'Withdraw Token' : `Repay Borrowing`}
                    </HeadingText>
                    // </DialogTitle>
                )}
            {/* Confirmation details UI */}
            {isShowBlock({
                repay: false,
                withdraw: false,
            }) && (
                    <div className="flex flex-col items-center justify-center gap-[6px]">
                        <ImageWithDefault
                            src={localAssetDetails?.asset?.token?.logo}
                            alt={localAssetDetails?.asset?.token?.symbol}
                            width={40}
                            height={40}
                            className="rounded-full max-w-[40px] max-h-[40px]"
                        />
                        <HeadingText
                            level="h3"
                            weight="medium"
                            className="text-gray-800 truncate max-w-[200px]"
                        >
                            {amount} {localAssetDetails?.asset?.token?.symbol}
                        </HeadingText>
                        {isShowBlock({
                            repay: false,
                            withdraw: false,
                        }) && (
                                <Badge
                                    variant={isTxFailed ? 'destructive' : 'green'}
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isWithdrawAction && withdrawTx.status === 'view'
                                        ? 'Withdraw'
                                        : 'Repay'}{' '}
                                    {isTxFailed ? 'Failed' : 'Successful'}
                                    {!isTxFailed && (
                                        <CircleCheckIcon
                                            width={16}
                                            height={16}
                                            className="stroke-[#00AD31]"
                                        />
                                    )}
                                    {isTxFailed && (
                                        <CircleXIcon
                                            width={16}
                                            height={16}
                                            className="stroke-danger-500"
                                        />
                                    )}
                                </Badge>
                            )}
                        {isShowBlock({
                            repay: false,
                            withdraw: false,
                        }) && (
                                <Badge
                                    variant="green"
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    Token approved
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                    </div>
                )}
        </>
    )

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <>
            <div className="flex flex-col gap-[12px] max-w-full overflow-hidden">
                {/* Edit amount block when approving repay or withdraw - Block 1*/}
                {isShowBlock({
                    repay: (!repayTx.isPending && !repayTx.isConfirming) && (repayTx.status === 'approve' || (repayTx.status === 'repay' && ETH_ADDRESSES.includes(localAssetDetails?.asset?.token?.address ?? ''))),
                    withdraw:
                        !withdrawTx.isPending && !withdrawTx.isConfirming &&
                        (withdrawTx.status === 'approve' ||
                            (!isMorphoVaultsProtocol &&
                                withdrawTx.status === 'withdraw'
                            )),
                }) && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-gray-200 lg:bg-white rounded-5 w-full ring-1 ring-inset ring-secondary-300">
                            <ImageWithDefault
                                src={localAssetDetails?.asset?.token?.logo}
                                alt={localAssetDetails?.asset?.token?.symbol}
                                width={24}
                                height={24}
                                className="rounded-full max-w-6 max-h-6"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                                <div className="flex-1">
                                    <CustomNumberInput
                                        key={actionType}
                                        amount={amount}
                                        setAmount={(amount) => setAmount(amount)}
                                    />
                                </div>
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    {handleInputUsdAmount(
                                        inputUsdAmount.toString()
                                    )}
                                </BodyText>
                            </div>
                            <Button
                                variant="link"
                                className="uppercase text-[14px] font-medium w-fit p-0 ml-1"
                                onClick={() =>
                                    setAmount(maxAmount)
                                }
                                disabled={isDisabledMaxBtn()}
                            >
                                max
                            </Button>
                        </div>
                    )}
                {/* Display the token details after amount is set - Block 2 */}
                {isShowBlock({
                    repay: repayTx.isPending || repayTx.isConfirming ||
                        (repayTx.status === 'repay' && !ETH_ADDRESSES.includes(localAssetDetails?.asset?.token?.address ?? '')) || repayTx.status === 'view',
                    withdraw:
                        (isMorphoVaultsProtocol &&
                            withdrawTx.status === 'withdraw') ||
                        withdrawTx.status === 'view' ||
                        withdrawTx.isPending ||
                        withdrawTx.isConfirming,
                }) && (
                        <div className="flex items-center gap-2 px-6 py-2 bg-gray-200 lg:bg-white rounded-5 w-full">
                            <InfoTooltip
                                label={
                                    <ImageWithBadge
                                        mainImg={
                                            localAssetDetails?.asset?.token?.logo || ''
                                        }
                                        badgeImg={chainDetails?.logo || ''}
                                        mainImgAlt={
                                            localAssetDetails?.asset?.token?.symbol
                                        }
                                        badgeImgAlt={chainDetails?.name}
                                        mainImgWidth={32}
                                        mainImgHeight={32}
                                        badgeImgWidth={12}
                                        badgeImgHeight={12}
                                        badgeCustomClass={
                                            'bottom-[-2px] right-[1px]'
                                        }
                                    />
                                }
                                content={getTooltipContent({
                                    tokenSymbol: localAssetDetails?.asset?.token?.symbol,
                                    tokenLogo: localAssetDetails?.asset?.token?.logo,
                                    tokenName: localAssetDetails?.asset?.token?.name,
                                    chainName: chainDetails?.name || '',
                                    chainLogo: chainDetails?.logo || '',
                                })}
                            />
                            <div className="flex flex-col items-start gap-0 w-fit">
                                <HeadingText
                                    level="h3"
                                    weight="medium"
                                    className="text-gray-800 flex items-center gap-1"
                                >
                                    <span
                                        className="inline-block truncate max-w-[200px]"
                                        title={amount}
                                    >
                                        {amount}
                                    </span>
                                    <span
                                        className="inline-block truncate max-w-[100px]"
                                        title={localAssetDetails?.asset?.token?.symbol}
                                    >
                                        {localAssetDetails?.asset?.token?.symbol}
                                    </span>
                                </HeadingText>
                                <div className="flex items-center justify-start gap-1">
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        {handleInputUsdAmount(
                                            inputUsdAmount.toString()
                                        )}
                                    </BodyText>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600 flex items-center gap-1"
                                    >
                                        <span
                                            className="inline-block truncate max-w-full"
                                            title={capitalizeText(
                                                chainDetails?.name ?? ''
                                            )}
                                        >
                                            {capitalizeText(
                                                chainDetails?.name ?? ''
                                            )}
                                        </span>
                                    </BodyText>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600 truncate max-w-full"
                                        title={localAssetDetails?.name ?? ''}
                                    >
                                        {
                                            localAssetDetails?.name ?? ''
                                        }
                                    </BodyText>
                                </div>
                            </div>
                        </div>
                    )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-6 bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        repay: true,
                        withdraw: false,
                    }) && (
                            <div
                                className={`flex items-center justify-between w-full py-3`}
                            >
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Balance
                                </BodyText>
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                                ) : (
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-800"
                                    >
                                        {handleSmallestValue(currentTokenBalanceInWallet)}{" "}
                                        {localAssetDetails?.asset?.token?.symbol}
                                    </BodyText>
                                )}
                            </div>
                        )}
                    {isShowBlock({
                        repay: true,
                        withdraw: true,
                    }) && (
                            <div
                                className={`flex items-center justify-between w-full py-3`}
                            >
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    {isWithdrawAction
                                        ? 'Withdraw limit'
                                        : 'Borrowed'}
                                </BodyText>
                                {isLoadingMaxAmount ? (
                                    <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                                ) : (
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-800"
                                    >
                                        {handleSmallestValue(
                                            isWithdrawAction
                                                ? localMaxWithdrawAmount.maxToWithdrawFormatted
                                                : (localPositionTokenAmount ?? 0).toString()
                                        )}{' '}
                                        {localAssetDetails?.asset?.token?.symbol ??
                                            localAssetDetails?.token?.symbol}
                                    </BodyText>
                                )}
                            </div>
                        )}
                    {isShowBlock({
                        repay: true,
                        withdraw: true,
                    }) && (
                            <div className="flex items-center justify-between w-full py-3">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Remaining {isWithdrawAction ? 'supply' : 'debt'}
                                </BodyText>
                                <div className="flex flex-col items-end justify-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className={`text-gray-800`}
                                            >
                                                {hasLowestDisplayValuePrefix(currentPositionAmountInUSD)}
                                                ${isLowestValue(currentPositionAmountInUSD)
                                                    ? getLowestDisplayValue(currentPositionAmountInUSD)
                                                    : abbreviateNumber(currentPositionAmountInUSD)}
                                            </BodyText>
                                        </div>
                                        {(currentPositionAmountInUSD !== newPositionAmountInUSD || withdrawTx.status === 'view' || repayTx.status === 'view') && (
                                            <>
                                                <ArrowRightIcon
                                                    width={16}
                                                    height={16}
                                                    className="stroke-gray-800"
                                                    strokeWidth={2.5}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <BodyText
                                                        level="body2"
                                                        weight="normal"
                                                        className={`text-gray-800`}
                                                    >
                                                        {hasLowestDisplayValuePrefix(newPositionAmountInUSD)}
                                                        ${isLowestValue(newPositionAmountInUSD)
                                                            ? getLowestDisplayValue(newPositionAmountInUSD)
                                                            : abbreviateNumber(newPositionAmountInUSD)}
                                                    </BodyText>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        repay: !!Number(healthFactorValues.newHealthFactor),
                        withdraw: !!Number(healthFactorValues.newHealthFactor),
                    }) && (
                            <div className="flex items-center justify-between w-full py-3">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Health factor
                                </BodyText>
                                <div className="flex flex-col items-end justify-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={`text-gray-800`}
                                        >
                                            {healthFactorValues.healthFactor.toFixed(
                                                2
                                            )}
                                        </BodyText>
                                        <ArrowRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-gray-800"
                                            strokeWidth={2.5}
                                        />
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={getNewHfColor()}
                                        >
                                            {healthFactorValues.newHealthFactor.toFixed(
                                                2
                                            )}
                                        </BodyText>
                                    </div>
                                    <Label size="small" className="text-gray-600">
                                        Liquidation at &lt;1.0
                                    </Label>
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        repay: false,
                        withdraw: false,
                    }) && (
                            <div className="flex items-center justify-between w-full py-3">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    View on explorer
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-800 flex items-center gap-[4px]"
                                    >
                                        <a
                                            href={getExplorerLink(
                                                isWithdrawAction
                                                    ? withdrawTx.hash
                                                    : repayTx.hash,
                                                localAssetDetails?.chain_id ||
                                                localAssetDetails?.platform?.chain_id
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isWithdrawAction
                                                    ? withdrawTx.hash
                                                    : repayTx.hash
                                            )}
                                        </a>
                                        <ArrowUpRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-secondary-500"
                                        />
                                    </BodyText>
                                </div>
                            </div>
                        )}
                    {/* <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    View on explorer
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText level="body2" weight="normal" className="text-gray-800">
                                        0
                                    </BodyText>
                                    <ImageWithDefault src={'/images/tokens/eth.webp'} alt={"Ethereum"} width={16} height={16} className='rounded-full max-w-[16px] max-h-[16px]' />
                                </div>
                            </div> */}
                </div>
                {isShowBlock({
                    repay: false,
                    withdraw: false,
                    // withdrawTx.status === 'withdraw' &&
                    // !isWithdrawTxInProgress &&
                    // isHfLow(),
                }) && (
                        <div className="flex flex-col items-center justify-center">
                            <CustomAlert description="Borrowing this amount is not advisable, as the heath factor is close to 1, posing a risk of liquidation." />
                            <div
                                className="flex items-center gap-2 w-fit my-5"
                                onClick={() =>
                                    setHasAcknowledgedRisk(!hasAcknowledgedRisk)
                                }
                            >
                                <Checkbox
                                    id="terms"
                                    checked={hasAcknowledgedRisk}
                                />
                                <Label
                                    size="medium"
                                    className="text-gray-800"
                                    id="terms"
                                >
                                    I acknowledge the risks involved.
                                </Label>
                            </div>
                        </div>
                    )}
                {/* Approve Loading & Confirmation status block */}
                {isShowBlock({
                    repay:
                        (repayTx.status === 'approve' &&
                            (isRepayTxInProgress ||
                                (!isRepayTxInProgress &&
                                    repayTx.isConfirmed))) ||
                        repayTx.status === 'repay' ||
                        repayTx.status === 'view',
                    withdraw:
                        isMorphoVaultsProtocol &&
                        ((withdrawTx.status === 'approve' &&
                            (isWithdrawTxInProgress ||
                                (!isWithdrawTxInProgress &&
                                    withdrawTx.isConfirmed))) ||
                            withdrawTx.status === 'withdraw' ||
                            withdrawTx.status === 'view'),
                }) && (
                        <div className="py-1">
                            {((isRepayTxInProgress &&
                                repayTx.status === 'approve') ||
                                (isWithdrawTxInProgress &&
                                    withdrawTx.status === 'approve')) && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center justify-start gap-2">
                                            <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-gray-600"
                                            >
                                                {(repayTx.isPending ||
                                                    withdrawTx.isPending) &&
                                                    'Waiting for confirmation...'}
                                                {(repayTx.isConfirming ||
                                                    withdrawTx.isConfirming) &&
                                                    'Approving...'}
                                            </BodyText>
                                        </div>
                                        {repayTx.hash &&
                                            repayTx.status === 'approve' && (
                                                <ExternalLink
                                                    href={getExplorerLink(
                                                        isWithdrawAction
                                                            ? withdrawTx.hash
                                                            : repayTx.hash,
                                                        localAssetDetails?.chain_id ||
                                                        localAssetDetails?.platform
                                                            ?.chain_id
                                                    )}
                                                >
                                                    <BodyText
                                                        level="body2"
                                                        weight="normal"
                                                        className="text-inherit"
                                                    >
                                                        View on explorer
                                                    </BodyText>
                                                </ExternalLink>
                                            )}
                                    </div>
                                )}
                            {((!isRepayTxInProgress && repayTx.isConfirmed) ||
                                repayTx.status === 'repay' ||
                                repayTx.status === 'view' ||
                                (!isWithdrawTxInProgress &&
                                    withdrawTx.isConfirmed) ||
                                withdrawTx.status === 'withdraw' ||
                                withdrawTx.status === 'view') &&
                                (!ETH_ADDRESSES.includes(localAssetDetails?.asset?.token?.address ?? '')) && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center justify-start gap-2">
                                            <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                                <Check
                                                    className="w-5 h-5 stroke-[#013220]/75"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="text-gray-800"
                                            >
                                                Token approved
                                            </BodyText>
                                        </div>
                                        {(repayTx.hash && !isMorphoVaultsProtocol &&
                                            (repayTx.isConfirming ||
                                                repayTx.isConfirmed)) ||
                                            (withdrawTx.hash && !isMorphoVaultsProtocol &&
                                                (withdrawTx.isConfirming ||
                                                    withdrawTx.isConfirmed) && (
                                                    <ExternalLink
                                                        href={getExplorerLink(
                                                            isWithdrawAction
                                                                ? withdrawTx.hash
                                                                : repayTx.hash,
                                                            localAssetDetails?.chain_id ||
                                                            localAssetDetails?.platform
                                                                ?.chain_id
                                                        )}
                                                    >
                                                        <BodyText
                                                            level="body2"
                                                            weight="normal"
                                                            className="text-inherit"
                                                        >
                                                            View on explorer
                                                        </BodyText>
                                                    </ExternalLink>
                                                ))
                                        }
                                    </div>
                                )}
                        </div>
                    )}
                {/* Withdraw/Repay Loading & Confirmation status block */}
                {isShowBlock({
                    repay:
                        (repayTx.status === 'repay' &&
                            (isRepayTxInProgress ||
                                (!isRepayTxInProgress &&
                                    repayTx.isConfirmed))) ||
                        repayTx.status === 'view',
                    withdraw:
                        (withdrawTx.status === 'view' &&
                            withdrawTx.isConfirmed) ||
                        isWithdrawTxInProgress,
                }) && (
                        <div className="py-1">
                            {(isRepayTxInProgress ||
                                (isWithdrawTxInProgress &&
                                    (withdrawTx.status === 'withdraw' ||
                                        withdrawTx.status === 'view'))) && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center justify-start gap-2">
                                            <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-gray-600"
                                            >
                                                {(withdrawTx.isPending ||
                                                    repayTx.isPending) &&
                                                    `Waiting for confirmation...`}
                                                {(withdrawTx.isConfirming ||
                                                    repayTx.isConfirming) &&
                                                    `${actionType === 'withdraw' ? 'Withdrawing' : 'Repaying'}...`}
                                            </BodyText>
                                        </div>
                                        {((repayTx.hash && (repayTx.isConfirming || repayTx.isConfirmed)) ||
                                            (withdrawTx.hash && (withdrawTx.isConfirming || withdrawTx.isConfirmed))) && (
                                                <ExternalLink
                                                    href={getExplorerLink(
                                                        isWithdrawAction
                                                            ? withdrawTx.hash
                                                            : repayTx.hash,
                                                        localAssetDetails?.chain_id ||
                                                        localAssetDetails?.platform
                                                            ?.chain_id
                                                    )}
                                                >
                                                    <BodyText
                                                        level="body2"
                                                        weight="normal"
                                                        className="text-inherit"
                                                    >
                                                        View on explorer
                                                    </BodyText>
                                                </ExternalLink>
                                            )}
                                    </div>
                                )}
                            {((withdrawTx.status === 'view' &&
                                withdrawTx.isConfirmed) ||
                                (repayTx.status === 'view' &&
                                    repayTx.isConfirmed)) && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center justify-start gap-2">
                                            <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                                <Check
                                                    className="w-5 h-5 stroke-[#013220]/75"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                                className="text-gray-800"
                                            >
                                                {actionType === 'withdraw'
                                                    ? 'Withdraw successful'
                                                    : 'Repay successful'}
                                            </BodyText>
                                        </div>
                                        {((repayTx.hash && (repayTx.isConfirming || repayTx.isConfirmed)) ||
                                            (withdrawTx.hash && (withdrawTx.isConfirming || withdrawTx.isConfirmed))) && (
                                                <ExternalLink
                                                    href={getExplorerLink(
                                                        isWithdrawAction
                                                            ? withdrawTx.hash
                                                            : repayTx.hash,
                                                        localAssetDetails?.chain_id ||
                                                        localAssetDetails?.platform
                                                            ?.chain_id
                                                    )}
                                                >
                                                    <BodyText
                                                        level="body2"
                                                        weight="normal"
                                                        className="text-inherit"
                                                    >
                                                        View on explorer
                                                    </BodyText>
                                                </ExternalLink>
                                            )}
                                    </div>
                                )}
                        </div>
                    )}
                {/* Error Message */}
                {
                    (errorMessage && withdrawTx.status !== 'view' && repayTx.status !== 'view') &&
                    <CustomAlert description={errorMessage} />
                }
                {showPointsEarnedBanner && <TxPointsEarnedBanner />}
                {/* Block 4 */}
                <ActionButton
                    disabled={disableActionButton}
                    handleCloseModal={handleOpenChange}
                    asset={localAssetDetails}
                    amount={getActionButtonAmount({
                        amount,
                        actionType,
                        assetDetails: localAssetDetails,
                        maxRepayAmount: localMaxRepayAmount,
                        maxWithdrawAmount: localMaxWithdrawAmount,
                        userHasNoBorrowings: localUserHasNoBorrowings,
                    })}
                    actionType={actionType}
                />
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={isOpen}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px] max-w-[450px]"
                    showCloseButton={false}
                >
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {/* {txInProgressLoadingState} */}
                    {/* Initial Confirmation UI */}
                    <DialogHeader>{contentHeader}</DialogHeader>

                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={isOpen} dismissible={false}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {/* X Icon to close the drawer */}
                {closeContentButton}
                {/* Tx in progress - Loading state UI */}
                {/* {txInProgressLoadingState} */}
                <DrawerHeader>{contentHeader}</DrawerHeader>
                {/* <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter> */}
                {contentBody}
            </DrawerContent>
        </Drawer>
    )
}

function getExplorerLink(hash: string, chainId: ChainId) {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    actionType,
    isMorphoVaults,
}: {
    amount: string
    tokenName: string
    txStatus: TRepayTx | TWithdrawTx
    actionType: TActionType
    isMorphoVaults: boolean
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve ${isMorphoVaults && actionType === 'withdraw' ? 'withdraw of' : actionType === 'repay' ? 'repaying of' : 'spending'} ${formattedText} from your wallet`,
            repay: `Approve transaction for repaying ${formattedText} from your wallet`,
            withdraw: `Approve transaction for withdrawing ${formattedText} from your wallet`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            repay: `Confirming transaction for repaying ${formattedText} from your wallet`,
            withdraw: `Confirming transaction for withdrawing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${actionType === 'withdraw' ? 'withdrawing' : 'repaying'} ${formattedText} from your wallet`,
        }
    }
    return textByStatus[txStatus.status]
}

function handleSmallestValue(amount: string, maxDecimalsToDisplay: number = 2) {
    const amountFormatted = hasExponent(amount)
        ? Math.abs(Number(amount)).toFixed(10)
        : amount.toString()
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted), maxDecimalsToDisplay)} ${getLowestDisplayValue(Number(amountFormatted), maxDecimalsToDisplay)}`
}

const getActionButtonAmount = ({
    amount,
    actionType,
    assetDetails,
    maxRepayAmount,
    maxWithdrawAmount,
    userHasNoBorrowings,
}: {
    amount: string
    actionType: TActionType
    assetDetails: any
    maxRepayAmount: any
    maxWithdrawAmount: any
    userHasNoBorrowings?: boolean
}) => {
    // For withdrawal with no borrowings, use the exact amount without any conversions to avoid precision loss
    const amountWithSlippage = (actionType === 'withdraw' && userHasNoBorrowings) 
        ? amount  // Use exact amount for users with no borrowings
        : (Number(amount) * SLIPPAGE_PERCENTAGE).toFixed(assetDetails?.asset?.token?.decimals)
    if (actionType === 'repay') {
        const amountParsed = parseUnits(
            amount === '' ? '0' : amountWithSlippage,
            assetDetails?.asset?.token?.decimals ?? 0
        ).toString()
        return {
            amountRaw: amountWithSlippage,
            amountParsed,
            scValue:
                amountParsed === maxRepayAmount.maxToRepay
                    ? maxRepayAmount.maxToRepaySCValue
                    : '-' + amountParsed.toString(),
        }
    }
    if (actionType === 'withdraw') {
        const amountParsed = parseUnits(
            amount === '' ? '0' : amountWithSlippage,
            assetDetails?.asset?.token?.decimals ?? 0
        ).toString()
        const v = {
            amountRaw: amountWithSlippage,
            amountParsed,
            scValue:
                amountParsed === maxWithdrawAmount.maxToWithdraw
                    ? maxWithdrawAmount.maxToWithdrawSCValue
                    : '-' + amountParsed.toString(),
        }

        return v
    }
    return { amountRaw: '0', scValue: '0', amountParsed: '0' }
}
