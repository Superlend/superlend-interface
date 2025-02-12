'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import { Button } from '@/components/ui/button'
import { TPositionType } from '@/types'
import { PlatformType } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheck,
    CircleCheckIcon,
    CircleXIcon,
    InfinityIcon,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { useSwitchChain } from 'wagmi'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    decimalPlacesCount,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    CHAIN_ID_MAPPER,
    TX_EXPLORER_LINKS,
} from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TLendTx,
    TTxContext,
    useTxContext,
    TBorrowTx,
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
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'

// TYPES
interface IConfirmationDialogProps {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    maxBorrowAmount: string
    setAmount: (amount: string) => void
    healthFactorValues: {
        healthFactor: any
        newHealthFactor: any
    }
    isVault?: boolean
    open: boolean
    setOpen: (open: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}

// MAIN COMPONENT
export function ConfirmationDialog({
    disabled,
    positionType,
    assetDetails,
    amount,
    setAmount,
    balance,
    maxBorrowAmount,
    healthFactorValues,
    isVault,
    open,
    setOpen,
    setActionType,
}: IConfirmationDialogProps) {
    const { lendTx, setLendTx, borrowTx, setBorrowTx, withdrawTx, repayTx } =
        useTxContext() as TTxContext
    const { logEvent } = useAnalytics()
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || 1
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isLendPositionType = positionType === 'lend'
    const isTxFailed = isLendPositionType
        ? lendTx.errorMessage.length > 0
        : borrowTx.errorMessage.length > 0
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault
    const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluid && !assetDetails?.isVault
    const isFluidVault = isFluid && assetDetails?.isVault
    const { walletAddress, handleSwitchChain } = useWalletConnection()

    // useEffect(() => {
    //     // Reset the tx status when the dialog is closed
    //     return () => {
    //         resetLendBorrowTx()
    //     }
    // }, [])

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        if (open) {
            // Switch chain when the dialog is opened
            handleSwitchChain(Number(chain_id))
        }
    }, [open])

    function resetLendBorrowTx() {
        setLendTx((prev: TLendTx) => ({
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
        setBorrowTx((prev: TLendTx) => ({
            ...prev,
            status: 'borrow',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (open) {
            // setAmount('')
            resetLendBorrowTx()
        } else if (!open && (lendTx.status !== 'approve' || borrowTx.status !== 'borrow')) {
            setAmount('')
        }
    }

    function isShowBlock(status: { lend: boolean; borrow: boolean }) {
        return isLendPositionType ? status.lend : status.borrow
    }

    const inputUsdAmount =
        Number(amount) * Number(assetDetails?.asset?.token?.price_usd)

    function handleInputUsdAmount(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        const amountFormattedForLowestValue = getLowestDisplayValue(
            Number(amountFormatted)
        )
        return `~${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isLendTxInProgress = lendTx.isPending || lendTx.isConfirming
    const isBorrowTxInProgress = borrowTx.isPending || borrowTx.isConfirming

    const isTxInProgress = isLendTxInProgress || isBorrowTxInProgress

    const lendTxSpinnerColor = lendTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const borrowTxSpinnerColor = borrowTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const txSpinnerColor = isLendPositionType
        ? lendTxSpinnerColor
        : borrowTxSpinnerColor

    const canDisplayExplorerLinkWhileLoading = isLendPositionType
        ? lendTx.hash.length > 0 && (lendTx.isConfirming || lendTx.isPending)
        : borrowTx.hash.length > 0 &&
        (borrowTx.isConfirming || borrowTx.isPending)

    function getNewHfColor() {
        const newHF = Number(healthFactorValues.newHealthFactor.toString())
        const HF = Number(healthFactorValues.healthFactor.toString())

        if (newHF < HF) {
            return 'text-danger-500'
        } else if (newHF > HF) {
            return 'text-success-500'
        } else {
            return 'text-warning-500'
        }
    }

    function isHfLow() {
        return (
            Number(healthFactorValues.newHealthFactor.toString()) < Number(1.5)
        )
    }

    const disableActionButton =
        disabled ||
        (!hasAcknowledgedRisk && !isLendPositionType && isHfLow())

    function getTriggerButtonText() {
        const buttonTextMap: { [key: string]: string } = {
            'morpho-markets': 'Add Collateral',
            'fluid-lend': 'Add Collateral',
            'morpho-vault': 'Supply to vault',
            'default': 'Lend',
            'borrow': 'Borrow'
        }

        const key = isLendPositionType
            ? `${isMorphoMarkets ? 'morpho-markets' : 
                isMorphoVault ? 'morpho-vault' : 
                isFluidVault ? 'fluid-lend' : 
                'default'}`
            : 'borrow'
        return buttonTextMap[key]
    }

    function handleActionButtonClick() {
        handleOpenChange(true)
        logEvent(
            `${getTriggerButtonText().toLowerCase().split(' ').join('_')}_clicked`,
            {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            }
        )
    }

    // SUB_COMPONENT: Trigger button to open the dialog
    const triggerButton = (
        <Button
            onClick={handleActionButtonClick}
            disabled={disabled}
            variant="primary"
            className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
        >
            <span className="uppercase leading-[0]">
                {getTriggerButtonText()}
            </span>
            <ArrowRightIcon
                width={16}
                height={16}
                className="stroke-white group-[:disabled]:opacity-50"
            />
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
                    tokenName: assetDetails?.asset?.token?.symbol,
                    txStatus: isLendPositionType
                        ? lendTx
                        : borrowTx,
                    positionType,
                    actionTitle: isLendPositionType
                        ? isMorphoMarkets || isMorphoVault
                            ? 'supply'
                            : 'lend'
                        : 'borrow',
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
                                    isLendPositionType
                                        ? lendTx.hash
                                        : borrowTx.hash,
                                    assetDetails?.chain_id ||
                                    assetDetails?.platform?.chain_id
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary-500"
                            >
                                {getTruncatedTxHash(
                                    isLendPositionType
                                        ? lendTx.hash
                                        : borrowTx.hash
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
                lend: lendTx.status === 'approve' && !isLendTxInProgress,
                borrow: borrowTx.status === 'borrow' && !isBorrowTxInProgress,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        {isLendPositionType
                            ? isMorphoMarkets
                                ? 'Add Collateral'
                                : isMorphoVault
                                    ? 'Supply to vault'
                                    : 'Lend Collateral'
                            : `Borrow ${assetDetails?.asset?.token?.symbol}`}
                    </HeadingText>
                    // </DialogTitle>
                )}
            {/* Confirmation details UI */}
            {isShowBlock({
                lend:
                    (lendTx.status === 'lend' && !isLendTxInProgress) ||
                    (lendTx.status === 'view' && !isLendTxInProgress),
                borrow:
                    // (borrowTx.status === 'borrow' && !isBorrowTxInProgress) ||
                    borrowTx.status === 'view' && !isBorrowTxInProgress,
            }) && (
                    <div className="flex flex-col items-center justify-center gap-[6px]">
                        <ImageWithDefault
                            src={assetDetails?.asset?.token?.logo}
                            alt={assetDetails?.asset?.token?.symbol}
                            width={40}
                            height={40}
                            className="rounded-full max-w-[40px] max-h-[40px]"
                        />
                        <HeadingText
                            level="h3"
                            weight="medium"
                            className="text-gray-800"
                        >
                            {amount} {assetDetails?.asset?.token?.symbol}
                        </HeadingText>
                        {isShowBlock({
                            lend: lendTx.status === 'view',
                            borrow: borrowTx.status === 'view',
                        }) && (
                                <Badge
                                    variant={isTxFailed ? 'destructive' : 'green'}
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isLendPositionType &&
                                        lendTx.status === 'view'
                                        ? isMorphoMarkets
                                            ? 'Add Collateral'
                                            : isMorphoVault
                                                ? 'Supply to vault'
                                                : 'Lend'
                                        : 'Borrow'}{' '}
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
                            lend: lendTx.status === 'lend' && !isLendTxInProgress,
                            borrow: false,
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
            <div className="flex flex-col gap-[12px]">
                {/* Block 1 */}
                {isShowBlock({
                    lend: lendTx.status === 'approve' && !isLendTxInProgress,
                    borrow:
                        borrowTx.status === 'borrow' && !isBorrowTxInProgress,
                }) && (
                        <div className="flex items-center gap-[8px] px-[24px] py-[18.5px] bg-gray-200 lg:bg-white rounded-5 w-full">
                            <ImageWithDefault
                                src={assetDetails?.asset?.token?.logo}
                                alt={assetDetails?.asset?.token?.symbol}
                                width={24}
                                height={24}
                                className="rounded-full max-w-[24px] max-h-[24px]"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                                <HeadingText
                                    level="h3"
                                    weight="normal"
                                    className="text-gray-800"
                                >
                                    {Number(amount).toFixed(
                                        decimalPlacesCount(amount)
                                    )}
                                </HeadingText>
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
                        </div>
                    )}
                {/* Block 2 */}
                {isShowBlock({
                    lend: lendTx.status === 'approve' && !isLendTxInProgress,
                    borrow: false,
                }) && (
                        <div
                            className={`flex items-center ${isLendPositionType ? 'justify-end' : 'justify-between'} px-[24px] mb-[4px] gap-1`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Bal:
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {handleSmallestValue(
                                    (Number(balance) - Number(amount)).toString()
                                )}{' '}
                                {assetDetails?.asset?.token?.symbol}
                            </BodyText>
                        </div>
                    )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-[24px] bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        lend: !isLendTxInProgress && !isMorphoMarkets,
                        borrow: !isBorrowTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Net APY
                                </BodyText>
                                <Badge variant="green">
                                    {abbreviateNumber(
                                        isLendPositionType
                                            ? Number(
                                                (assetDetails?.asset?.apy ||
                                                    assetDetails?.asset
                                                        ?.supply_apy ||
                                                    assetDetails?.supply_apy ||
                                                    assetDetails?.apy) ??
                                                0
                                            )
                                            : Number(
                                                (assetDetails?.asset
                                                    ?.variable_borrow_apy ||
                                                    assetDetails?.variable_borrow_apy) ??
                                                0
                                            )
                                    )}
                                    %
                                </Badge>
                            </div>
                        )}
                    {isShowBlock({
                        lend: false,
                        borrow:
                            borrowTx.status === 'borrow' &&
                            !isBorrowTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    New limit
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-800"
                                    >
                                        {handleSmallestValue(
                                            (
                                                Number(maxBorrowAmount) -
                                                Number(amount)
                                            ).toString(),
                                            getMaxDecimalsToDisplay(
                                                assetDetails?.asset?.token
                                                    ?.symbol ||
                                                assetDetails?.token?.symbol
                                            )
                                        )}
                                    </BodyText>
                                    <ImageWithDefault
                                        src={assetDetails?.asset?.token?.logo}
                                        alt={assetDetails?.asset?.token?.symbol}
                                        width={16}
                                        height={16}
                                        className="rounded-full max-w-[16px] max-h-[16px]"
                                    />
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        lend: false,
                        borrow:
                            borrowTx.status === 'borrow' &&
                            !isBorrowTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
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
                                            {Number(healthFactorValues.healthFactor) < 0 && (
                                                <InfinityIcon className='w-4 h-4' />
                                            )}
                                            {Number(healthFactorValues.healthFactor) >= 0 && (
                                                healthFactorValues.healthFactor.toFixed(
                                                    2
                                                ))}
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
                        lend:
                            (lendTx.status === 'lend' ||
                                lendTx.status === 'view') &&
                            lendTx.hash.length > 0 &&
                            !isLendTxInProgress,
                        borrow:
                            borrowTx.status === 'view' &&
                            borrowTx.hash.length > 0 &&
                            !isBorrowTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
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
                                                isLendPositionType
                                                    ? lendTx.hash
                                                    : borrowTx.hash,
                                                assetDetails?.chain_id ||
                                                assetDetails?.platform?.chain_id
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isLendPositionType
                                                    ? lendTx.hash
                                                    : borrowTx.hash
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
                    lend: false,
                    borrow:
                        borrowTx.status === 'borrow' &&
                        !isBorrowTxInProgress &&
                        isHfLow(),
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
                {/* Block 4 */}
                <div className={`${isTxInProgress ? 'invisible h-0' : ''}`}>
                    <ActionButton
                        disabled={disableActionButton}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        setActionType={setActionType}
                        actionType={positionType}
                    />
                </div>
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px]"
                    showCloseButton={false}
                >
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {txInProgressLoadingState}
                    {/* Initial Confirmation UI */}
                    <DialogHeader>{contentHeader}</DialogHeader>

                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} dismissible={false}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {/* X Icon to close the drawer */}
                {closeContentButton}
                {/* Tx in progress - Loading state UI */}
                {txInProgressLoadingState}
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

// HELPER FUNCTIONS ====================================
// HELPER FUNCTION: 1
function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    positionType,
    actionTitle,
}: {
    amount: string
    tokenName: string
    txStatus: TLendTx | TBorrowTx
    positionType: TPositionType
    actionTitle: string
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve spending ${formattedText} from your wallet`,
            lend: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            borrow: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            lend: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            borrow: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    }
    return textByStatus[txStatus.status]
}

// HELPER FUNCTION: 2
function getExplorerLink(hash: string, chainId: ChainId) {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

// HELPER FUNCTION: 3
function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

// HELPER FUNCTION: 4
export function handleSmallestValue(
    amount: string,
    maxDecimalsToDisplay: number = 2
) {
    const amountFormatted = hasExponent(amount)
        ? Math.abs(Number(amount)).toFixed(10)
        : amount.toString()
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted), maxDecimalsToDisplay)} ${getLowestDisplayValue(Number(amountFormatted), maxDecimalsToDisplay)}`
}

// HELPER FUNCTION: 5
export function getMaxDecimalsToDisplay(tokenSymbol: string): number {
    return tokenSymbol?.toLowerCase().includes('btc') ||
        tokenSymbol?.toLowerCase().includes('eth')
        ? 4
        : 2
}