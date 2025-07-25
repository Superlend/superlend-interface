'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import { Button } from '@/components/ui/button'
import { TPositionType, TAssetDetails, TChain, TTransactionType } from '@/types'
import { PlatformType } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    Check,
    CircleCheckIcon,
    CircleXIcon,
    InfinityIcon,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect, useContext } from 'react'
import {
    abbreviateNumber,
    capitalizeText,
    checkDecimalPlaces,
    cn,
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
import { CHAIN_ID_MAPPER, TX_EXPLORER_LINKS } from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TLendTx,
    TTxContext,
    useTxContext,
    TBorrowTx,
    TLoopTx,
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
import { getChainDetails } from '@/app/position-management/helper-functions'
import { useAssetsDataContext } from '@/context/data-provider'
import InfoTooltip from '../tooltips/InfoTooltip'
import ImageWithBadge from '../ImageWithBadge'
import ExternalLink from '../ExternalLink'
import { parseUnits } from 'ethers/lib/utils'
import { ETH_ADDRESSES } from '@/lib/constants'
import TxPointsEarnedBanner from '../TxPointsEarnedBanner'
import { useIguanaDexData } from '@/hooks/protocols/useIguanaDexData'

type TLoopAssetDetails = Omit<TAssetDetails, 'asset'> & {
    supplyAsset: TAssetDetails['asset']
    borrowAsset: TAssetDetails['asset']
    pathTokens: string[]
    pathFees: string[]
    netAPY: string
    loopNetAPY: string
}

// TYPES
interface IConfirmationDialogProps {
    disabled: boolean
    positionType: TPositionType
    assetDetails?: TAssetDetails
    loopAssetDetails?: TLoopAssetDetails
    amount?: string
    lendAmount?: string
    borrowAmount?: string
    borrowAmountRaw?: string
    flashLoanAmount?: string
    balance: string
    maxBorrowAmount: {
        maxToBorrow: string
        maxToBorrowFormatted: string
        maxToBorrowSCValue: string
        user: any
    }
    setAmount: (amount: string) => void
    healthFactorValues: {
        healthFactor: any
        newHealthFactor: any
    }
    isVault?: boolean
    open: boolean
    setOpen: (open: boolean) => void
    setActionType?: (actionType: TPositionType) => void
    leverage?: number
}

// MAIN COMPONENT
export function ConfirmationDialog({
    disabled,
    positionType,
    assetDetails,
    loopAssetDetails,
    amount = '0',
    lendAmount = '0',
    borrowAmount = '0',
    borrowAmountRaw = '0',
    flashLoanAmount = '0',
    setAmount,
    balance,
    maxBorrowAmount,
    healthFactorValues,
    isVault,
    open,
    setOpen,
    setActionType,
    leverage,
}: IConfirmationDialogProps) {
    const { lendTx, setLendTx, borrowTx, setBorrowTx, withdrawTx, repayTx, loopTx, setLoopTx } =
        useTxContext() as TTxContext
    const positionTypeTxStatusMap: Record<TTransactionType, TLendTx | TBorrowTx | TLoopTx> = {
        'lend': lendTx,
        'borrow': borrowTx,
        'loop': loopTx,
    }
    
    // Helper function to safely get tx status, with fallback for 'all' position type
    const getTxStatus = (type: TPositionType): TLendTx | TBorrowTx | TLoopTx => {
        if (type === 'all') return lendTx // Fallback to lendTx for 'all' case
        return positionTypeTxStatusMap[type as TTransactionType]
    }
    
    // Helper function to convert position type to transaction type
    const getTransactionType = (type: TPositionType): TTransactionType => {
        if (type === 'all') return 'lend' // Default to 'lend' for 'all' case
        return type as TTransactionType
    }
    
    const { logEvent } = useAnalytics()
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const searchParams = useSearchParams() || new URLSearchParams()
    const chain_id = searchParams.get('chain_id') || '1'
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isLendPositionType = positionType === 'lend'
    const isTxFailed = getTxStatus(positionType).errorMessage.length > 0
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault
    const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluid && !assetDetails?.isVault
    const isFluidVault = isFluid && assetDetails?.isVault
    const { walletAddress, handleSwitchChain } = useWalletConnection()
    const { allChainsData } = useAssetsDataContext()
    // const { hasAppleFarmRewards, appleFarmRewardsAprs } = useAppleFarmRewards()
    const chainDetails = getChainDetails({
        allChainsData,
        chainIdToMatch: assetDetails?.chain_id ?? loopAssetDetails?.chain_id ?? 1,
    })
    const { getTradePath } = useIguanaDexData()
    const [isLoadingTradePath, setIsLoadingTradePath] = useState<boolean>(false)
    const [pathTokens, setPathTokens] = useState<string[]>([])
    const [pathFees, setPathFees] = useState<string[]>([])

    const assetDetailsForActionButton = positionType === 'loop' ? { ...loopAssetDetails, pathTokens, pathFees } : assetDetails

    // Get Discord dialog state
    const lendTxCompleted: boolean = (lendTx.isConfirmed && !!lendTx.hash && lendTx.status === 'view')
    const borrowTxCompleted: boolean = (borrowTx.isConfirmed && !!borrowTx.hash && borrowTx.status === 'view')

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        if (open) {
            // Switch chain when the dialog is opened
            handleSwitchChain(Number(chain_id))
        }
    }, [open])

    useEffect(() => {
        if (
            open &&
            !!loopAssetDetails?.borrowAsset &&
            !!loopAssetDetails?.supplyAsset &&
            Number(borrowAmountRaw) > 0
        ) {
            setIsLoadingTradePath(true)
            console.log('Getting trade path', loopAssetDetails?.borrowAsset?.token?.address, loopAssetDetails?.supplyAsset?.token?.address, borrowAmountRaw)
            getTradePath(
                loopAssetDetails?.borrowAsset?.token?.address,
                loopAssetDetails?.supplyAsset?.token?.address,
                borrowAmountRaw
            )
                .then((result: any) => {
                    console.log('Trade path result', result)

                    if (result.routes[0]?.pools?.length === 1) {
                        setPathTokens([])
                        setPathFees([
                            result?.routes[0]?.pools[0]?.fee?.toString() ??
                            '500',
                        ])
                    } else if (result.routes[0]?.pools?.length === 2) {
                        setPathTokens([result?.routes[0]?.path[1]?.address])
                        setPathFees([
                            result?.routes[0]?.pools[1]?.fee?.toString() ??
                            '500',
                            result?.routes[0]?.pools[0]?.fee?.toString() ??
                            '500',
                        ])
                    } else{
                        setPathTokens([
                            result?.routes[0]?.path[2]?.address,
                            result?.routes[0]?.path[1]?.address,
                        ])
                        setPathFees([
                            result?.routes[0]?.pools[2]?.fee?.toString() ??
                            '500',
                            result?.routes[0]?.pools[1]?.fee?.toString() ??
                            '500',
                            result?.routes[0]?.pools[0]?.fee?.toString() ??
                            '500',
                        ])
                    }
                })
                .catch((error) => {
                    console.error('Error fetching trade path\n', error)
                })
                .finally(() => {
                    setIsLoadingTradePath(false)
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        hasCreditDelegation: true,
                    }))
                })
        }
    }, [
        open,
        loopAssetDetails?.borrowAsset?.token?.address,
        loopAssetDetails?.supplyAsset?.token?.address,
        borrowAmountRaw,
    ])

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
        setLoopTx((prev: TLoopTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
            hasCreditDelegation: false,
        }))
    }

    const getActionButtonAmount = () => {
        if (positionType === 'lend') {
            const amountParsed = parseUnits(
                amount === '' ? '0' : amount,
                assetDetails?.asset?.token?.decimals ?? 0
            ).toString()
            return {
                amountRaw: amount,
                scValue: amount,
                amountParsed,
            }
        }
        if (positionType === 'borrow') {
            const amountParsed = parseUnits(
                amount === '' ? '0' : amount,
                assetDetails?.asset?.token?.decimals ?? 0
            ).toString()
            const v = {
                amountRaw: amount,
                scValue: amount,
                amountParsed,
            }
            return v
        }
        if (positionType === 'loop') {
            const amountParsed = parseUnits(
                amount === '' ? '0' : amount,
                loopAssetDetails?.borrowAsset?.token?.decimals ?? 0
            ).toString()
            return {
                amountRaw: amount,
                scValue: amount,
                amountParsed,
                lendAmount: lendAmount,
                borrowAmount: borrowAmount,
                flashLoanAmount: flashLoanAmount,
            }
        }
        return { amountRaw: '0', scValue: '0', amountParsed: '0' }
    }

    function handleOpenChange(open: boolean) {
        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (
            !open &&
            (lendTx.status !== 'approve' || borrowTx.status !== 'borrow' || loopTx.status !== 'approve')
        ) {
            setAmount('')
            // Only reset if transactions are completed (view status) or there are no pending retries
            // Don't reset if user might want to retry a failed transaction
            const shouldReset = (
                (lendTx.status === 'view' && lendTx.isConfirmed) ||
                (borrowTx.status === 'view' && borrowTx.isConfirmed) ||
                (loopTx.status === 'view' && loopTx.isConfirmed) ||
                // Only reset if no errors that user might want to retry
                (!lendTx.errorMessage && !borrowTx.errorMessage && !loopTx.errorMessage)
            )

            if (shouldReset) {
                setTimeout(() => {
                    resetLendBorrowTx()
                }, 3000)
            }
        }
    }

    function isShowBlock(action: { lend?: boolean; borrow?: boolean; loop?: boolean }) {
        if (positionType === 'all') return false // 'all' is not a transaction type
        return action[positionType as Exclude<TPositionType, 'all'>]
    }

    const inputUsdAmount =
        Number(amount) * Number(assetDetails?.asset?.token?.price_usd ?? 0)
    const lendInputUsdAmount =
        Number(lendAmount) * Number(loopAssetDetails?.supplyAsset?.token?.price_usd ?? 0)
    const borrowInputUsdAmount =
        Number(borrowAmount) * Number(loopAssetDetails?.borrowAsset?.token?.price_usd ?? 0)

    const isLendTxInProgress = lendTx.isPending || lendTx.isConfirming
    const isBorrowTxInProgress = borrowTx.isPending || borrowTx.isConfirming
    const isLoopTxInProgress = loopTx.isPending || loopTx.isConfirming

    const isTxInProgress =
        positionType === 'lend'
            ? isLendTxInProgress
            : positionType === 'borrow'
                ? isBorrowTxInProgress
                : positionType === 'loop'
                    ? isLoopTxInProgress
                    : false // fallback for 'all'

    const lendTxSpinnerColor = lendTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const borrowTxSpinnerColor = borrowTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'

    const canDisplayExplorerLinkWhileLoading = getTxStatus(positionType).hash.length > 0 && (getTxStatus(positionType).isConfirming || getTxStatus(positionType).isPending)

    function getNewHfColor() {
        const newHealthFactor = Number(
            healthFactorValues?.newHealthFactor ?? Number.MAX_VALUE
        )
        const healthFactorFormatted =
            newHealthFactor === Number.MAX_VALUE ? '∞' : newHealthFactor.toFixed(2)

        if (
            getTxStatus(positionType).status === 'approve' ||
            getTxStatus(positionType).status === 'lend' ||
            getTxStatus(positionType).status === 'borrow' ||
            getTxStatus(positionType).status === 'loop'
        ) {
            if (newHealthFactor < 1) return 'text-red-600'
            if (newHealthFactor === 1) return 'text-gray-800'
            if (newHealthFactor < 1.5) return 'text-yellow-600'
            if (newHealthFactor > 1.5) return 'text-green-600'
            return 'text-gray-800'
        }
        return 'text-gray-800'
    }

    function isHfLow() {
        return (
            Number(healthFactorValues.newHealthFactor?.toString() ?? 0) < Number(1.5)
        )
    }

    const isDisableActionButton =
        disabled ||
        isLoadingTradePath ||
        isTxInProgress ||
        (!hasAcknowledgedRisk && positionType === 'borrow' && isHfLow())

    function getTriggerButtonText() {
        const buttonTextMap: { [key: string]: string } = {
            'morpho-markets': 'Add Collateral',
            'morpho-vault': 'Supply to vault',
            default: 'Earn',
            borrow: 'Borrow',
            loop: 'Loop',
        }

        const key = isLendPositionType
            ? `${isMorphoMarkets
                ? 'morpho-markets'
                : isMorphoVault
                    ? 'morpho-vault'
                    : 'default'
            }`
            : positionType === 'loop'
                ? 'loop'
                : 'borrow'
        return buttonTextMap[key]
    }

    function handleActionButtonClick() {
        handleOpenChange(true)
        logEvent(
            `${getTriggerButtonText()?.toLowerCase().split(' ').join('_')}_clicked`,
            {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol || loopAssetDetails?.supplyAsset?.token?.symbol,
                platform_name: assetDetails?.name || loopAssetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id || loopAssetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            }
        )
    }

    const showPointsEarnedBanner = lendTxCompleted || borrowTxCompleted

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
                    tokenName: assetDetails?.asset?.token?.symbol ?? '',
                    txStatus: getTxStatus(positionType),
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
                                    getTxStatus(positionType).hash,
                                    assetDetails?.chain_id ?? 1
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary-500"
                            >
                                {getTruncatedTxHash(
                                    getTxStatus(positionType).hash
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

    function getHeaderText() {
        if (positionType === 'loop') {
            // Show "Looping Successful" when loop transaction is confirmed and successful
            if (!isLoopTxInProgress && loopTx.isConfirmed && loopTx.status === 'view' && !!loopTx.hash) {
                return 'Looping Successful'
            }
            return 'Review Loop'
        }
        return isLendPositionType
            ? isMorphoMarkets
                ? 'Add Collateral'
                : isMorphoVault
                    ? 'Supply to vault'
                    : 'Review Lend'
            : `Review Borrow`
    }

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                lend: true,
                borrow: true,
                loop: true,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        {getHeaderText()}
                    </HeadingText>
                    // </DialogTitle>
                )}
            {/* Confirmation details UI */}
            {isShowBlock({
                lend: false,
                borrow: false,
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
                            className="text-gray-800 truncate max-w-[200px]"
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
                                    {isLendPositionType && lendTx.status === 'view'
                                        ? isMorphoMarkets
                                            ? 'Add Collateral'
                                            : isMorphoVault
                                                ? 'Supply to vault'
                                                : 'Earn'
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
        <div className="flex flex-col gap-3 max-w-full overflow-hidden">
            {/* Block 1 */}
            {isShowBlock({
                lend: true,
                borrow: true,
                loop: true,
            }) && (
                    getSelectedAssetDetailsUI({
                        tokenLogo: assetDetails?.asset?.token?.logo || loopAssetDetails?.supplyAsset?.token?.logo || '',
                        tokenName: assetDetails?.asset?.token?.name || loopAssetDetails?.supplyAsset?.token?.name || '',
                        tokenSymbol: assetDetails?.asset?.token?.symbol || loopAssetDetails?.supplyAsset?.token?.symbol || '',
                        chainLogo: chainDetails?.logo || '',
                        chainName: chainDetails?.name || '',
                        platformName: assetDetails?.name || loopAssetDetails?.name || '',
                        tokenAmountInUsd: positionType === 'loop' ? lendInputUsdAmount : inputUsdAmount,
                        tokenAmount: positionType === 'loop' ? lendAmount : amount,
                    })
                )}
            {/* Block 2 - Loop Borrow Asset Details */}
            {isShowBlock({
                loop: true,
            }) && (
                    getSelectedAssetDetailsUI({
                        tokenLogo: loopAssetDetails?.borrowAsset?.token?.logo || '',
                        tokenName: loopAssetDetails?.borrowAsset?.token?.name || '',
                        tokenSymbol: loopAssetDetails?.borrowAsset?.token?.symbol || '',
                        chainLogo: chainDetails?.logo || '',
                        chainName: chainDetails?.name || '',
                        platformName: loopAssetDetails?.name || '',
                        tokenAmountInUsd: borrowInputUsdAmount,
                        tokenAmount: borrowAmount,
                    })
                )}
            {/* Block 3 */}
            <div className="flex flex-col items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-400">
                {isShowBlock({
                    lend: isMorphoMarkets,
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
                {isShowBlock({
                    loop: true,
                }) && (
                        <div
                            className={`flex items-center justify-between w-full py-3`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Leverage
                            </BodyText>
                            <Badge variant="secondary">
                                {leverage}x
                            </Badge>
                        </div>
                    )}
                {isShowBlock({
                    lend: !isMorphoMarkets,
                    borrow: true,
                }) && (
                        <div className="flex items-center justify-between w-full py-3">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Current APY
                            </BodyText>
                            <Badge variant="green">
                                {abbreviateNumber(
                                    isLendPositionType
                                        ? Number(
                                            (assetDetails?.asset?.supply_apy) ??
                                            0
                                        )
                                        : Number(
                                            (assetDetails?.asset?.variable_borrow_apy) ??
                                            0
                                        )
                                )}
                                %
                            </Badge>
                        </div>
                    )}
                {/* {isShowBlock({
                    lend: !isMorphoMarkets,
                    borrow: true,
                }) && (
                        <div className="flex items-center justify-between w-full py-3">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                7D Avg APY
                            </BodyText>
                            <Badge variant="green">
                                {abbreviateNumber(
                                    isLendPositionType
                                        ? Number(
                                            (assetDetails?.asset
                                                ?.variable_borrow_apy ||
                                                assetDetails?.variable_borrow_apy) ??
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
                    )} */}
                {isShowBlock({
                    borrow:
                        borrowTx.status === 'borrow' ||
                        borrowTx.status === 'view',
                }) && (
                        <div className="flex items-center justify-between w-full py-2">
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
                                            Number(maxBorrowAmount.maxToBorrowFormatted) - Number(amount)
                                        ).toString(),
                                        getMaxDecimalsToDisplay(
                                            assetDetails?.asset?.token?.symbol ?? ''
                                        )
                                    )}
                                </BodyText>
                                <ImageWithDefault
                                    src={assetDetails?.asset?.token?.logo ?? ''}
                                    alt={assetDetails?.asset?.token?.symbol ?? ''}
                                    width={16}
                                    height={16}
                                    className="rounded-full max-w-[16px] max-h-[16px]"
                                />
                            </div>
                        </div>
                    )}
                {isShowBlock({
                    borrow:
                        borrowTx.status === 'borrow' ||
                        borrowTx.status === 'view',
                    loop: true,
                }) && (
                        <div className="flex items-center justify-between w-full py-2">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Health factor
                            </BodyText>
                            <div className="flex flex-col items-end justify-end gap-0">
                                <div className="flex items-center gap-2">
                                    {!!Number(healthFactorValues.healthFactor) &&
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={`text-gray-800`}
                                        >
                                            {Number(healthFactorValues.healthFactor) <
                                                0 && (
                                                    <InfinityIcon className="w-4 h-4" />
                                                )}
                                            {Number(healthFactorValues?.healthFactor) >=
                                                0 &&
                                                healthFactorValues.healthFactor.toFixed(
                                                    2
                                                )}
                                        </BodyText>}
                                    {(!!Number(healthFactorValues.newHealthFactor) && !!Number(healthFactorValues.healthFactor)) &&
                                        <ArrowRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-gray-800"
                                            strokeWidth={2.5}
                                        />}
                                    {(!!Number(healthFactorValues.newHealthFactor)) &&
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={getNewHfColor()}
                                        >
                                            {healthFactorValues.newHealthFactor?.toFixed(
                                                2
                                            )}
                                        </BodyText>}
                                </div>
                                <Label size="small" className="text-gray-600">
                                    Liquidation at &lt;1.0
                                </Label>
                            </div>
                        </div>
                    )}

                {/* Current Net APY */}
                {isShowBlock({
                    loop: true,
                }) && (
                        <div className="flex items-center justify-between gap-2 w-full py-3">
                            <div className="flex items-center gap-2">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Net APY
                                </BodyText>
                                <InfoTooltip
                                    content="Net APY from your existing positions"
                                />
                            </div>
                            <BodyText
                                level="body2"
                                weight="medium"
                                className={cn(
                                    loopAssetDetails?.netAPY.startsWith('+')
                                        ? 'text-green-600'
                                        : loopAssetDetails?.netAPY.startsWith('-')
                                            ? 'text-red-600'
                                            : 'text-gray-800'
                                )}
                            >
                                {
                                    loopAssetDetails?.netAPY || '0.00%'
                                }
                            </BodyText>
                        </div>
                    )}

                {/* Net APY of Loop */}
                {isShowBlock({
                    loop: true,
                }) && (
                        <div className="flex items-center justify-between gap-2 w-full py-3">
                            <div className="flex items-center gap-2">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Net APY of Loop
                                </BodyText>
                                <InfoTooltip
                                    content="Projected Net APY for the new looping position"
                                />
                            </div>
                            <BodyText
                                level="body2"
                                weight="medium"
                                className={cn(
                                    loopAssetDetails?.loopNetAPY && (
                                        loopAssetDetails?.loopNetAPY.startsWith('+')
                                            ? 'text-green-600'
                                            : loopAssetDetails?.loopNetAPY.startsWith('-')
                                                ? 'text-red-600'
                                                : 'text-gray-800'
                                    )
                                )}
                            >
                                {
                                    loopAssetDetails?.loopNetAPY || '0.00%'
                                }
                            </BodyText>
                        </div>
                    )}

                {isShowBlock({
                    lend: false,
                    borrow: false,
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
                                            getTxStatus(positionType).hash,
                                            assetDetails?.chain_id ?? 1
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-secondary-500"
                                    >
                                        {getTruncatedTxHash(
                                            getTxStatus(positionType).hash
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
                borrow: isHfLow(),
            }) && (
                    <div className="flex flex-col items-center justify-center">
                        <CustomAlert description="Borrowing this amount is not advisable, as the heath factor is close to 1, posing a risk of liquidation." />
                        <div
                            className="flex items-center gap-2 w-fit my-5"
                            onClick={() =>
                                setHasAcknowledgedRisk(!hasAcknowledgedRisk)
                            }
                        >
                            <Checkbox id="terms" checked={hasAcknowledgedRisk} />
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
            {isShowBlock({
                lend:
                    (lendTx.status === 'approve' &&
                        (isLendTxInProgress ||
                            (!isLendTxInProgress && lendTx.isConfirmed))) ||
                    lendTx.status === 'lend' ||
                    lendTx.status === 'view',
            }) && (
                    <div className="py-1">
                        {isLendTxInProgress && lendTx.status === 'approve' && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {lendTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {lendTx.isConfirming && 'Approving...'}
                                    </BodyText>
                                </div>
                                {lendTx.hash && lendTx.status === 'approve' && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            lendTx.hash,
                                            assetDetails?.chain_id ?? 1
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
                        {((!isLendTxInProgress && lendTx.isConfirmed) ||
                            lendTx.status === 'lend' ||
                            lendTx.status === 'view') &&
                            (!ETH_ADDRESSES.includes(assetDetails?.asset?.token?.address?.toLowerCase() ?? '')) && (
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
                                            Approval successful
                                        </BodyText>
                                    </div>
                                    {lendTx.hash && lendTx.status === 'approve' && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                lendTx.hash,
                                                assetDetails?.chain_id ?? 1
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
            {isShowBlock({
                lend:
                    (lendTx.status === 'lend' &&
                        (isLendTxInProgress ||
                            (!isLendTxInProgress && lendTx.isConfirmed))) ||
                    lendTx.status === 'view',
                borrow: false,
            }) && (
                    <div className="py-1">
                        {isLendTxInProgress && (
                            <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {lendTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {lendTx.isConfirming && 'Lending...'}
                                    </BodyText>
                                </div>
                                {lendTx.hash &&
                                    (lendTx.isConfirming || lendTx.isConfirmed) && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                lendTx.hash,
                                                assetDetails?.chain_id ?? 1
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
                        {((!isLendTxInProgress && lendTx.isConfirmed) ||
                            (lendTx.status === 'view' && lendTx.isConfirmed)) && (
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
                                            Lend successful
                                        </BodyText>
                                    </div>
                                    {lendTx.hash &&
                                        (lendTx.isConfirming || lendTx.isConfirmed) && (
                                            <ExternalLink
                                                href={getExplorerLink(
                                                    lendTx.hash,
                                                    assetDetails?.chain_id ?? 1
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
            {/* Loop Approval */}
            {isShowBlock({
                loop:
                    (loopTx.status === 'approve' &&
                        (isLoopTxInProgress ||
                            (!isLoopTxInProgress && loopTx.isConfirmed))) ||
                    loopTx.status === 'credit_delegation' ||
                    loopTx.status === 'loop' ||
                    loopTx.status === 'view',
            }) && (
                    <div className="py-1">
                        {isLoopTxInProgress && loopTx.status === 'approve' && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {loopTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {loopTx.isConfirming && 'Approving...'}
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'approve' && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            loopTx.hash,
                                            loopAssetDetails?.chain_id ?? 1
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
                        {((!isLoopTxInProgress && loopTx.isConfirmed) ||
                            loopTx.status === 'credit_delegation' ||
                            loopTx.status === 'loop' ||
                            loopTx.status === 'view') && (
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
                                            Approval successful
                                        </BodyText>
                                    </div>
                                    {loopTx.hash && loopTx.status === 'approve' && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                loopTx.hash,
                                                loopAssetDetails?.chain_id ?? 1
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
            {/* Loop Credit Delegation */}
            {isShowBlock({
                loop:
                    ((loopTx.status === 'credit_delegation' &&
                        (isLoopTxInProgress ||
                            (!isLoopTxInProgress && loopTx.isConfirmed))) ||
                        loopTx.status === 'loop' ||
                        loopTx.status === 'view') &&
                    loopTx.hasCreditDelegation,
            }) && (
                    <div className="py-1">
                        {isLoopTxInProgress && loopTx.status === 'credit_delegation' && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {loopTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {loopTx.isConfirming && 'Delegating...'}
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'credit_delegation' && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            loopTx.hash,
                                            loopAssetDetails?.chain_id ?? 1
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
                        {((!isLoopTxInProgress && loopTx.isConfirmed) ||
                            loopTx.status === 'loop' ||
                            loopTx.status === 'view') && (
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
                                            Credit delegation successful
                                        </BodyText>
                                    </div>
                                    {loopTx.hash && loopTx.status === 'credit_delegation' && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                loopTx.hash,
                                                loopAssetDetails?.chain_id ?? 1
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
            {/* Final Loop */}
            {isShowBlock({
                loop:
                    (loopTx.status === 'loop' &&
                        (isLoopTxInProgress ||
                            (!isLoopTxInProgress && loopTx.isConfirmed))) ||
                    loopTx.status === 'view',
            }) && (
                    <div className="py-1">
                        {isLoopTxInProgress && loopTx.status === 'loop' && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {loopTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {loopTx.isConfirming && 'Looping...'}
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'loop' && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            loopTx.hash,
                                            loopAssetDetails?.chain_id ?? 1
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
                        {(!isLoopTxInProgress && loopTx.isConfirmed && loopTx.status === 'view' && !!loopTx.hash) && (
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
                                        Loop successful
                                    </BodyText>
                                </div>
                                {!!loopTx.hash && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            loopTx.hash,
                                            loopAssetDetails?.chain_id ?? 1
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
            {isShowBlock({
                borrow:
                    (borrowTx.status === 'view' && borrowTx.isConfirmed) ||
                    isBorrowTxInProgress,
            }) && (
                    <div className="py-1">
                        {isBorrowTxInProgress && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {borrowTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {borrowTx.isConfirming && 'Borrowing...'}
                                    </BodyText>
                                </div>
                                {borrowTx.hash &&
                                    (borrowTx.isConfirming ||
                                        borrowTx.isConfirmed) && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                borrowTx.hash,
                                                assetDetails?.chain_id ?? 1
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
                        {borrowTx.status === 'view' && borrowTx.isConfirmed && (
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
                                        Borrow successful
                                    </BodyText>
                                </div>
                                {borrowTx.hash &&
                                    (borrowTx.isConfirming ||
                                        borrowTx.isConfirmed) && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                borrowTx.hash,
                                                assetDetails?.chain_id ?? 1
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
            {showPointsEarnedBanner && (
                <TxPointsEarnedBanner />
            )}
            {/* Block 5 */}
            <ActionButton
                disabled={isDisableActionButton}
                ctaText={isLoadingTradePath ? 'Fetching trade path...' : null}
                isLoading={isLoadingTradePath}
                handleCloseModal={handleOpenChange}
                asset={assetDetailsForActionButton}
                amount={getActionButtonAmount()}
                setActionType={setActionType}
                actionType={positionType === 'all' ? 'lend' : positionType as Exclude<TPositionType, 'all'>}
            />
        </div>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <>
                <Dialog open={open}>
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
            </>
        )
    }

    // Mobile UI
    return (
        <>
            <Drawer open={open} dismissible={false}>
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
        </>
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
    txStatus: TLendTx | TBorrowTx | TLoopTx
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

// HELPER FUNCTION: 6
export function getTooltipContent({
    tokenSymbol,
    tokenLogo,
    tokenName,
    chainName,
    chainLogo,
}: {
    tokenSymbol: string
    tokenLogo: string
    tokenName: string
    chainName: string
    chainLogo: string
}) {
    return (
        <span className="flex flex-col gap-[16px]">
            <span className="flex flex-col gap-[4px]">
                <Label>Token</Label>
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        alt={tokenSymbol}
                        src={tokenLogo || ''}
                        width={24}
                        height={24}
                        className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                    />
                    <BodyText level="body2" weight="medium">
                        {tokenName}
                    </BodyText>
                </span>
            </span>
            <span className="flex flex-col gap-[4px]">
                <Label>Chain</Label>
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        alt={chainName}
                        src={chainLogo || ''}
                        width={24}
                        height={24}
                        className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                    />
                    <BodyText level="body2" weight="medium">
                        {chainName[0]}
                        {chainName?.toLowerCase().slice(1)}
                    </BodyText>
                </span>
            </span>
        </span>
    )
}

function getSelectedAssetDetailsUI({
    tokenLogo,
    tokenName,
    tokenSymbol,
    chainLogo,
    chainName,
    platformName,
    tokenAmountInUsd,
    tokenAmount,
}: {
    tokenLogo: string
    tokenName: string
    tokenSymbol: string
    chainLogo: string
    chainName: string
    platformName: string
    tokenAmountInUsd: number
    tokenAmount: string
}) {
    return (
        <div className="flex items-center gap-2 px-6 py-2 bg-gray-200 lg:bg-white rounded-5 w-full">
            <InfoTooltip
                label={
                    <ImageWithBadge
                        mainImg={tokenLogo}
                        badgeImg={chainLogo}
                        mainImgAlt={tokenName}
                        badgeImgAlt={chainName}
                        mainImgWidth={32}
                        mainImgHeight={32}
                        badgeImgWidth={12}
                        badgeImgHeight={12}
                        badgeCustomClass={'bottom-[-2px] right-[1px]'}
                    />
                }
                content={getTooltipContent({
                    tokenSymbol,
                    tokenLogo,
                    tokenName,
                    chainName,
                    chainLogo,
                })}
            />
            <div className="flex flex-col items-start gap-0 w-fit">
                <HeadingText
                    level="h3"
                    weight="medium"
                    className="text-gray-800 flex items-center gap-1"
                >
                    <span className="inline-block truncate max-w-[200px]" title={tokenAmount}>
                        {Number(tokenAmount).toFixed(decimalPlacesCount(tokenAmount))}
                    </span>
                    <span
                        className="inline-block truncate max-w-[100px]"
                        title={tokenSymbol}
                    >
                        {tokenSymbol}
                    </span>
                </HeadingText>
                <div className="flex items-center justify-start gap-1">
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-600"
                    >
                        {handleInputUsdAmount(
                            tokenAmountInUsd.toString()
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
                                chainName
                            )}
                        >
                            {capitalizeText(chainName)}
                        </span>
                    </BodyText>
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-600 truncate max-w-full"
                        title={platformName}
                    >
                        {platformName}
                    </BodyText>
                </div>
            </div>
        </div>
    )
}

function handleInputUsdAmount(amount: string) {
    const amountFormatted = hasExponent(amount)
        ? Math.abs(Number(amount)).toFixed(10)
        : amount.toString()
    const amountFormattedForLowestValue = getLowestDisplayValue(
        Number(amountFormatted)
    )
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
}