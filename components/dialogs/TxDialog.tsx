'use client'

import { useCallback, useEffect, useMemo, useState, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import { TLoopTx, useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import ImageWithDefault from '@/components/ImageWithDefault'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { CHAIN_ID_MAPPER, TX_EXPLORER_LINKS } from '@/constants'
import { ChainId } from '@/types/chain'
import { cn, capitalizeText } from '@/lib/utils'
import { handleSmallestValue, getMaxDecimalsToDisplay, decimalPlacesCount, formatUsdValue } from '@/lib/format-utils'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { getChainDetails } from '@/app/position-management/helper-functions'
import { BigNumber } from 'ethers'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import useDimensions from '@/hooks/useDimensions'
import { roundLeverageUp } from '@/lib/utils'
import { useAssetsDataContext } from '@/context/data-provider'
import { useIguanaDexData } from '@/hooks/protocols/useIguanaDexData'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { TPositionType, TAssetDetails, TChain, TTransactionType } from '@/types'
import { PlatformType } from '@/types/platform'
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
import InfoTooltip from '../tooltips/InfoTooltip'
import ImageWithBadge from '../ImageWithBadge'
import ExternalLink from '../ExternalLink'
import { ETH_ADDRESSES } from '@/lib/constants'
import TxPointsEarnedBanner from '../TxPointsEarnedBanner'
import CustomAlert from '@/components/alerts/CustomAlert'
import { Checkbox } from '@/components/ui/checkbox'
import ActionButton from '@/components/common/ActionButton'

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
    strategyAddress?: string
}

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
    unloopParameters?: {
        repayAmountToken: string
        aTokenAmount: string
        withdrawAmount: string
        swapDetails: {
            fromToken: string
            toToken: string
            amountToSwap: string
        }
    } | null
    onPositionRefresh?: () => void
}

