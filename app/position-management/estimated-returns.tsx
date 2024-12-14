import { getEstimatedEarnings } from './helper-functions'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { TPlatform } from '@/types'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    abbreviateNumber,
    cn,
    containsNegativeInteger,
    convertNegativeToPositive,
} from '@/lib/utils'
import ImageWithDefault from '@/components/ImageWithDefault'
import { motion } from 'framer-motion'
import TooltipText from '@/components/tooltips/TooltipText'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { useSearchParams } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { usePositionManagementContext } from '@/context/position-management-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { POOL_BASED_PROTOCOLS } from '@/constants'

type TRow = {
    id: number
    key: 'lend' | 'borrow' | 'duration'
    title: string
    logo?: string
    selectedLabel: string
    selectedValue: number
    hasSelectedValue: boolean
    totalValue: number
    step: number
    show: boolean
}

const STABLE_TOKEN_SYMBOLS = ['wBTC', 'wETH', 'USDC', 'USDT']

const DEFAULT_SELECTED_VALUES = {
    lend: 0,
    borrow: 0,
    duration: 1,
}

export function EstimatedReturns({
    platformDetails,
}: {
    platformDetails: TPlatform
}) {
    const { platformHistoryData } = usePositionManagementContext()
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const positionType = searchParams.get('position_type') || 'lend'
    const [selectedValue, setSelectedValue] = useState(DEFAULT_SELECTED_VALUES)
    const [selectedStableTokenDetails, setSelectedStableTokenDetails] =
        useState<any>(null)
    const [lendAssetDetails, setLendAssetDetails] = useState<any>(null)
    const [borrowAssetDetails, setBorrowAssetDetails] = useState<any>(null)
    const [stableLendAssetsList, setStableLendAssetsList] = useState<any[]>([])
    const [stableBorrowAssetsList, setStableBorrowAssetsList] = useState<any[]>(
        []
    )
    const [isUSDAmount, setIsUSDAmount] = useState(false)
    const isAaveV3 = platformDetails?.platform.protocol_type === 'aaveV3'
    const isCompoundV2 =
        platformDetails?.platform.protocol_type === 'compoundV2'
    const isMorpho = platformDetails?.platform.protocol_type === 'morpho'
    const isFluidVault = platformDetails?.platform.isVault

    useEffect(() => {
        /*
            1. If protocol_type is aaveV3, then get the lend/borrow asset details from the token address
            2. If protocol_type is other than aaveV3, then get the lend asset details from the platform data
        */
        if (isAaveV3) {
            if (positionType === 'lend') {
                // Get lend asset details
                setLendAssetDetails(
                    platformDetails?.assets.find(
                        (asset) =>
                            asset.token.address.toLowerCase() ===
                            tokenAddress.toLowerCase()
                    )
                )
                // Get the first borrow asset details
                setBorrowAssetDetails(
                    platformDetails?.assets.filter(
                        (asset) => asset.borrow_enabled
                    )[0]
                )
                // Get stable borrow assets list
                setStableBorrowAssetsList(platformDetails?.assets)
            } else {
                // Get stable lend assets list
                setStableLendAssetsList(platformDetails?.assets)
                // Get the first lend asset details
                setLendAssetDetails(platformDetails?.assets[0])
                // Get borrow asset details
                setBorrowAssetDetails(
                    platformDetails?.assets.find(
                        (asset) =>
                            asset.token.address.toLowerCase() ===
                            tokenAddress.toLowerCase()
                    )
                )
            }
        } else {
            // Get the first lend asset details
            setLendAssetDetails(
                platformDetails?.assets.filter(
                    (asset) => !asset.borrow_enabled
                )[0]
            )
            // Get the first borrow asset details
            setBorrowAssetDetails(
                platformDetails?.assets.filter(
                    (asset) => asset.borrow_enabled
                )[0]
            )
        }
    }, [tokenAddress])

    // Reset borrow value when lend value changes
    useEffect(() => {
        setSelectedValue((prev) => ({ ...prev, borrow: 0 }))
    }, [selectedValue.lend])

    // Reset lend and borrow value when stable token dropdown value changes
    useEffect(() => {
        if (positionType === 'borrow') {
            setSelectedValue((prev) => ({ ...prev, lend: 0, borrow: 0 }))
        } else {
            setSelectedValue((prev) => ({ ...prev, borrow: 0 }))
        }
    }, [selectedStableTokenDetails?.token.logo])

    const handleSelectedValueChange = (
        value: number,
        type: 'lend' | 'borrow' | 'duration'
    ) => {
        setSelectedValue((prev) => ({ ...prev, [type]: value }))
    }

    const supplyAPY = isMorpho
        ? 0
        : isAaveV3 && positionType === 'borrow'
          ? selectedStableTokenDetails?.supply_apy || 0
          : lendAssetDetails?.supply_apy || 0
    const borrowAPY = isMorpho
        ? -borrowAssetDetails?.supply_apy
        : isAaveV3 && positionType === 'lend'
          ? selectedStableTokenDetails?.variable_borrow_apy || 0
          : borrowAssetDetails?.variable_borrow_apy || 0
    const duration = selectedValue?.duration || 0

    const assetLTV = lendAssetDetails?.ltv

    const amountSupplied = selectedValue.lend
    const amountBorrowed = selectedValue.borrow

    const lendTokenDetails =
        isAaveV3 && positionType === 'borrow'
            ? selectedStableTokenDetails
            : lendAssetDetails
    const borrowTokenDetails =
        isAaveV3 && positionType === 'lend'
            ? selectedStableTokenDetails
            : borrowAssetDetails
    const maxBorrowAmountInUsd =
        (assetLTV / 100) *
        (isUSDAmount
            ? selectedValue.lend
            : (lendTokenDetails?.token.price_usd ?? 0) * selectedValue.lend)

    useEffect(() => {
        setSelectedStableTokenDetails(
            positionType === 'borrow'
                ? stableLendAssetsList[0]
                : stableBorrowAssetsList[0]
        )
    }, [stableLendAssetsList, stableBorrowAssetsList])

    const rows: TRow[] = [
        {
            id: 1,
            key: 'lend',
            title: 'lend collateral',
            logo: lendTokenDetails?.token.logo,
            selectedLabel: lendTokenDetails?.token.symbol || '',
            selectedValue: selectedValue.lend,
            hasSelectedValue: !(stableLendAssetsList.length > 0),
            totalValue: isUSDAmount
                ? 25000
                : Math.max(25000 / (lendTokenDetails?.token.price_usd ?? 0), 5),
            step: isUSDAmount
                ? 50
                : Math.min(0.01, 50 / (lendTokenDetails?.token.price_usd ?? 0)),
            show: !(isMorpho && positionType === 'lend'),
        },
        {
            id: 2,
            key: 'borrow',
            title: isMorpho && positionType === 'lend' ? 'Supply' : 'Borrowing',
            logo: borrowTokenDetails?.token.logo,
            selectedLabel: borrowTokenDetails?.token.symbol || '',
            selectedValue: selectedValue.borrow,
            hasSelectedValue: !(stableBorrowAssetsList.length > 0),
            totalValue:
                (isMorpho && positionType === 'lend') ||
                (!lendAssetDetails && isCompoundV2)
                    ? 25000
                    : isUSDAmount
                      ? maxBorrowAmountInUsd
                      : maxBorrowAmountInUsd /
                        (borrowTokenDetails?.token.price_usd ?? 0),
            step: isUSDAmount
                ? 50
                : Math.min(0.01, 50 / borrowTokenDetails?.token.price_usd),
            show: true,
        },
        {
            id: 3,
            key: 'duration',
            title: 'Duration',
            selectedLabel: selectedValue.duration > 1 ? 'Months' : 'Month',
            selectedValue: selectedValue.duration,
            hasSelectedValue: true,
            totalValue: 24,
            step: 1,
            show: true,
        },
    ]

    const { interestGain, interestLoss, netEstimatedEarnings } =
        getEstimatedEarnings({
            supplyAPY,
            borrowAPY,
            amountSupplied,
            amountBorrowed,
            duration,
        })

    const lendTokenPrice =
        positionType === 'lend'
            ? (lendAssetDetails?.token?.price_usd ?? 0)
            : (selectedStableTokenDetails?.token?.price_usd ?? 0)
    const borrowTokenPrice =
        positionType === 'borrow'
            ? (borrowAssetDetails?.token?.price_usd ?? 0)
            : (selectedStableTokenDetails?.token?.price_usd ?? 0)

    const netEstimatedEarningFinal = isUSDAmount
        ? netEstimatedEarnings
        : interestGain * lendTokenPrice - interestLoss * borrowTokenPrice

    function getDisplayedValuePrefix(key: 'lend' | 'borrow' | 'duration') {
        return key === 'lend' || key === 'borrow'
            ? isUSDAmount
                ? '$'
                : ''
            : ''
    }

    function getDisplayedValueSufix(key: 'lend' | 'borrow' | 'duration') {
        return key === 'duration' ? ' Years' : ''
    }

    function isAssetNotAvailable(rowItem: TRow) {
        return !rowItem.logo && rowItem.key !== 'duration'
    }

    function handleIsUSDAmountChange(checked: boolean) {
        setIsUSDAmount(checked)
        setSelectedValue({
            lend: 0,
            borrow: 0,
            duration: 1,
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
        >
            <Card>
                <CardHeader className="pb-[12px]">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-[12px]">
                        <div className="flex flex-wrap items-center gap-[16px]">
                            {/* Estimate returns by using slider below */}
                            <div className="flex items-center gap-[8px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Estimate returns by using slider below
                                </BodyText>
                                <InfoTooltip
                                    content={`This is an approximate estimate of returns ${isMorpho ? '(including rewards)' : ''}`}
                                />
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <Switch
                                    id="values-format"
                                    checked={isUSDAmount}
                                    onCheckedChange={handleIsUSDAmountChange}
                                />
                                <Label
                                    htmlFor="values-format"
                                    weight="normal"
                                    className="text-gray-600 sm:text-[14px]"
                                >
                                    USD Amount
                                </Label>
                            </div>
                        </div>
                        {/* Estimated earnings */}
                        <div className="flex items-center gap-[8px]">
                            {/* Title */}
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Estimated Earnings
                            </BodyText>
                            {/* Info tooltip for token amount */}
                            <InfoTooltip
                                label={
                                    <HeadingText
                                        level="h4"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        <TooltipText>
                                            {containsNegativeInteger(
                                                netEstimatedEarningFinal
                                            )
                                                ? '-'
                                                : ''}
                                            $
                                            {abbreviateNumber(
                                                Number(
                                                    convertNegativeToPositive(
                                                        netEstimatedEarningFinal
                                                    )
                                                )
                                            )}
                                        </TooltipText>
                                    </HeadingText>
                                }
                                content={
                                    !isMorpho ? (
                                        <div className="flex flex-col gap-[12px]">
                                            <div className="flex flex-col gap-[4px]">
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="capitalize text-gray-600"
                                                >
                                                    Accrued Earnings -
                                                </BodyText>
                                                <div className="flex items-center gap-[6px]">
                                                    <HeadingText
                                                        level="h5"
                                                        weight="medium"
                                                        className="text-gray-800"
                                                    >
                                                        {containsNegativeInteger(
                                                            interestGain
                                                        )
                                                            ? '-'
                                                            : ''}
                                                        {isUSDAmount ? '$' : ''}
                                                        {abbreviateNumber(
                                                            Number(
                                                                convertNegativeToPositive(
                                                                    interestGain
                                                                )
                                                            )
                                                        )}
                                                    </HeadingText>
                                                    <ImageWithDefault
                                                        src={
                                                            lendTokenDetails
                                                                ?.token.logo
                                                        }
                                                        alt={
                                                            lendTokenDetails
                                                                ?.token.symbol
                                                        }
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full max-w-[20px] max-h-[20px]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-[4px]">
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="capitalize text-gray-600"
                                                >
                                                    Interest Paid -
                                                </BodyText>
                                                <div className="flex items-center gap-[6px]">
                                                    <HeadingText
                                                        level="h5"
                                                        weight="medium"
                                                        className="text-gray-800"
                                                    >
                                                        {containsNegativeInteger(
                                                            interestLoss
                                                        )
                                                            ? '-'
                                                            : ''}
                                                        {isUSDAmount ? '$' : ''}
                                                        {abbreviateNumber(
                                                            Number(
                                                                convertNegativeToPositive(
                                                                    interestLoss
                                                                )
                                                            )
                                                        )}
                                                    </HeadingText>
                                                    <ImageWithDefault
                                                        src={
                                                            borrowTokenDetails
                                                                ?.token.logo
                                                        }
                                                        alt={
                                                            borrowTokenDetails
                                                                ?.token.symbol
                                                        }
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full max-w-[20px] max-h-[20px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-[4px]">
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="capitalize text-gray-600"
                                            >
                                                Accrued Earnings -
                                            </BodyText>
                                            <div className="flex items-center gap-[6px]">
                                                <HeadingText
                                                    level="h5"
                                                    weight="medium"
                                                    className="text-gray-800"
                                                >
                                                    {containsNegativeInteger(
                                                        -interestLoss
                                                    )
                                                        ? '-'
                                                        : ''}
                                                    {isUSDAmount ? '$' : ''}
                                                    {abbreviateNumber(
                                                        Number(
                                                            convertNegativeToPositive(
                                                                interestLoss
                                                            )
                                                        )
                                                    )}
                                                </HeadingText>
                                                <ImageWithDefault
                                                    src={
                                                        borrowTokenDetails
                                                            ?.token.logo
                                                    }
                                                    alt={
                                                        borrowTokenDetails
                                                            ?.token.symbol
                                                    }
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full max-w-[20px] max-h-[20px]"
                                                />
                                            </div>
                                        </div>
                                    )
                                }
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="bg-white rounded-5 px-[32px] py-[28px]">
                    <div className="flex flex-col gap-[36px]">
                        {rows
                            .filter((row) => row.show)
                            .map((row) => (
                                <div
                                    key={row.id}
                                    className="flex flex-col gap-[16px]"
                                >
                                    <div className="flex items-end md:items-center justify-between">
                                        {/* Title */}
                                        <div className="flex flex-col md:flex-row md:items-center gap-[8px]">
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="capitalize text-gray-600"
                                            >
                                                {row.title} -
                                            </BodyText>
                                            {/* Selected value */}
                                            <div className="flex items-center gap-[6px]">
                                                {!isAssetNotAvailable(row) && (
                                                    <>
                                                        <HeadingText
                                                            level="h5"
                                                            weight="medium"
                                                            className="text-gray-800"
                                                        >
                                                            {getDisplayedValuePrefix(
                                                                row.key
                                                            )}
                                                            {abbreviateNumber(
                                                                row.selectedValue,
                                                                row.key ===
                                                                    'duration'
                                                                    ? 0
                                                                    : 2
                                                            )}
                                                        </HeadingText>
                                                        {row.hasSelectedValue && (
                                                            <div className="flex items-center gap-[6px]">
                                                                {row.logo && (
                                                                    <ImageWithDefault
                                                                        src={
                                                                            row.logo
                                                                        }
                                                                        alt={
                                                                            row.selectedLabel
                                                                        }
                                                                        width={
                                                                            20
                                                                        }
                                                                        height={
                                                                            20
                                                                        }
                                                                        className="rounded-full max-w-[20px] max-h-[20px]"
                                                                    />
                                                                )}
                                                                <HeadingText
                                                                    level="h5"
                                                                    weight="medium"
                                                                    className="text-gray-800"
                                                                >
                                                                    {
                                                                        row.selectedLabel
                                                                    }
                                                                </HeadingText>
                                                            </div>
                                                        )}
                                                        {!row.hasSelectedValue && (
                                                            <StableTokensDropdown
                                                                options={
                                                                    row.key ===
                                                                    'lend'
                                                                        ? stableLendAssetsList
                                                                        : stableBorrowAssetsList
                                                                }
                                                                selectedStableTokenDetails={
                                                                    selectedStableTokenDetails
                                                                }
                                                                setSelectedStableTokenDetails={
                                                                    setSelectedStableTokenDetails
                                                                }
                                                            />
                                                        )}
                                                    </>
                                                )}
                                                {isAssetNotAvailable(row) && (
                                                    <BodyText
                                                        level="body1"
                                                        weight="normal"
                                                        className="text-gray-600"
                                                    >
                                                        N/A
                                                    </BodyText>
                                                )}
                                            </div>
                                        </div>
                                        {/* Total value */}
                                        {!isAssetNotAvailable(row) && (
                                            <div className="flex items-center gap-[6px]">
                                                <BodyText
                                                    level="body1"
                                                    weight="normal"
                                                    className="text-gray-600"
                                                >
                                                    {getDisplayedValuePrefix(
                                                        row.key
                                                    )}
                                                    {abbreviateNumber(
                                                        row.key === 'duration'
                                                            ? row.totalValue /
                                                                  12
                                                            : row.totalValue,
                                                        row.key === 'duration'
                                                            ? 0
                                                            : 2
                                                    )}
                                                    {getDisplayedValueSufix(
                                                        row.key
                                                    )}
                                                </BodyText>
                                                {row.logo && (
                                                    <ImageWithDefault
                                                        src={row.logo}
                                                        alt={row.selectedLabel}
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full max-w-[20px] max-h-[20px]"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {isAssetNotAvailable(row) && (
                                            <BodyText
                                                level="body1"
                                                weight="normal"
                                                className="text-gray-600"
                                            >
                                                N/A
                                            </BodyText>
                                        )}
                                    </div>
                                    <Slider
                                        disabled={
                                            isAssetNotAvailable(row) ||
                                            (row.key === 'borrow' &&
                                                row.totalValue === 0)
                                        }
                                        key={`${row.key}-${isUSDAmount ? 'usd' : 'token'}-${selectedStableTokenDetails?.token.logo}-${selectedValue.lend === 0}`}
                                        defaultValue={[row.selectedValue]}
                                        max={row.totalValue}
                                        step={row.step}
                                        value={[row.selectedValue]}
                                        onValueChange={(value) =>
                                            handleSelectedValueChange(
                                                value[0],
                                                row.key
                                            )
                                        }
                                        className={cn(
                                            'group',
                                            isAssetNotAvailable(row) ||
                                                (row.key === 'borrow' &&
                                                    row.totalValue === 0)
                                                ? 'disabled'
                                                : ''
                                        )}
                                    />
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Child component
function StableTokensDropdown({
    options,
    selectedStableTokenDetails,
    setSelectedStableTokenDetails,
}: {
    options: any[]
    selectedStableTokenDetails: any
    setSelectedStableTokenDetails: (token: any) => void
}) {
    // useEffect(() => {
    //     setSelectedStableTokenDetails(options[0]);
    // }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="md"
                    variant="outline"
                    className="group flex items-center gap-1 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800 rounded-2 focus-visible:ring-0 border-none"
                >
                    <ImageWithDefault
                        src={selectedStableTokenDetails?.token.logo}
                        alt={selectedStableTokenDetails?.token.symbol}
                        width={18}
                        height={18}
                        className="rounded-full max-w-[18px] max-h-[18px]"
                    />
                    <BodyText
                        level="body2"
                        weight="medium"
                        className="text-gray-800"
                    >
                        {selectedStableTokenDetails?.token.symbol}
                    </BodyText>
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <DropdownMenuLabel className="text-gray-600 py-2 px-4 font-normal">
                    Select Token
                </DropdownMenuLabel>
                <ScrollArea className="h-[200px]">
                    {options?.map((asset: any) => (
                        <DropdownMenuItem
                            key={asset?.token?.address}
                            onClick={() => setSelectedStableTokenDetails(asset)}
                            className={cn(
                                'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                                selectedStableTokenDetails?.token?.address ===
                                    asset?.token?.address && 'bg-gray-400'
                            )}
                        >
                            <ImageWithDefault
                                src={asset?.token?.logo || ''}
                                alt={asset?.token?.symbol || ''}
                                width={20}
                                height={20}
                                className="rounded-full max-w-[20px] max-h-[20px]"
                            />
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {asset?.token?.symbol || ''}
                            </BodyText>
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
