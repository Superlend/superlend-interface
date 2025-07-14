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
    roundLeverageUp,
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
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import InfoTooltip from '../tooltips/InfoTooltip'
import ImageWithBadge from '../ImageWithBadge'
import ExternalLink from '../ExternalLink'
import { parseUnits } from 'ethers/lib/utils'
import { ETH_ADDRESSES } from '@/lib/constants'
import TxPointsEarnedBanner from '../TxPointsEarnedBanner'
import { useIguanaDexData } from '@/hooks/protocols/useIguanaDexData'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'

type TLoopAssetDetails = Omit<TAssetDetails, 'asset'> & {
    supplyAsset: TAssetDetails['asset'] & { emode_category?: number }
    borrowAsset: TAssetDetails['asset'] & { emode_category?: number }
    pathTokens: string[]
    pathFees: string[]
    netAPY: string
    loopNetAPY: string
    lendReserve?: any
    borrowReserve?: any
    strategy?: any
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
    currentPositionData?: any
    newPositionData?: any
    hasLoopPosition?: boolean
    setShouldLogCalculation?: (shouldLog: boolean) => void
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
    currentPositionData,
    newPositionData,
    hasLoopPosition,
    setShouldLogCalculation,
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

    // Enhanced transaction status detection using receipt-based approach
    const getCurrentTxHash = () => {
        if (positionType === 'lend') return lendTx.hash
        if (positionType === 'borrow') return borrowTx.hash
        if (positionType === 'loop') return loopTx.hash
        return undefined
    }

    const txStatus = useTransactionStatus(getCurrentTxHash() as `0x${string}` | undefined, 2)

    // Enhanced transaction status detection - properly distinguish success vs failure
    const isTxSuccessful = useMemo(() => {
        const currentTx = getTxStatus(positionType)
        const hasErrorMessage = currentTx.errorMessage.length > 0

        // Transaction is successful if it has a hash, is confirmed, the receipt shows success, AND there's no error message
        // The error message check prevents showing success during sync gaps when immediate errors are detected but receipt isn't processed yet
        return !!currentTx.hash && currentTx.isConfirmed && txStatus.isSuccessful && !hasErrorMessage
    }, [positionType, txStatus.isSuccessful, lendTx.hash, lendTx.isConfirmed, lendTx.errorMessage, borrowTx.hash, borrowTx.isConfirmed, borrowTx.errorMessage, loopTx.hash, loopTx.isConfirmed, loopTx.errorMessage])

    const isTxFailed = useMemo(() => {
        const currentTx = getTxStatus(positionType)
        const hasErrorMessage = currentTx.errorMessage.length > 0
        const hasFailedReceipt = txStatus.isFailed

        // Transaction is failed if either there's an error message OR the receipt shows failure
        return hasErrorMessage || hasFailedReceipt
    }, [positionType, txStatus.isFailed, lendTx.errorMessage, borrowTx.errorMessage, loopTx.errorMessage])

    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault
    const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluid && !assetDetails?.isVault
    const isFluidVault = isFluid && assetDetails?.isVault
    const { walletAddress, handleSwitchChain } = useWalletConnection()
    const { allChainsData } = useAssetsDataContext()
    const { hasAppleFarmRewards, appleFarmRewardsAprs } = useAppleFarmRewards()
    const chainDetails = getChainDetails({
        allChainsData,
        chainIdToMatch: assetDetails?.chain_id ?? loopAssetDetails?.chain_id ?? 1,
    })
    const { getTradePath } = useIguanaDexData()
    const [isLoadingTradePath, setIsLoadingTradePath] = useState<boolean>(false)
    const [pathTokens, setPathTokens] = useState<string[]>([])
    const [pathFees, setPathFees] = useState<string[]>([])
    const [lastTradePathKey, setLastTradePathKey] = useState<string>('')

    const assetDetailsForActionButton = positionType === 'loop' ? 
        { 
            ...loopAssetDetails, 
            // Explicitly override pathTokens and pathFees with state values
            pathTokens: pathTokens,
            pathFees: pathFees
        } : assetDetails

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
        // Only run when dialog is open and we have the necessary data
        if (!open || !loopAssetDetails?.borrowAsset || !loopAssetDetails?.supplyAsset) {
            return
        }

        // Check if this is a leverage-only change (no new collateral added)
        const isLeverageOnlyChange = hasLoopPosition && 
            currentPositionData && 
            (Number(lendAmount) === 0 || lendAmount === '') && 
            leverage !== currentPositionData.currentLeverage
        
        // Calculate effective borrow amount for leverage-only changes
        let effectiveBorrowAmountRaw = borrowAmountRaw
        
        if (isLeverageOnlyChange) {
            // For leverage-only changes, we should use the borrowAmountRaw directly if it's available
            // This comes from the LoopingWidget's leverage calculation
            if (Number(borrowAmountRaw) > 0) {
                effectiveBorrowAmountRaw = borrowAmountRaw
                console.log('Using borrowAmountRaw for leverage-only change:', borrowAmountRaw)
            } else if (newPositionData && currentPositionData) {
                // Fallback: calculate the difference if newPositionData is available
                const currentBorrowAmount = Number(currentPositionData.borrowAmount)
                const newBorrowAmount = Number(newPositionData.borrowAmount)
                const borrowAmountDifference = Math.abs(newBorrowAmount - currentBorrowAmount)
                
                // Only proceed if there's a meaningful difference (> 0.000001)
                if (borrowAmountDifference > 0.000001) {
                    // Convert to raw amount with proper decimals using parseUnits
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    
                    // Format the difference to the correct number of decimal places to prevent parseUnits errors
                    const formattedDifference = borrowAmountDifference.toFixed(decimals)
                    effectiveBorrowAmountRaw = parseUnits(formattedDifference, decimals).toString()
                    console.log('Using calculated difference for leverage-only change:', effectiveBorrowAmountRaw)
                } else {
                    // Use a minimal amount for very small differences
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    effectiveBorrowAmountRaw = parseUnits('0.001', decimals).toString()
                    console.log('Using minimal amount for leverage-only change:', effectiveBorrowAmountRaw)
                }
            } else {
                // If we don't have enough data, use a minimal amount to ensure trade path is fetched
                const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                effectiveBorrowAmountRaw = parseUnits('0.001', decimals).toString()
                console.log('Using fallback minimal amount for leverage-only change:', effectiveBorrowAmountRaw)
            }
        }
        
        // Only fetch trade path if we have a meaningful amount
        const shouldFetchTradePath = Number(borrowAmountRaw) > 0 || (isLeverageOnlyChange && Number(effectiveBorrowAmountRaw) > 0)
        
        // Create a unique key for this trade path request to prevent duplicates
        const tradePathKey = `${loopAssetDetails?.borrowAsset?.token?.address}-${loopAssetDetails?.supplyAsset?.token?.address}-${effectiveBorrowAmountRaw}`
        
        if (shouldFetchTradePath && tradePathKey !== lastTradePathKey && !isLoadingTradePath) {
            setLastTradePathKey(tradePathKey)
            setIsLoadingTradePath(true)
            console.log('Getting trade path', {
                borrowAsset: loopAssetDetails?.borrowAsset?.token?.address,
                supplyAsset: loopAssetDetails?.supplyAsset?.token?.address,
                borrowAmountRaw,
                effectiveBorrowAmountRaw,
                isLeverageOnlyChange,
                tradePathKey,
                hasNewPositionData: !!newPositionData,
                hasCurrentPositionData: !!currentPositionData
            })
            
            getTradePath(
                loopAssetDetails?.borrowAsset?.token?.address,
                loopAssetDetails?.supplyAsset?.token?.address,
                effectiveBorrowAmountRaw
            )
                .then((result: any) => {
                    console.log('Trade path result', result)
                    console.log('Trade path result structure:', {
                        hasResult: !!result,
                        hasRoutes: !!result?.routes,
                        routesLength: result?.routes?.length,
                        firstRoute: result?.routes?.[0],
                        poolsLength: result?.routes?.[0]?.pools?.length,
                        pathLength: result?.routes?.[0]?.path?.length
                    })

                    // Ensure we have a valid result and route
                    if (!result || !result.routes || !result.routes[0] || !result.routes[0].pools) {
                        console.warn('Invalid trade path result structure, using default values')
                        setPathTokens([])
                        setPathFees(['500'])
                        return
                    }

                    const route = result.routes[0]
                    const poolsLength = route.pools.length

                    let newPathTokens: string[] = []
                    let newPathFees: string[] = []

                    if (poolsLength === 1) {
                        console.log('Setting path for 1 pool (direct swap)')
                        newPathTokens = []
                        newPathFees = [route.pools[0]?.fee?.toString() ?? '500']
                    } else if (poolsLength === 2) {
                        console.log('Setting path for 2 pools')
                        newPathTokens = [route.path[1]?.address]
                        newPathFees = [
                            route.pools[1]?.fee?.toString() ?? '500',
                            route.pools[0]?.fee?.toString() ?? '500',
                        ]
                    } else if (poolsLength >= 3) {
                        console.log('Setting path for 3+ pools')
                        newPathTokens = [
                            route.path[2]?.address,
                            route.path[1]?.address,
                        ]
                        newPathFees = [
                            route.pools[2]?.fee?.toString() ?? '500',
                            route.pools[1]?.fee?.toString() ?? '500',
                            route.pools[0]?.fee?.toString() ?? '500',
                        ]
                    } else {
                        console.warn('Unexpected pools length:', poolsLength)
                        newPathTokens = []
                        newPathFees = ['500']
                    }

                    console.log('Setting pathTokens and pathFees:', {
                        pathTokens: newPathTokens,
                        pathFees: newPathFees
                    })

                    setPathTokens(newPathTokens)
                    setPathFees(newPathFees)
                })
                .catch((error) => {
                    console.error('Error fetching trade path\n', error)
                    console.log('Setting default pathTokens and pathFees due to error')
                    // Set default values on error to ensure transaction can still proceed
                    setPathTokens([])
                    setPathFees(['500'])
                })
                .finally(() => {
                    setIsLoadingTradePath(false)
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        hasCreditDelegation: true,
                    }))
                })
        } else if (!shouldFetchTradePath) {
            // Reset loading state and clear the last key if we don't need to fetch
            setIsLoadingTradePath(false)
            setLastTradePathKey('')
        }
    }, [
        open,
        loopAssetDetails?.borrowAsset?.token?.address,
        loopAssetDetails?.supplyAsset?.token?.address,
        borrowAmountRaw,
        // Use more stable identifiers instead of the full objects
        hasLoopPosition,
        currentPositionData?.currentLeverage,
        currentPositionData?.borrowAmount,
        leverage,
        lendAmount,
        newPositionData?.borrowAmount, // Add this to ensure we re-fetch when newPositionData changes
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
            status: 'check_strategy',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
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
            
            // Check if this is a leverage-only change (no new collateral added)
            const isLeverageOnlyChange = hasLoopPosition && 
                currentPositionData && 
                (Number(lendAmount) === 0 || lendAmount === '') && 
                leverage !== currentPositionData.currentLeverage
            
            let effectiveLendAmount = lendAmount
            let effectiveBorrowAmount = borrowAmount
            let effectiveFlashLoanAmount = flashLoanAmount
            
            // Only log when loop button is actually pressed
            if (loopTx.status !== 'check_strategy') {
                console.log('=== Loop Call Parameters (Button Pressed) ===')
                console.log('Input amounts:', {
                    lendAmount,
                    borrowAmount,
                    flashLoanAmount,
                    leverage,
                    isLeverageOnlyChange
                })
            }
            
            if (isLeverageOnlyChange) {
                // For leverage-only changes, we don't add new collateral (keep lendAmount as 0)
                // But we need to calculate the position adjustments
                effectiveLendAmount = '0' // Keep as 0 for approval
                
                if (newPositionData) {
                    // Calculate total borrow amount for new position
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    const currentBorrowAmount = Number(currentPositionData.borrowAmount)
                    const borrowAmountFormatted = Number(newPositionData.borrowAmount)
                    const borrowAmountDifference = borrowAmountFormatted - currentBorrowAmount
                    // console.log('borrowAmountDifference', borrowAmountDifference)
                    effectiveBorrowAmount = borrowAmountDifference.toFixed(decimals)
                    
                    // For leverage-only, flash loan comes from existing collateral rebalancing
                    const currentCollateral = currentPositionData.lendAmount
                    const newCollateral = newPositionData.lendAmount
                    const collateralDifference = newCollateral - currentCollateral
                    
                    if (collateralDifference > 0) {
                        // Need more collateral - flash loan
                        const supplyDecimals = loopAssetDetails?.supplyAsset?.token?.decimals ?? 18
                        effectiveFlashLoanAmount = Number(collateralDifference).toFixed(supplyDecimals)
                    } else {
                        // Reducing collateral - no flash loan needed
                        effectiveFlashLoanAmount = '0'
                    }
                }
                
                if (loopTx.status !== 'check_strategy') {
                    console.log('Leverage-only change calculated amounts:', {
                        effectiveLendAmount, // Should be 0
                        effectiveBorrowAmount,
                        effectiveFlashLoanAmount
                    })
                }
            }
            
            const finalParams = {
                amountRaw: amount,
                scValue: amount,
                amountParsed,
                lendAmount: effectiveLendAmount,
                borrowAmount: effectiveBorrowAmount,
                flashLoanAmount: effectiveFlashLoanAmount,
            }
            
            if (loopTx.status !== 'check_strategy') {
                console.log('Final parameters for loop call:', finalParams)
                console.log('=== End Loop Call Parameters ===')
            }
            
            return finalParams
        }
        return { amountRaw: '0', scValue: '0', amountParsed: '0' }
    }

    function handleOpenChange(open: boolean) {
        setOpen(open)

        if (open) {
            // When opening the dialog, clear any existing error messages
            // This ensures fresh state when user reopens after canceling/errors
            if (lendTx.errorMessage || borrowTx.errorMessage || loopTx.errorMessage) {
                resetLendBorrowTx()
            }
            
            // Reset trade path state for fresh calculations
            setLastTradePathKey('')
            setIsLoadingTradePath(false)
            
            // Set shouldLogCalculation for loop transactions when dialog opens
            if (positionType === 'loop' && setShouldLogCalculation) {
                setShouldLogCalculation(false)
            }
        } else {
            // When closing the dialog, reset the amount and the tx status
            if (lendTx.status !== 'approve' || borrowTx.status !== 'borrow' || loopTx.status !== 'approve') {
                setAmount('')

                setTimeout(() => {
                    resetLendBorrowTx()
                }, 500)
            }
            
            // Reset trade path state when dialog closes
            setLastTradePathKey('')
            setIsLoadingTradePath(false)
            
            // Reset shouldLogCalculation when dialog closes
            if (positionType === 'loop' && setShouldLogCalculation) {
                setShouldLogCalculation(false)
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
            getTxStatus(positionType).status === 'check_strategy' ||
            getTxStatus(positionType).status === 'create_strategy' ||
            getTxStatus(positionType).status === 'open_position'
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
        // Handle failed states first
        if (isTxFailed) {
            if (positionType === 'loop') {
                return 'Looping Failed'
            }
            return isLendPositionType
                ? isMorphoMarkets
                    ? 'Add Collateral Failed'
                    : isMorphoVault
                        ? 'Supply to Vault Failed'
                        : 'Lending Failed'
                : 'Borrowing Failed'
        }

        // Handle successful states
        if (isTxSuccessful) {
            if (positionType === 'loop') {
                return 'Looping Successful'
            }
            return isLendPositionType
                ? isMorphoMarkets
                    ? 'Add Collateral Successful'
                    : isMorphoVault
                        ? 'Supply to Vault Successful'
                        : 'Lending Successful'
                : 'Borrowing Successful'
        }

        // Handle in-progress and review states
        if (positionType === 'loop') {
            return 'Review Loop'
        }

        // Default review states
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
                // Show for loop only if a non-zero supply amount was entered
                loop: Number(lendAmount) > 0,
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
                loop: loopTx.status === 'view' || (positionType === 'loop' && isTxFailed)
            }) && (
                    <div className="flex flex-col items-center justify-center gap-[6px]">
                        {/* <ImageWithDefault
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
                        </HeadingText> */}
                        {isShowBlock({
                            lend: isTxSuccessful || isTxFailed,
                            borrow: isTxSuccessful || isTxFailed,
                            loop: isTxSuccessful || isTxFailed,
                        }) && (
                                <Badge
                                    variant={isTxFailed ? 'destructive' : 'green'}
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isLendPositionType && (isTxSuccessful || (positionType === 'lend' && isTxFailed))
                                        ? isMorphoMarkets
                                            ? 'Add Collateral'
                                            : isMorphoVault
                                                ? 'Supply to vault'
                                                : 'Earn'
                                        : positionType === 'loop'
                                            ? 'Loop'
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

    // Calculate effective amounts for loop positions
    const getEffectiveLendAmount = () => {
        if (positionType !== 'loop' || !hasLoopPosition || !currentPositionData || !newPositionData) {
            return lendAmount
        }
        
        // Calculate the total change in collateral
        const collateralChange = newPositionData.lendAmount - currentPositionData.lendAmount
        return collateralChange.toString()
    }

    const getEffectiveBorrowAmount = () => {
        if (positionType !== 'loop' || !hasLoopPosition || !currentPositionData || !newPositionData) {
            return borrowAmount
        }
        
        // Calculate the total change in borrow amount
        const borrowChange = newPositionData.borrowAmount - currentPositionData.borrowAmount
        return Math.abs(borrowChange).toString()
    }

    const getEffectiveLendAmountUsd = () => {
        if (positionType !== 'loop') {
            return inputUsdAmount
        }
        
        const effectiveAmount = Number(getEffectiveLendAmount())
        return effectiveAmount * Number(loopAssetDetails?.supplyAsset?.token?.price_usd ?? 0)
    }

    const getEffectiveBorrowAmountUsd = () => {
        if (positionType !== 'loop') {
            return 0
        }
        
        const effectiveAmount = Number(getEffectiveBorrowAmount())
        return effectiveAmount * Number(loopAssetDetails?.borrowAsset?.token?.price_usd ?? 0)
    }

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <div className="flex flex-col gap-3 max-w-full overflow-hidden">
            {/* Block 1 */}
            {/* Asset detail for supply token */}
            {isShowBlock({
                lend: true,
                borrow: true,
                // Show for loop if there's any collateral change or new lend amount
                loop: Number(lendAmount) > 0 || (hasLoopPosition && currentPositionData && newPositionData && Math.abs(newPositionData.lendAmount - currentPositionData.lendAmount) > 0.000001),
            }) && (
                    getSelectedAssetDetailsUI({
                        tokenLogo: assetDetails?.asset?.token?.logo || loopAssetDetails?.supplyAsset?.token?.logo || '',
                        tokenName: assetDetails?.asset?.token?.name || loopAssetDetails?.supplyAsset?.token?.name || '',
                        tokenSymbol: assetDetails?.asset?.token?.symbol || loopAssetDetails?.supplyAsset?.token?.symbol || '',
                        chainLogo: chainDetails?.logo || '',
                        chainName: chainDetails?.name || '',
                        platformName: assetDetails?.name || loopAssetDetails?.name || '',
                        tokenAmountInUsd: positionType === 'loop' ? getEffectiveLendAmountUsd() : inputUsdAmount,
                        tokenAmount: positionType === 'loop' ? getEffectiveLendAmount() : amount,
                    })
                )}
            {/* Block 2 - Loop Borrow Asset Details */}
            {/* Asset detail for borrow token */}
            {isShowBlock({
                // Show this block if there's any borrow amount change
                loop: Number(borrowAmount) > 0 || (hasLoopPosition && currentPositionData && newPositionData && Math.abs(newPositionData.borrowAmount - currentPositionData.borrowAmount) > 0.000001),
            }) && (
                    getSelectedAssetDetailsUI({
                        tokenLogo: loopAssetDetails?.borrowAsset?.token?.logo || '',
                        tokenName: loopAssetDetails?.borrowAsset?.token?.name || '',
                        tokenSymbol: loopAssetDetails?.borrowAsset?.token?.symbol || '',
                        chainLogo: chainDetails?.logo || '',
                        chainName: chainDetails?.name || '',
                        platformName: loopAssetDetails?.name || '',
                        tokenAmountInUsd: getEffectiveBorrowAmountUsd(),
                        tokenAmount: getEffectiveBorrowAmount(),
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
                                {roundLeverageUp(typeof leverage === 'number' ? leverage : 1).toFixed(1)}x
                            </Badge>
                        </div>
                    )}

                {/* Position Changes Preview for Loop - Show when user has a position */}
                {isShowBlock({
                    loop: hasLoopPosition && currentPositionData && newPositionData && (Number(lendAmount) > 0 || Number(leverage) !== currentPositionData.currentLeverage),
                }) && (
                        <>
                            {/* <div className="w-full border-t border-gray-300 my-3"></div> */}
                            <div className="flex flex-col gap-3 w-full">
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Position Changes Preview
                                </BodyText>
                                
                                {/* Collateral Change */}
                                <div className="flex items-center justify-between">
                                    <BodyText level="body3" className="text-gray-600">
                                        Total Collateral
                                    </BodyText>
                                    <div className="flex items-center gap-2">
                                        <BodyText level="body3" className="text-gray-800">
                                            {(currentPositionData.lendAmount || 0).toFixed(4)} {loopAssetDetails?.supplyAsset?.token?.symbol}
                                        </BodyText>
                                        {currentPositionData.lendAmount?.toFixed(4) !== newPositionData.lendAmount?.toFixed(4) && (
                                            <>
                                                <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                                <BodyText level="body3" className="text-gray-800">
                                                    {(newPositionData.lendAmount || 0).toFixed(4)} {loopAssetDetails?.supplyAsset?.token?.symbol}
                                                </BodyText>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Borrowed Change */}
                                <div className="flex items-center justify-between">
                                    <BodyText level="body3" className="text-gray-600">
                                        Total Borrowed
                                    </BodyText>
                                    <div className="flex items-center gap-2">
                                        <BodyText level="body3" className="text-gray-800">
                                            {(currentPositionData.borrowAmount || 0).toFixed(4)} {loopAssetDetails?.borrowAsset?.token?.symbol}
                                        </BodyText>
                                        {currentPositionData.borrowAmount?.toFixed(4) !== newPositionData.borrowAmount?.toFixed(4) && (
                                            <>
                                                <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                                <BodyText level="body3" className="text-gray-800">
                                                    {(newPositionData.borrowAmount || 0).toFixed(4)} {loopAssetDetails?.borrowAsset?.token?.symbol}
                                                </BodyText>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Leverage Change */}
                                <div className="flex items-center justify-between">
                                    <BodyText level="body3" className="text-gray-600">
                                        Leverage
                                    </BodyText>
                                    <div className="flex items-center gap-2">
                                        <BodyText level="body3" className="text-gray-800">
                                            {roundLeverageUp(currentPositionData.currentLeverage || 1).toFixed(1)}x
                                        </BodyText>
                                        {roundLeverageUp(currentPositionData.currentLeverage || 1).toFixed(1) !== roundLeverageUp(newPositionData.leverage || 1).toFixed(1) && (
                                            <>
                                                <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                                <BodyText level="body3" className="text-gray-800">
                                                    {roundLeverageUp(newPositionData.leverage || 1).toFixed(1)}x
                                                </BodyText>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* <div className="w-full border-t border-gray-300 my-3"></div>/ */}
                        </>
                    )}

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
                {/* {isShowBlock({
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
                    )} */}

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
                    loopTx.status === 'approve' ||
                    loopTx.status === 'create_strategy' ||
                    loopTx.status === 'open_position' ||
                    loopTx.status === 'view',
            }) && (
                    <div className="py-2">
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
                        {(loopTx.status === 'approve' && !isLoopTxInProgress && loopTx.hash && !loopTx.errorMessage) ||
                         (loopTx.status === 'create_strategy' && !isLoopTxInProgress) ||
                         (loopTx.status === 'open_position') ||
                         (loopTx.status === 'view') ? (
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
                                {(loopTx.approveHash || loopTx.hash) && (loopTx.status === 'approve' || loopTx.status === 'open_position' || loopTx.status === 'view') && (
                                    <ExternalLink
                                        href={getExplorerLink(
                                            loopTx.approveHash || loopTx.hash,
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
                        ) : null}
                    </div>
                )}
            {/* Loop Strategy Check */}
            {isShowBlock({
                loop:
                    loopTx.status === 'check_strategy' ||
                    loopTx.status === 'create_strategy' ||
                    loopTx.status === 'open_position' ||
                    loopTx.status === 'view',
            }) && (
                    <div className="py-2">
                        {/* Strategy check in progress */}
                        {loopTx.status === 'check_strategy' && isLoopTxInProgress && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        Checking for existing strategy...
                                    </BodyText>
                                </div>
                            </div>
                        )}
                        {/* Strategy found/checked successfully */}
                        {(loopTx.status === 'check_strategy' && !isLoopTxInProgress && loopTx.hash && !loopTx.errorMessage) ||
                         (loopTx.status === 'create_strategy') ||
                         (loopTx.status === 'open_position') ||
                         (loopTx.status === 'view') ? (
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
                                        {loopTx.hash === 'strategy_found' ? 'Strategy found' : 'Strategy check complete'}
                                    </BodyText>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            {/* Loop Create Strategy */}
            {isShowBlock({
                // Show the "Strategy created" section only when the transaction
                // has actually gone through the `create_strategy` step. This
                // prevents showing a misleading message when an existing
                // strategy is reused (i.e. `strategy_found` flow).
                loop: loopTx.status === 'create_strategy',
            }) && (
                    <div className="py-2">
                        {isLoopTxInProgress && loopTx.status === 'create_strategy' && (
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
                                        {loopTx.isConfirming && 'Creating strategy...'}
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'create_strategy' && (
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
                        {(loopTx.status === 'create_strategy' && !isLoopTxInProgress && loopTx.hash && !loopTx.errorMessage) ||
                         (loopTx.status === 'open_position') ||
                         (loopTx.status === 'view') ? (
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
                                        Strategy created successfully
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'create_strategy' && (
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
                        ) : null}
                    </div>
                )}
            {/* Loop Open Position */}
            {isShowBlock({
                loop:
                    loopTx.status === 'open_position' ||
                    loopTx.status === 'view',
            }) && (
                    <div className="py-2">
                        {isLoopTxInProgress && loopTx.status === 'open_position' && (
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
                                        {loopTx.isConfirming && 'Opening position...'}
                                    </BodyText>
                                </div>
                                {loopTx.hash && loopTx.status === 'open_position' && (
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
                        {(!isLoopTxInProgress && loopTx.isConfirmed && loopTx.status === 'view' && !!loopTx.hash && !loopTx.errorMessage) && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    {/* <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                        <Check
                                            className="w-5 h-5 stroke-[#013220]/75"
                                            strokeWidth={1.5}
                                        />
                                    </div> */}
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
            {showPointsEarnedBanner && (
                <TxPointsEarnedBanner />
            )}
            {/* Block 5 */}
            <ActionButton
                disabled={isDisableActionButton}
                ctaText={isLoadingTradePath ? 'Fetching trade path...' : null}
                isLoading={isLoadingTradePath}
                handleCloseModal={handleOpenChange}
                asset={(() => {
                    const finalAsset = assetDetailsForActionButton
                    if (positionType === 'loop' && finalAsset && 'pathTokens' in finalAsset && 'pathFees' in finalAsset) {
                        console.log('ActionButton asset details for loop:', {
                            pathTokens: finalAsset.pathTokens,
                            pathFees: finalAsset.pathFees,
                            hasPathTokens: Array.isArray(finalAsset.pathTokens),
                            hasPathFees: Array.isArray(finalAsset.pathFees),
                            pathTokensLength: finalAsset.pathTokens?.length,
                            pathFeesLength: finalAsset.pathFees?.length
                        })
                    }
                    return finalAsset
                })()}
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