// Helper functions
function getExplorerLink(hash: string, chainId: ChainId) {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

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

function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    positionType,
    actionTitle,
}: {
    amount: string
    tokenName: string
    txStatus: any // TLendTx | TBorrowTx | TLoopTx | TUnloopTx
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
            close_position: `Approve transaction for closing position`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            lend: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            borrow: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            close_position: `Confirming transaction for closing position`,
        }
    }
    return textByStatus[txStatus.status]
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
    tokenDecimals,
}: {
    tokenLogo: string
    tokenName: string
    tokenSymbol: string
    chainLogo: string
    chainName: string
    platformName: string
    tokenAmountInUsd: number
    tokenAmount: string
    tokenDecimals?: number
}) {
    const tooltipContent = getTooltipContent({
        tokenSymbol,
        tokenLogo,
        tokenName,
        chainName,
        chainLogo,
    })

    // Format token amount based on token's decimals
    const formatTokenAmount = (amount: string, decimals?: number) => {
        const numAmount = Number(amount)
        if (numAmount === 0) return '0'
        
        // Use token decimals if provided, otherwise use up to 6 decimals but respect common token patterns
        let displayDecimals = decimals || 6
        
        // For stablecoins (usually 6 decimals), show fewer decimal places
        if (tokenSymbol?.toLowerCase().includes('usdt') || 
            tokenSymbol?.toLowerCase().includes('usdc') || 
            tokenSymbol?.toLowerCase().includes('dai')) {
            displayDecimals = Math.min(displayDecimals, 6)
        }
        
        // For very small amounts, show more decimals
        if (numAmount < 0.01) {
            displayDecimals = Math.min(displayDecimals, 8)
        }
        
        return numAmount.toFixed(displayDecimals).replace(/\.?0+$/, '')
    }

    const formattedAmount = formatTokenAmount(tokenAmount, tokenDecimals)

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
                content={tooltipContent}
            />
            <div className="flex flex-col items-start gap-0 w-fit">
                <HeadingText level="h3" weight="medium" className="text-gray-800 flex items-center gap-1">
                    <span className="inline-block truncate max-w-[200px]" title={formattedAmount}>
                        {formattedAmount}
                    </span>
                    <span className="inline-block truncate max-w-[100px]" title={tokenSymbol}>
                        {tokenSymbol}
                    </span>
                </HeadingText>
                <div className="flex items-center justify-start gap-1">
                    <BodyText level="body3" weight="medium" className="text-gray-600">
                        {formatUsdValue(tokenAmountInUsd)}
                    </BodyText>
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    <BodyText level="body3" weight="medium" className="text-gray-600 flex items-center gap-1">
                        <span className="inline-block truncate max-w-full" title={capitalizeText(chainName)}>
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
    unloopParameters,
    onPositionRefresh,
}: IConfirmationDialogProps) {
    const { lendTx, setLendTx, borrowTx, setBorrowTx, withdrawTx, repayTx, loopTx, setLoopTx, unloopTx, setUnloopTx } = useTxContext() as TTxContext
    const positionTypeTxStatusMap: Record<TTransactionType, any> = { // TLendTx | TBorrowTx | TLoopTx | TUnloopTx
        'lend': lendTx,
        'borrow': borrowTx,
        'loop': loopTx,
        'unloop': unloopTx,
    }

    const getTxStatus = (type: TPositionType): any => { // TLendTx | TBorrowTx | TLoopTx | TUnloopTx
        if (type === 'all') return lendTx
        return positionTypeTxStatusMap[type as TTransactionType]
    }

    const getTransactionType = (type: TPositionType): TTransactionType => {
        if (type === 'all') return 'lend'
        return type as TTransactionType
    }

    const { logEvent } = useAnalytics()
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const searchParams = useSearchParams() || new URLSearchParams()
    const chain_id = searchParams.get('chain_id') || '1'
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isLendPositionType = positionType === 'lend'
    const isUnloopMode = positionType === 'unloop'
    const [pathTokens, setPathTokens] = useState<string[]>([])
    const [pathFees, setPathFees] = useState<string[]>([])
    const [lastTradePathKey, setLastTradePathKey] = useState<string>('')
    const [isLoadingTradePath, setIsLoadingTradePath] = useState<boolean>(false)
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault

    const getActionButtonText = () => {
        if (isLoadingTradePath) {
            return 'Fetching trade path...'
        }
        
        // Check if transaction is successful and show "Close"
        if (isTxSuccessful) {
            return 'Close'
        }
        
        if (positionType === 'loop') {
            return 'Loop'
        }
        
        if (positionType === 'unloop') {
            return 'Unloop'
        }
        
        return isLendPositionType ? 
               isMorphoMarkets ? 'Add Collateral' : 
               isMorphoVault ? 'Supply to vault' : 'Earn' : 'Borrow'
    }

    const getCurrentTxHash = () => {
        if (positionType === 'lend') return lendTx.hash
        if (positionType === 'borrow') return borrowTx.hash
        if (positionType === 'loop') return loopTx.hash
        if (positionType === 'unloop') return unloopTx.hash
        return undefined
    }

    const txStatus = useTransactionStatus(getCurrentTxHash() as `0x${string}` | undefined, 2)

    const isTxSuccessful = useMemo(() => {
        const currentTx = getTxStatus(positionType)
        const hasErrorMessage = currentTx.errorMessage.length > 0
        return !!currentTx.hash && currentTx.isConfirmed && txStatus.isSuccessful && !hasErrorMessage
    }, [positionType, txStatus.isSuccessful, lendTx.hash, lendTx.isConfirmed, lendTx.errorMessage, borrowTx.hash, borrowTx.isConfirmed, borrowTx.errorMessage, loopTx.hash, loopTx.isConfirmed, loopTx.errorMessage])

    const isTxFailed = useMemo(() => {
        const currentTx = getTxStatus(positionType)
        const hasErrorMessage = currentTx.errorMessage.length > 0
        const hasFailedReceipt = txStatus.isFailed
        return hasErrorMessage || hasFailedReceipt
    }, [positionType, txStatus.isFailed, lendTx.errorMessage, borrowTx.errorMessage, loopTx.errorMessage])

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

    const assetDetailsForActionButton = positionType === 'loop' ? 
        { 
            ...loopAssetDetails, 
            pathTokens: pathTokens,
            pathFees: pathFees,
            strategyAddress: currentPositionData?.strategyAddress || loopAssetDetails?.strategyAddress || ''
        } : positionType === 'unloop' ? 
        {
            ...loopAssetDetails,
            pathTokens: pathTokens,
            pathFees: pathFees,
            strategyAddress: currentPositionData?.strategyAddress || loopAssetDetails?.strategyAddress || ''
        } : assetDetails

    const lendTxCompleted: boolean = (lendTx.isConfirmed && !!lendTx.hash && lendTx.status === 'view')
    const borrowTxCompleted: boolean = (borrowTx.isConfirmed && !!borrowTx.hash && borrowTx.status === 'view')

    useEffect(() => {
        setHasAcknowledgedRisk(false)
        if (open) {
            handleSwitchChain(Number(chain_id))
        }
    }, [open])

    useEffect(() => {
        if (!open || !loopAssetDetails?.borrowAsset || !loopAssetDetails?.supplyAsset) {
            return
        }

        // Only fetch trade path for loop and unloop operations
        if (positionType !== 'loop' && positionType !== 'unloop') {
            return
        }

        // If we already have path tokens and fees, don't refetch
        if (pathTokens.length > 0 && pathFees.length > 0) {
            return
        }

        const isLeverageOnlyChange = hasLoopPosition && 
            currentPositionData && 
            (Number(lendAmount) === 0 || lendAmount === '') && 
            leverage !== currentPositionData.currentLeverage
        
        let effectiveBorrowAmountRaw = borrowAmountRaw
        
        if (isLeverageOnlyChange) {
           
            if (newPositionData && currentPositionData) {
                const currentBorrowAmount = Number(currentPositionData.borrowAmount)
                const newBorrowAmount = Number(newPositionData.borrowAmount)
                const borrowAmountDifference = Math.abs(newBorrowAmount - currentBorrowAmount)
                if (borrowAmountDifference > 0.000001) {
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    const formattedDifference = borrowAmountDifference.toFixed(decimals)
                    effectiveBorrowAmountRaw = parseUnits(formattedDifference, decimals).toString()
                } else {
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    effectiveBorrowAmountRaw = parseUnits('0.001', decimals).toString()
                }
            } else {
                const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                effectiveBorrowAmountRaw = parseUnits('0.001', decimals).toString()
            }
        }
        
        // Always fetch trade path for loop/unloop operations
        let tradePathAmount = effectiveBorrowAmountRaw
        if (positionType === 'unloop' && unloopParameters) {
            // Use the repay amount from unloop parameters
            tradePathAmount = unloopParameters.repayAmountToken
        } else {
            // If no unloop parameters or in loop mode, use a small amount for trade path calculation
            const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
            tradePathAmount = parseUnits('0.001', decimals).toString()
        }
        
        const tradePathKey = positionType === 'unloop' ?
            `${loopAssetDetails?.borrowAsset?.token?.address}-${loopAssetDetails?.supplyAsset?.token?.address}-${tradePathAmount}` :
            `${loopAssetDetails?.borrowAsset?.token?.address}-${loopAssetDetails?.supplyAsset?.token?.address}-${effectiveBorrowAmountRaw}`
        
        // Always fetch if we haven't fetched this exact path
        if (tradePathKey !== lastTradePathKey && !isLoadingTradePath) {
            setLastTradePathKey(tradePathKey)
            setIsLoadingTradePath(true)
            
            // Add a small delay to prevent rapid successive calls
            setTimeout(() => {
                getTradePath(
                    loopAssetDetails?.borrowAsset?.token?.address,
                    loopAssetDetails?.supplyAsset?.token?.address,
                    tradePathAmount
                )
                    .then((result: any) => {
                        if (!result || !result.routes || !result.routes[0] || !result.routes[0].pools) {
                            setPathTokens([])
                            setPathFees(['500'])
                            return
                        }

                        const route = result.routes[0]
                        const poolsLength = route.pools.length

                        let newPathTokens: string[] = []
                        let newPathFees: string[] = []

                        if (poolsLength === 1) {
                            newPathTokens = []
                            newPathFees = [route.pools[0]?.fee?.toString() ?? '500']
                        } else if (poolsLength === 2) {
                            newPathTokens = [route.path[1]?.address]
                            newPathFees = [
                                route.pools[1]?.fee?.toString() ?? '500',
                                route.pools[0]?.fee?.toString() ?? '500',
                            ]
                        } else if (poolsLength >= 3) {
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
                            newPathTokens = []
                            newPathFees = ['500']
                        }

                        setPathTokens(newPathTokens)
                        setPathFees(newPathFees)
                    })
                    .catch((error) => {
                        setPathTokens([])
                        setPathFees(['500'])
                    })
                    .finally(() => {
                        setIsLoadingTradePath(false)
                        if (positionType === 'loop') {
                            setLoopTx((prev: TLoopTx) => ({
                                ...prev,
                                hasCreditDelegation: true,
                            }))
                        }
                    })
            }, 100)
        }
    }, [
        open,
        positionType,
        loopAssetDetails?.borrowAsset?.token?.address,
        loopAssetDetails?.supplyAsset?.token?.address,
        borrowAmountRaw,
        hasLoopPosition,
        currentPositionData?.currentLeverage,
        currentPositionData?.borrowAmount,
        leverage,
        lendAmount,
        newPositionData?.borrowAmount,
        unloopParameters,
    ])

    // Reset trade path state when closing dialog
    useEffect(() => {
        if (!open) {
            setPathTokens([])
            setPathFees([])
            setLastTradePathKey('')
            setIsLoadingTradePath(false)
        }
    }, [open])

    function resetLendBorrowTx() {
        setLendTx((prev: any) => ({ // TLendTx
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
        setBorrowTx((prev: any) => ({ // TLendTx
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
        setUnloopTx((prev: any) => ({ // TUnloopTx
            ...prev,
            status: 'close_position',
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
            
            const isLeverageOnlyChange = hasLoopPosition && 
                currentPositionData && 
                (Number(lendAmount) === 0 || lendAmount === '') && 
                leverage !== currentPositionData.currentLeverage
            
            let effectiveLendAmount = lendAmount
            let effectiveBorrowAmount = borrowAmount
            let effectiveFlashLoanAmount = flashLoanAmount
            

            
            if (isLeverageOnlyChange) {
                effectiveLendAmount = '0'
                
                if (newPositionData) {
                    const decimals = loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    const currentBorrowAmount = Number(currentPositionData.borrowAmount)
                    const borrowAmountFormatted = Number(newPositionData.borrowAmount)
                    const borrowAmountDifference = borrowAmountFormatted - currentBorrowAmount
                    effectiveBorrowAmount = borrowAmountDifference.toFixed(decimals)
                    
                    const currentCollateral = currentPositionData.lendAmount
                    const newCollateral = newPositionData.lendAmount
                    const collateralDifference = newCollateral - currentCollateral
                    
                    if (collateralDifference > 0) {
                        const supplyDecimals = loopAssetDetails?.supplyAsset?.token?.decimals ?? 18
                        effectiveFlashLoanAmount = Number(collateralDifference).toFixed(supplyDecimals)
                    } else {
                        effectiveFlashLoanAmount = '0'
                    }
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
            

            
            return finalParams
        }
        
        if (positionType === 'unloop') {
            const amountParsed = parseUnits(
                amount === '' ? '0' : amount,
                loopAssetDetails?.borrowAsset?.token?.decimals ?? 0
            ).toString()
            

            
            // For unloop, we need to calculate the correct parameters
            // Based on the smart contract test, closePosition expects:
            // repayAmount, swapPathTokens, swapPathFees, aTokenAmount, withdrawAmount
            
            // If we have calculated unloop parameters, use them
            if (unloopParameters) {
                
                const finalParams = {
                    amountRaw: amount,
                    scValue: amount,
                    amountParsed,
                    borrowAmount: formatUnits(
                        BigNumber.from(unloopParameters.repayAmountToken).toBigInt(),
                        loopAssetDetails?.borrowAsset?.token?.decimals ?? 18
                    ),
                    lendAmount: formatUnits(
                        BigNumber.from(unloopParameters.aTokenAmount).toBigInt(),
                        loopAssetDetails?.supplyAsset?.token?.decimals ?? 18
                    ),
                    withdrawAmount: formatUnits(
                        BigNumber.from(unloopParameters.withdrawAmount).toBigInt(),
                        loopAssetDetails?.supplyAsset?.token?.decimals ?? 18
                    ),
                    repayAmountToken: unloopParameters.repayAmountToken,
                    aTokenAmount: unloopParameters.aTokenAmount,
                    withdrawAmountToken: unloopParameters.withdrawAmount,
                }
                
                return finalParams
            }
            
            // Fallback to original logic if no calculated parameters
            const isFullClose = Number(amount) >= Number(lendAmount) * 0.99 // Allow small rounding differences
            
            const finalParams = {
                amountRaw: amount,
                scValue: amount,
                amountParsed,
                borrowAmount: isFullClose ? borrowAmount : amount, // For full close, repay all borrow
                lendAmount: isFullClose ? lendAmount : amount, // For full close, withdraw all collateral
                withdrawAmount: amount,
            }
            
            return finalParams
        }
        return { amountRaw: '0', scValue: '0', amountParsed: '0' }
    }

    function handleOpenChange(open: boolean) {
        setOpen(open)

        if (open) {
            if (lendTx.errorMessage || borrowTx.errorMessage || loopTx.errorMessage || unloopTx.errorMessage) {
                resetLendBorrowTx()
            }
            
            // Don't reset trade path state when opening
            if ((positionType === 'loop' || positionType === 'unloop') && setShouldLogCalculation) {
                setShouldLogCalculation(false)
            }
        } else {
            // Check if we had a successful transaction before closing
            const hadSuccessfulTransaction = isTxSuccessful && (
                (positionType === 'loop' && loopTx.status === 'view' && loopTx.hash && !loopTx.errorMessage) ||
                (positionType === 'unloop' && unloopTx.status === 'view' && unloopTx.hash && !unloopTx.errorMessage) ||
                (positionType === 'lend' && lendTx.status === 'view' && lendTx.hash && !lendTx.errorMessage) ||
                (positionType === 'borrow' && borrowTx.status === 'view' && borrowTx.hash && !borrowTx.errorMessage)
            )

            if (lendTx.status !== 'approve' || borrowTx.status !== 'borrow' || loopTx.status !== 'approve' || unloopTx.status !== 'close_position') {
                setAmount('')

                setTimeout(() => {
                    resetLendBorrowTx()
                }, 500)
            }
            
            // Reset trade path state when closing
            setLastTradePathKey('')
            setIsLoadingTradePath(false)
            
            if ((positionType === 'loop' || positionType === 'unloop') && setShouldLogCalculation) {
                setShouldLogCalculation(false)
            }

            // Refresh position data if we had a successful transaction
            if (hadSuccessfulTransaction && onPositionRefresh) {
                setTimeout(() => {
                    onPositionRefresh()
                }, 1000) // Small delay to ensure transaction has propagated
            }
        }
    }

    function isShowBlock(action: { lend?: boolean; borrow?: boolean; loop?: boolean; unloop?: boolean }) {
        if (positionType === 'all') return false
        return action[positionType as Exclude<TPositionType, 'all'>]
    }

    const inputUsdAmount = Number(amount) * Number(assetDetails?.asset?.token?.price_usd ?? 0)
    const lendInputUsdAmount = Number(lendAmount) * Number(loopAssetDetails?.supplyAsset?.token?.price_usd ?? 0)
    const borrowInputUsdAmount = Number(borrowAmount) * Number(loopAssetDetails?.borrowAsset?.token?.price_usd ?? 0)

    const isLendTxInProgress = lendTx.isPending || lendTx.isConfirming
    const isBorrowTxInProgress = borrowTx.isPending || borrowTx.isConfirming
    const isLoopTxInProgress = loopTx.isPending || loopTx.isConfirming
    const isUnloopTxInProgress = unloopTx.isPending || unloopTx.isConfirming

    const isTxInProgress = positionType === 'lend' ? isLendTxInProgress : 
                          positionType === 'borrow' ? isBorrowTxInProgress : 
                          positionType === 'loop' ? isLoopTxInProgress : 
                          positionType === 'unloop' ? isUnloopTxInProgress : false

    const lendTxSpinnerColor = lendTx.isPending ? 'text-secondary-500' : 'text-primary'
    const borrowTxSpinnerColor = borrowTx.isPending ? 'text-secondary-500' : 'text-primary'

    const canDisplayExplorerLinkWhileLoading = getTxStatus(positionType).hash.length > 0 && 
                                             (getTxStatus(positionType).isConfirming || getTxStatus(positionType).isPending)

    function getNewHfColor() {
        const newHealthFactor = Number(healthFactorValues?.newHealthFactor ?? Number.MAX_VALUE)
        const healthFactorFormatted = newHealthFactor === Number.MAX_VALUE ? '∞' : newHealthFactor.toFixed(2)

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
        return Number(healthFactorValues.newHealthFactor?.toString() ?? 0) < Number(1.5)
    }

    const isDisableActionButton = disabled || isLoadingTradePath || isTxInProgress || 
                                 (!hasAcknowledgedRisk && positionType === 'borrow' && isHfLow())

    function handleActionButtonClick() {
        handleOpenChange(true)
        logEvent(
            `${getActionButtonText()?.toLowerCase().split(' ').join('_')}_clicked`,
            {
                amount,
                token_symbol: assetDetails?.asset?.token?.symbol || loopAssetDetails?.supplyAsset?.token?.symbol,
                platform_name: assetDetails?.name || loopAssetDetails?.name,
                chain_name: CHAIN_ID_MAPPER[Number(assetDetails?.chain_id || loopAssetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            }
        )
    }

    const showPointsEarnedBanner = lendTxCompleted || borrowTxCompleted

    const triggerButton = (
        <Button
            onClick={handleActionButtonClick}
            disabled={disabled}
            variant="primary"
            className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
        >
            <span className="uppercase leading-[0]">{getActionButtonText()}</span>
            <ArrowRightIcon
                width={16}
                height={16}
                className="stroke-white group-[:disabled]:opacity-50"
            />
        </Button>
    )

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
                    actionTitle: isLendPositionType ? 
                               isMorphoMarkets || isMorphoVault ? 'supply' : 'lend' : 'borrow',
                })}
            </BodyText>
            {canDisplayExplorerLinkWhileLoading && (
                <div className="flex items-center justify-between w-full py-[16px] bg-gray-200 lg:bg-white rounded-5 px-[24px]">
                    <BodyText level="body2" weight="normal" className="text-gray-600">
                        View on explorer
                    </BodyText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium" className="text-gray-800 flex items-center gap-[4px]">
                            <a
                                href={getExplorerLink(
                                    getTxStatus(positionType).hash,
                                    assetDetails?.chain_id ?? 1
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary-500"
                            >
                                {getTruncatedTxHash(getTxStatus(positionType).hash)}
                            </a>
                            <ArrowUpRightIcon width={16} height={16} className="stroke-secondary-500" />
                        </BodyText>
                    </div>
                </div>
            )}
        </div>
    ) : null

    function getHeaderText() {
        if (isTxFailed) {
            if (positionType === 'loop') {
                return 'Looping Failed'
            }
            if (positionType === 'unloop') {
                return 'Unlooping Failed'
            }
            return isLendPositionType ? 
                   isMorphoMarkets ? 'Add Collateral Failed' : 
                   isMorphoVault ? 'Supply to Vault Failed' : 'Lending Failed' : 'Borrowing Failed'
        }

        if (isTxSuccessful) {
            if (positionType === 'loop') {
                return 'Looping Successful'
            }
            if (positionType === 'unloop') {
                return 'Unlooping Successful'
            }
            return isLendPositionType ? 
                   isMorphoMarkets ? 'Add Collateral Successful' : 
                   isMorphoVault ? 'Supply to Vault Successful' : 'Lending Successful' : 'Borrowing Successful'
        }

        if (positionType === 'loop') {
            return 'Review Loop'
        }
        
        if (positionType === 'unloop') {
            return 'Review Unloop'
        }

        return isLendPositionType ? 
               isMorphoMarkets ? 'Add Collateral' : 
               isMorphoVault ? 'Supply to vault' : 'Review Lend' : `Review Borrow`
    }

    const contentHeader = (
        <>
            {isShowBlock({ lend: true, borrow: true, loop: Number(lendAmount) > 0, unloop: Number(lendAmount) > 0 }) && (
                <HeadingText level="h4" weight="medium" className="text-gray-800 text-center capitalize">
                    {getHeaderText()}
                </HeadingText>
            )}
            {isShowBlock({ loop: loopTx.status === 'view' || (positionType === 'loop' && isTxFailed), unloop: unloopTx.status === 'view' || (positionType === 'unloop' && isTxFailed) }) && (
                <div className="flex flex-col items-center justify-center gap-[6px]">
                    {isShowBlock({ lend: isTxSuccessful || isTxFailed, borrow: isTxSuccessful || isTxFailed, loop: isTxSuccessful || isTxFailed, unloop: isTxSuccessful || isTxFailed }) && (
                        <Badge
                            variant={isTxFailed ? 'destructive' : 'green'}
                            className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                        >
                            {isLendPositionType && (isTxSuccessful || (positionType === 'lend' && isTxFailed)) ? 
                             isMorphoMarkets ? 'Add Collateral' : 
                             isMorphoVault ? 'Supply to vault' : 'Earn' : 
                             positionType === 'loop' ? 'Loop' : 
                             positionType === 'unloop' ? 'Unloop' : 'Borrow'}{' '}
                            {isTxFailed ? 'Failed' : 'Successful'}
                            {!isTxFailed && (
                                <CircleCheckIcon width={16} height={16} className="stroke-[#00AD31]" />
                            )}
                            {isTxFailed && (
                                <CircleXIcon width={16} height={16} className="stroke-danger-500" />
                            )}
                        </Badge>
                    )}
                    {isShowBlock({ lend: lendTx.status === 'lend' && !isLendTxInProgress, borrow: false }) && (
                        <Badge
                            variant="green"
                            className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                        >
                            Token approved
                            <CircleCheckIcon width={16} height={16} className="stroke-[#00AD31]" />
                        </Badge>
                    )}
                </div>
            )}
        </>
    )

    const getEffectiveLendAmount = () => {
        if (positionType !== 'loop' || !hasLoopPosition || !currentPositionData || !newPositionData) {
            return lendAmount
        }
        
        const collateralChange = newPositionData.lendAmount - currentPositionData.lendAmount
        const decimals = loopAssetDetails?.supplyAsset?.token?.decimals || 6
        return Math.abs(collateralChange) < 0.000001 ? '0' : collateralChange.toFixed(decimals).replace(/\.?0+$/, '')
    }

    const getEffectiveBorrowAmount = () => {
        if (positionType !== 'loop' || !hasLoopPosition || !currentPositionData || !newPositionData) {
            return borrowAmount
        }
        
        const borrowChange = newPositionData.borrowAmount - currentPositionData.borrowAmount
        const decimals = loopAssetDetails?.borrowAsset?.token?.decimals || 6
        return Math.abs(borrowChange) < 0.000001 ? '0' : Math.abs(borrowChange).toFixed(decimals).replace(/\.?0+$/, '')
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

    const contentBody = (
        <div className="flex flex-col gap-3 max-w-full overflow-hidden">
            {/* Show token details for loop (increase) and regular lend/borrow operations */}
            {isShowBlock({
                lend: true,
                borrow: true,
                loop: Number(lendAmount) > 0 || (hasLoopPosition && currentPositionData && newPositionData && Math.abs(newPositionData.lendAmount - currentPositionData.lendAmount) > 0.000001),
                unloop: false, // Don't show for unloop/decrease
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
                    tokenDecimals: assetDetails?.asset?.token?.decimals || loopAssetDetails?.supplyAsset?.token?.decimals,
                })
            )}
            {isShowBlock({
                loop: Number(borrowAmount) > 0 || (hasLoopPosition && currentPositionData && newPositionData && Math.abs(newPositionData.borrowAmount - currentPositionData.borrowAmount) > 0.000001),
                unloop: false, // Don't show for unloop/decrease
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
                    tokenDecimals: loopAssetDetails?.borrowAsset?.token?.decimals,
                })
            )}
            {/* Position Changes Preview Card - Show first for unloop/decrease */}
            {isShowBlock({
                loop: hasLoopPosition && currentPositionData && newPositionData && (Number(lendAmount) > 0 || Number(leverage) !== currentPositionData.currentLeverage),
                unloop: hasLoopPosition && currentPositionData && newPositionData && (Number(lendAmount) > 0 || Number(leverage) !== currentPositionData.currentLeverage),
            }) && (
                <div className="flex flex-col items-center justify-between px-6 py-4 bg-gray-200 lg:bg-white rounded-5">
                    <div className="flex flex-col gap-3 w-full">
                        <BodyText level="body2" weight="medium" className="text-gray-800">
                            Position Changes Preview
                        </BodyText>
                        
                        <div className="flex items-center justify-between">
                            <BodyText level="body3" className="text-gray-600">
                                Total Collateral
                            </BodyText>
                            <div className="flex items-center gap-2">
                                <BodyText level="body3" className="text-gray-800">
                                    {((currentPositionData.lendAmount || 0).toFixed(loopAssetDetails?.supplyAsset?.token?.decimals || 6)).replace(/\.?0+$/, '')} {loopAssetDetails?.supplyAsset?.token?.symbol}
                                </BodyText>
                                {currentPositionData.lendAmount?.toFixed(loopAssetDetails?.supplyAsset?.token?.decimals || 6) !== newPositionData.lendAmount?.toFixed(loopAssetDetails?.supplyAsset?.token?.decimals || 6) && (
                                    <>
                                        <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                        <BodyText level="body3" className="text-gray-800">
                                            {((newPositionData.lendAmount || 0).toFixed(loopAssetDetails?.supplyAsset?.token?.decimals || 6)).replace(/\.?0+$/, '')} {loopAssetDetails?.supplyAsset?.token?.symbol}
                                        </BodyText>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <BodyText level="body3" className="text-gray-600">
                                Total Borrowed
                            </BodyText>
                            <div className="flex items-center gap-2">
                                <BodyText level="body3" className="text-gray-800">
                                    {((currentPositionData.borrowAmount || 0).toFixed(loopAssetDetails?.borrowAsset?.token?.decimals || 6)).replace(/\.?0+$/, '')} {loopAssetDetails?.borrowAsset?.token?.symbol}
                                </BodyText>
                                {currentPositionData.borrowAmount?.toFixed(loopAssetDetails?.borrowAsset?.token?.decimals || 6) !== newPositionData.borrowAmount?.toFixed(loopAssetDetails?.borrowAsset?.token?.decimals || 6) && (
                                    <>
                                        <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                        <BodyText level="body3" className="text-gray-800">
                                            {((newPositionData.borrowAmount || 0).toFixed(loopAssetDetails?.borrowAsset?.token?.decimals || 6)).replace(/\.?0+$/, '')} {loopAssetDetails?.borrowAsset?.token?.symbol}
                                        </BodyText>
                                    </>
                                )}
                            </div>
                        </div>

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
                </div>
            )}

            {/* Main Information Card */}
            <div className="flex flex-col items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-400">
                {isShowBlock({ lend: isMorphoMarkets }) && (
                    <div className={`flex items-center justify-between w-full py-3`}>
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            Balance
                        </BodyText>
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            {handleSmallestValue(
                                (Number(balance) - Number(amount)).toString()
                            )}{' '}
                            {assetDetails?.asset?.token?.symbol}
                        </BodyText>
                    </div>
                )}
                {isShowBlock({ loop: true, unloop: true }) && (
                    <div className={`flex items-center justify-between w-full py-3`}>
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            Leverage
                        </BodyText>
                        <Badge variant="secondary">
                            {roundLeverageUp(typeof leverage === 'number' ? leverage : 1).toFixed(1)}x
                        </Badge>
                    </div>
                )}

                {isShowBlock({
                    borrow: borrowTx.status === 'borrow' || borrowTx.status === 'view',
                }) && (
                    <div className="flex items-center justify-between w-full py-2">
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            New limit
                        </BodyText>
                        <div className="flex items-center gap-[4px]">
                            <BodyText level="body2" weight="normal" className="text-gray-800">
                                {handleSmallestValue(
                                    (Number(maxBorrowAmount.maxToBorrowFormatted) - Number(amount)).toString(),
                                    getMaxDecimalsToDisplay(assetDetails?.asset?.token?.symbol ?? '')
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
                    borrow: borrowTx.status === 'borrow' || borrowTx.status === 'view',
                    loop: true,
                    unloop: true,
                }) && (
                    <div className="flex items-center justify-between w-full py-2">
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            Health factor
                        </BodyText>
                        <div className="flex flex-col items-end justify-end gap-0">
                            <div className="flex items-center gap-2">
                                {!!Number(healthFactorValues.healthFactor) && (
                                    <BodyText level="body2" weight="normal" className={`text-gray-800`}>
                                        {Number(healthFactorValues.healthFactor) < 0 && (
                                            <InfinityIcon className="w-4 h-4" />
                                        )}
                                        {Number(healthFactorValues?.healthFactor) >= 0 &&
                                            healthFactorValues.healthFactor.toFixed(2)}
                                    </BodyText>
                                )}
                                {(!!Number(healthFactorValues.newHealthFactor) && !!Number(healthFactorValues.healthFactor)) && (
                                    <ArrowRightIcon width={16} height={16} className="stroke-gray-800" strokeWidth={2.5} />
                                )}
                                {(!!Number(healthFactorValues.newHealthFactor)) && (
                                    <BodyText level="body2" weight="normal" className={getNewHfColor()}>
                                        {healthFactorValues.newHealthFactor?.toFixed(2)}
                                    </BodyText>
                                )}
                            </div>
                            <Label size="small" className="text-gray-600">
                                Liquidation at &lt;1.0
                            </Label>
                        </div>
                    </div>
                )}

                {isShowBlock({ loop: true, unloop: true }) && (
                    <div className="flex items-center justify-between gap-2 w-full py-3">
                        <div className="flex items-center gap-2">
                            <BodyText level="body2" weight="normal" className="text-gray-600">
                                Net APY of Loop
                            </BodyText>
                            <InfoTooltip content="Projected Net APY for the new looping position" />
                        </div>
                        <BodyText
                            level="body2"
                            weight="medium"
                            className={cn(
                                loopAssetDetails?.loopNetAPY && (
                                    loopAssetDetails?.loopNetAPY.startsWith('+') ? 'text-green-600' : 
                                    loopAssetDetails?.loopNetAPY.startsWith('-') ? 'text-red-600' : 'text-gray-800'
                                )
                            )}
                        >
                            {loopAssetDetails?.loopNetAPY || '0.00%'}
                        </BodyText>
                    </div>
                )}

                {isShowBlock({ lend: false, borrow: false }) && (
                    <div className="flex items-center justify-between w-full py-[16px]">
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            View on explorer
                        </BodyText>
                        <div className="flex items-center gap-[4px]">
                            <BodyText level="body2" weight="medium" className="text-gray-800 flex items-center gap-[4px]">
                                <a
                                    href={getExplorerLink(
                                        getTxStatus(positionType).hash,
                                        assetDetails?.chain_id ?? 1
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-secondary-500"
                                >
                                    {getTruncatedTxHash(getTxStatus(positionType).hash)}
                                </a>
                                <ArrowUpRightIcon width={16} height={16} className="stroke-secondary-500" />
                            </BodyText>
                        </div>
                    </div>
                )}
            </div>
            {isShowBlock({ borrow: isHfLow() }) && (
                <div className="flex flex-col items-center justify-center">
                    <CustomAlert description="Borrowing this amount is not advisable, as the heath factor is close to 1, posing a risk of liquidation." />
                    <div
                        className="flex items-center gap-2 w-fit my-5"
                        onClick={() => setHasAcknowledgedRisk(!hasAcknowledgedRisk)}
                    >
                        <Checkbox id="terms" checked={hasAcknowledgedRisk} />
                        <Label size="medium" className="text-gray-800" id="terms">
                            I acknowledge the risks involved.
                        </Label>
                    </div>
                </div>
            )}
            {isShowBlock({
                lend: (lendTx.status === 'approve' && (isLendTxInProgress || (!isLendTxInProgress && lendTx.isConfirmed))) || 
                      lendTx.status === 'lend' || lendTx.status === 'view',
            }) && (
                <div className="py-1">
                    {isLendTxInProgress && lendTx.status === 'approve' && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    {lendTx.isPending && 'Waiting for confirmation...'}
                                    {lendTx.isConfirming && 'Approving...'}
                                </BodyText>
                            </div>
                            {lendTx.hash && lendTx.status === 'approve' && (
                                <ExternalLink
                                    href={getExplorerLink(lendTx.hash, assetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    )}
                    {((!isLendTxInProgress && lendTx.isConfirmed) || lendTx.status === 'lend' || lendTx.status === 'view') &&
                        (!ETH_ADDRESSES.includes(assetDetails?.asset?.token?.address?.toLowerCase() ?? '')) && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                        <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                    </div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Approval successful
                                    </BodyText>
                                </div>
                                {lendTx.hash && lendTx.status === 'approve' && (
                                    <ExternalLink
                                        href={getExplorerLink(lendTx.hash, assetDetails?.chain_id ?? 1)}
                                    >
                                        <BodyText level="body2" weight="normal" className="text-inherit">
                                            View on explorer
                                        </BodyText>
                                    </ExternalLink>
                                )}
                            </div>
                        )}
                </div>
            )}
            {isShowBlock({
                lend: (lendTx.status === 'lend' && (isLendTxInProgress || (!isLendTxInProgress && lendTx.isConfirmed))) || 
                      lendTx.status === 'view',
                borrow: false,
            }) && (
                <div className="py-1">
                    {isLendTxInProgress && (
                        <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    {lendTx.isPending && 'Waiting for confirmation...'}
                                    {lendTx.isConfirming && 'Lending...'}
                                </BodyText>
                            </div>
                            {lendTx.hash && (lendTx.isConfirming || lendTx.isConfirmed) && (
                                <ExternalLink
                                    href={getExplorerLink(lendTx.hash, assetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    )}
                    {((!isLendTxInProgress && lendTx.isConfirmed) || (lendTx.status === 'view' && lendTx.isConfirmed)) && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Lend successful
                                </BodyText>
                            </div>
                            {lendTx.hash && (lendTx.isConfirming || lendTx.isConfirmed) && (
                                <ExternalLink
                                    href={getExplorerLink(lendTx.hash, assetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    )}
                </div>
            )}
            {isShowBlock({
                loop: loopTx.status === 'approve' || loopTx.status === 'create_strategy' || 
                      loopTx.status === 'open_position' || loopTx.status === 'view',
            }) && (
                <div className="py-2">
                    {isLoopTxInProgress && loopTx.status === 'approve' && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    {loopTx.isPending && 'Waiting for confirmation...'}
                                    {loopTx.isConfirming && 'Approving...'}
                                </BodyText>
                            </div>
                            {loopTx.hash && loopTx.status === 'approve' && (
                                <ExternalLink
                                    href={getExplorerLink(loopTx.hash, loopAssetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
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
                                    <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
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
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
            {isShowBlock({
                loop: loopTx.status === 'check_strategy' || loopTx.status === 'create_strategy' || 
                      loopTx.status === 'open_position' || loopTx.status === 'view',
            }) && (
                <div className="py-2">
                    {loopTx.status === 'check_strategy' && isLoopTxInProgress && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    Checking for existing strategy...
                                </BodyText>
                            </div>
                        </div>
                    )}
                    {(loopTx.status === 'check_strategy' && !isLoopTxInProgress && loopTx.hash && !loopTx.errorMessage) ||
                     (loopTx.status === 'create_strategy') ||
                     (loopTx.status === 'open_position') ||
                     (loopTx.status === 'view') ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    {loopTx.hash === 'strategy_found' ? 'Strategy found' : 'Strategy check complete'}
                                </BodyText>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
            {isShowBlock({ loop: loopTx.status === 'create_strategy' }) && (
                <div className="py-2">
                    {isLoopTxInProgress && loopTx.status === 'create_strategy' && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    {loopTx.isPending && 'Waiting for confirmation...'}
                                    {loopTx.isConfirming && 'Creating strategy...'}
                                </BodyText>
                            </div>
                            {loopTx.hash && loopTx.status === 'create_strategy' && (
                                <ExternalLink
                                    href={getExplorerLink(loopTx.hash, loopAssetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
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
                                    <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Strategy created successfully
                                </BodyText>
                            </div>
                            {loopTx.hash && loopTx.status === 'create_strategy' && (
                                <ExternalLink
                                    href={getExplorerLink(loopTx.hash, loopAssetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
            {isShowBlock({ loop: loopTx.status === 'open_position' || loopTx.status === 'view' }) && (
                <div className="py-2">
                    {isLoopTxInProgress && loopTx.status === 'open_position' && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    {loopTx.isPending && 'Waiting for confirmation...'}
                                    {loopTx.isConfirming && 'Opening position...'}
                                </BodyText>
                            </div>
                            {loopTx.hash && loopTx.status === 'open_position' && (
                                <ExternalLink
                                    href={getExplorerLink(loopTx.hash, loopAssetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    )}
                    {(!isLoopTxInProgress && loopTx.isConfirmed && loopTx.status === 'view' && !!loopTx.hash && !loopTx.errorMessage) && (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center justify-start gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Loop successful
                                </BodyText>
                            </div>
                            {!!loopTx.hash && (
                                <ExternalLink
                                    href={getExplorerLink(loopTx.hash, loopAssetDetails?.chain_id ?? 1)}
                                >
                                    <BodyText level="body2" weight="normal" className="text-inherit">
                                        View on explorer
                                    </BodyText>
                                </ExternalLink>
                            )}
                        </div>
                    )}
                </div>
            )}
            {showPointsEarnedBanner && <TxPointsEarnedBanner />}
            {/* Always render ActionButton but with proper loading states */}
            <ActionButton
                disabled={isDisableActionButton || isLoadingTradePath}
                ctaText={getActionButtonText()}
                isLoading={isLoadingTradePath}
                handleCloseModal={handleOpenChange}
                asset={assetDetailsForActionButton}
                amount={getActionButtonAmount()}
                setActionType={setActionType}
                actionType={positionType === 'all' ? 'lend' : positionType as Exclude<TPositionType, 'all'>}
            />
        </div>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px] gap-0 p-0">
                    <div className="flex flex-col">
                        {/* <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <DialogTitle className="text-lg font-medium">
                                {getHeaderText()}
                            </DialogTitle>
                            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div> */}

                        <div className="p-4 space-y-4">
                            {contentHeader}
                            {contentBody}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <>
            <Drawer open={open} dismissible={false}>
                <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
                <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                    {closeContentButton}
                    <DrawerHeader>{contentHeader}</DrawerHeader>
                    {contentBody}
                </DrawerContent>
            </Drawer>
        </>
    )
}