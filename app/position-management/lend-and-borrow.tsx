'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPositionType } from '@/types'
import { TPlatformAsset } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheck,
    CircleCheckIcon,
    X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import {
    useIsAutoConnecting,
    useActiveAccount,
    useSwitchActiveWalletChain,
} from 'thirdweb/react'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    decimalPlacesCount,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText } from '@/components/ui/typography'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import AAVE_POOL_ABI from '@/data/abi/aaveApproveABI.json'
import { useReadContract } from 'wagmi'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import {
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
    TX_EXPLORER_LINKS,
} from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import { defineChain } from 'thirdweb'
import {
    TLendBorrowTx,
    TLendBorrowTxContext,
    useLendBorrowTxContext,
} from '@/context/lend-borrow-tx-provider'
import { PlatformValue } from '@/types/platform'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useAaveV3Data } from '../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'

export default function LendAndBorrowAssets() {
    const { erc20TokensBalanceData, isLoading: isLoadingUserTokenBalances } =
        useUserTokenBalancesContext()
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [amount, setAmount] = useState('')
    const [maxBorrowAmount, setMaxBorrowAmount] = useState('0')
    const [isLoadingMaxBorrowingAmount, setIsLoadingMaxBorrowingAmount] =
        useState(false)
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address
    const isAutoConnecting = useIsAutoConnecting()
    const switchChain = useSwitchActiveWalletChain()
    const {
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getAllowance,
        providerStatus,
    } = useAaveV3Data()
    const { lendTx, setLendTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData,
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const isLoading = isLoadingPortfolioData || isLoadingPlatformData

    const customChain = defineChain(Number(chain_id))

    // Switch chain
    useEffect(() => {
        if (!!walletAddress) {
            switchChain(customChain)
        }
    }, [walletAddress, isAutoConnecting, customChain])

    // Get max borrow amount
    useEffect(() => {
        setIsLoadingMaxBorrowingAmount(true)
        if (
            walletAddress &&
            walletAddress.length > 0 &&
            platformData.assets.length > 0 &&
            platformData.platform.protocol_type === 'aaveV3' &&
            providerStatus.isReady
        ) {
            fetchAaveV3Data(
                Number(chain_id),
                platformData.platform.uiPoolDataProvider!,
                platformData.platform.poolAddressesProvider!
            )
                .then((r) => {
                    if (!r || !r[0]) {
                        // Add null check
                        setMaxBorrowAmount('0')
                        setIsLoadingMaxBorrowingAmount(false)
                        return
                    }

                    const maxBorrowAmount = getMaxBorrowAmount(
                        tokenAddress.toLowerCase(),
                        r as any
                    ) ?? {
                        maxToBorrow: '0',
                        maxToBorrowFormatted: '0',
                    }
                    const decimals = assetDetails?.asset?.token?.decimals ?? 0
                    const maxAmountToBorrow = Math.abs(
                        Number(maxBorrowAmount?.maxToBorrowFormatted)
                    )?.toFixed(decimals)
                    const hasZeroLimit = !Math.abs(Number(maxAmountToBorrow))
                    setMaxBorrowAmount(hasZeroLimit ? '0' : maxAmountToBorrow)
                    setIsLoadingMaxBorrowingAmount(false)
                })
                .catch((error) => {
                    console.log('error fetching max borrow amount', error)
                    setMaxBorrowAmount('0')
                    setIsLoadingMaxBorrowingAmount(false)
                })
        }
    }, [walletAddress, platformData, providerStatus.isReady])

    useEffect(() => {
        if (
            providerStatus.isReady &&
            walletAddress &&
            platformData.platform?.core_contract &&
            tokenAddress
        ) {
            getAllowance(
                Number(chain_id),
                platformData.platform.core_contract,
                tokenAddress
            ).then((r: BigNumber) => {
                setLendTx((prev: TLendBorrowTx) => ({
                    ...prev,
                    allowanceBN: r,
                    isRefreshingAllowance: false,
                }))
                // console.log("allowanceBN - lend/borrow", r.toString())
            })
        }
    }, [
        walletAddress,
        platformData,
        lendTx.status,
        amount,
        lendTx.isRefreshingAllowance,
        providerStatus.isReady,
    ])

    // Filter user positions
    const [selectedPlatformDetails] = portfolioData?.platforms.filter(
        (platform) =>
            platform?.protocol_identifier?.toLowerCase() ===
            (platformData?.platform as any)?.protocol_identifier?.toLowerCase()
    )
    const hasPosition = !!selectedPlatformDetails?.positions?.find(
        (position) =>
            position?.token?.address.toLowerCase() ===
            tokenAddress.toLowerCase()
    )

    const getAssetDetailsFromPortfolio = (tokenAddress: string) => {
        return {
            ...selectedPlatformDetails,
            core_contract: platformData?.platform?.core_contract,
            positions: null,
            asset: {
                ...selectedPlatformDetails?.positions?.find(
                    (position) =>
                        position?.token?.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ),
            },
        }
    }

    const getAssetDetails = (tokenAddress: string) => {
        if (!!selectedPlatformDetails && hasPosition) {
            return getAssetDetailsFromPortfolio(tokenAddress)
        }
        return {
            asset: {
                ...platformData?.assets?.find(
                    (platform: TPlatformAsset) =>
                        platform?.token?.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ),
                amount: null,
            },
            ...platformData?.platform,
        }
    }

    const assetDetails = getAssetDetails(tokenAddress)

    // Get balance
    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[tokenAddress.toLowerCase()]
            ?.balanceFormatted ?? 0
    ).toString()

    // Check if amount has too many decimals
    const toManyDecimals = useMemo(() => {
        if (assetDetails) {
            return checkDecimalPlaces(
                amount,
                assetDetails?.asset?.token?.decimals ?? 0
            )
        }
        return false
    }, [assetDetails, amount])

    // Get user account data
    const userAccountData = useReadContract({
        address: platformData?.platform?.core_contract as `0x${string}`,
        abi: AAVE_POOL_ABI,
        functionName: 'getUserAccountData',
        args: [walletAddress as `0x${string}`],
    })

    // Add this to parse the user account data
    const parsedUserData = useMemo(() => {
        if (!userAccountData.data) return null

        const [
            totalCollateralETH,
            totalDebtETH,
            availableBorrowsETH,
            currentLiquidationThreshold,
            ltv,
            healthFactor,
        ] = userAccountData.data as any

        return {
            totalCollateralETH: formatUnits(totalCollateralETH, 18),
            totalDebtETH: formatUnits(totalDebtETH, 18),
            availableBorrowsETH: formatUnits(availableBorrowsETH, 18),
            currentLiquidationThreshold:
                Number(currentLiquidationThreshold) / 10000, // Convert basis points to percentage
            ltv: Number(ltv) / 10000, // Convert basis points to percentage
            healthFactor: formatUnits(healthFactor, 18),
        }
    }, [userAccountData.data])

    const isPoolBasedProtocol = POOL_BASED_PROTOCOLS.includes(
        platformData?.platform?.protocol_type
    )

    // You can check if user has collateral like this
    const hasCollateral = useMemo(() => {
        return parsedUserData && Number(parsedUserData.totalCollateralETH) > 0
    }, [parsedUserData])

    // And check if user can borrow
    const canBorrow = useMemo(() => {
        return parsedUserData && Number(parsedUserData.availableBorrowsETH) > 0
    }, [parsedUserData])

    const lendErrorMessage = useMemo(() => {
        if (Number(amount) > Number(balance) || Number(balance) <= 0) {
            return 'You do not have enough balance'
        } else if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        } else {
            return null
        }
    }, [amount, balance, toManyDecimals])

    const borrowErrorMessage = useMemo(() => {
        if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        }
        if (!hasCollateral) {
            return 'You do not have any collateral'
        }
        if (!canBorrow || Number(amount) > Number(maxBorrowAmount ?? 0)) {
            return 'You do not have any borrow limit'
        }
        return null
    }, [hasCollateral, canBorrow, amount, balance, toManyDecimals])

    const errorMessage = useMemo(() => {
        return isLendPositionType(positionType)
            ? lendErrorMessage
            : borrowErrorMessage
    }, [positionType, lendErrorMessage, borrowErrorMessage])

    const disabledButton: boolean = useMemo(
        () =>
            Number(amount) >
                Number(
                    isLendPositionType(positionType) ? balance : maxBorrowAmount
                ) ||
            (isLendPositionType(positionType) ? false : !hasCollateral) ||
            Number(amount) <= 0 ||
            toManyDecimals,
        [
            amount,
            balance,
            maxBorrowAmount,
            toManyDecimals,
            hasCollateral,
            positionType,
        ]
    )

    const isDisabledMaxBtn =
        Number(amount) ===
            (isLendPositionType(positionType)
                ? Number(balance)
                : Number(maxBorrowAmount)) || !walletAddress

    const isAaveV3Protocol = platformData?.platform?.protocol_type === 'aaveV3'
    const isPolygonChain = Number(chain_id) === 137

    // Loading skeleton
    if (isLoading && isAaveV3Protocol && isPolygonChain) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    // Check if platform is aaveV3 or compoundV2, else return null
    if (!(isAaveV3Protocol && isPolygonChain)) {
        return null
    }

    // Render component
    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <LendBorrowToggle
                type={positionType}
                handleToggle={(positionType: TPositionType) =>
                    setPositionType(positionType)
                }
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {isLendPositionType(positionType)
                            ? 'lend collateral'
                            : `borrow ${assetDetails?.asset?.token?.symbol}`}
                    </BodyText>
                    {walletAddress && isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal.{' '}
                            {isLoadingUserTokenBalances ? (
                                <Skeleton className="w-[40px] h-[16px] rounded-2" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(balance ?? 0)
                                        )
                                    ),
                                    2
                                )
                            )}{' '}
                            <span className="inline-block truncate max-w-[70px]">
                                {assetDetails?.asset?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                    {walletAddress && !isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit -{' '}
                            {isLoadingMaxBorrowingAmount ? (
                                <Skeleton className="w-[40px] h-[16px] rounded-2" />
                            ) : (
                                maxBorrowAmount
                            )}
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div className="rounded-5 border border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)] py-[12px] px-[16px] flex items-center gap-[12px]">
                        {isLoading && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {!isLoading && (
                            <ImageWithDefault
                                src={assetDetails?.asset?.token?.logo || ''}
                                alt={assetDetails?.asset?.token?.symbol || ''}
                                className="shrink-0 w-[24px] h-[24px] rounded-full"
                                width={24}
                                height={24}
                            />
                        )}
                        {/* {
                            !isLoading && hasMultipleTokens && (
                                <SelectTokensDropdown
                                    key={positionType}
                                    options={isLendPositionType(positionType) ? lendPositions : borrowPositions}
                                    selectedItemDetails={selectedTokenDetails}
                                    setSelectedItemDetails={(token) => setSelectedTokenDetails(token)}
                                />
                            )
                        } */}
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-500"
                        >
                            |
                        </BodyText>
                        <div className="flex flex-col gap-[4px]">
                            <CustomNumberInput
                                key={positionType}
                                amount={amount}
                                setAmount={(amount) => setAmount(amount)}
                            />
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium ml-auto"
                            onClick={() =>
                                setAmount(
                                    isLendPositionType(positionType)
                                        ? (balance ?? '0')
                                        : (maxBorrowAmount ?? '0')
                                )
                            }
                            disabled={isDisabledMaxBtn}
                        >
                            max
                        </Button>
                    </div>
                    {walletAddress && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="mx-auto w-full text-gray-500 py-[16px] text-center max-w-[250px]"
                        >
                            {!errorMessage &&
                                (isLendPositionType(positionType)
                                    ? 'Enter amount to proceed lending collateral for this position'
                                    : 'Enter the amount you want to borrow from this position')}
                            {errorMessage && (
                                <span className="text-xs text-destructive-foreground">
                                    {errorMessage}
                                </span>
                            )}
                        </BodyText>
                    )}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!walletAddress && <ConnectWalletButton />}
                    {walletAddress && (
                        <ConfirmationDialog
                            disabled={disabledButton}
                            positionType={positionType}
                            assetDetails={assetDetails}
                            amount={amount}
                            balance={balance}
                            maxBorrowAmount={maxBorrowAmount}
                            setAmount={setAmount}
                        />
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

// Child components
function SelectTokensDropdown({
    options,
    selectedItemDetails,
    setSelectedItemDetails,
}: {
    options: any[]
    selectedItemDetails: any
    setSelectedItemDetails: (token: any) => void
}) {
    useEffect(() => {
        setSelectedItemDetails(options[0])
    }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="md"
                    variant="ghost"
                    className="group flex items-center gap-1 text-gray-800"
                >
                    <ImageWithDefault
                        src={selectedItemDetails?.token?.logo}
                        alt={selectedItemDetails?.token?.symbol}
                        width={24}
                        height={24}
                        className="rounded-full max-w-[24px] max-h-[24px]"
                    />
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                {options?.map((asset: any) => (
                    <DropdownMenuItem
                        key={asset?.token?.address}
                        onClick={() => setSelectedItemDetails(asset)}
                        className={cn(
                            'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                            selectedItemDetails?.token?.address ===
                                asset?.token?.address && 'bg-gray-400'
                        )}
                    >
                        <ImageWithDefault
                            src={asset?.token?.logo || ''}
                            alt={asset?.token?.symbol || ''}
                            width={24}
                            height={24}
                            className="rounded-full max-w-[24px] max-h-[24px]"
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
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ConfirmationDialog({
    disabled,
    positionType,
    assetDetails,
    amount,
    setAmount,
    balance,
    maxBorrowAmount,
}: {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    maxBorrowAmount: string
    setAmount: (amount: string) => void
}) {
    const { lendTx, setLendTx, borrowTx, setBorrowTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext
    const [open, setOpen] = useState(false)

    function resetLendBorrowTx() {
        setLendTx((prev: TLendBorrowTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            allowanceBN: BigNumber.from(0),
            isRefreshingAllowance: false,
            errorMessage: '',
        }))
        setBorrowTx((prev: TLendBorrowTx) => ({
            ...prev,
            status: 'borrow',
            hash: '',
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        setLendTx((prev: TLendBorrowTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
        }))
        // When closing the dialog, reset the amount and the tx status
        if (!open) {
            setAmount('')
            resetLendBorrowTx()
        }
    }

    function isShowBlock(status: { lend: boolean; borrow: boolean }) {
        return isLendPositionType(positionType) ? status.lend : status.borrow
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

    function handleSmallestValue(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        return `${hasLowestDisplayValuePrefix(Number(amountFormatted))} ${getLowestDisplayValue(Number(amountFormatted))}`
    }

    return (
        <Dialog open={open}>
            <DialogTrigger asChild>
                <Button
                    onClick={() => handleOpenChange(true)}
                    disabled={disabled}
                    variant="primary"
                    className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
                >
                    <span className="uppercase leading-[0]">
                        {isLendPositionType(positionType)
                            ? 'Lend collateral'
                            : 'Review & Borrow'}
                    </span>
                    <ArrowRightIcon
                        width={16}
                        height={16}
                        className="stroke-white group-[:disabled]:opacity-50"
                    />
                </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="pt-[25px]">
                <Button
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    className="h-6 w-6 flex items-center justify-center absolute right-4 top-5 rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
                >
                    <X strokeWidth={2.5} className="h-4 w-4 text-black" />
                    <span className="sr-only">Close</span>
                </Button>
                {/* Initial Confirmation*/}
                <DialogHeader>
                    {isShowBlock({
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        // <DialogTitle asChild>
                        <HeadingText
                            level="h4"
                            weight="medium"
                            className="text-gray-800 text-center"
                        >
                            {isLendPositionType(positionType)
                                ? 'Lend collateral'
                                : `Borrow ${assetDetails?.asset?.token?.symbol}`}
                        </HeadingText>
                        // </DialogTitle>
                    )}
                    {/* Confirmation details / Final Tx View */}
                    {isShowBlock({
                        lend:
                            lendTx.status === 'lend' ||
                            lendTx.status === 'view',
                        borrow: borrowTx.status === 'view',
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
                                    variant="green"
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isLendPositionType(positionType) &&
                                    lendTx.status === 'view'
                                        ? 'Lent'
                                        : 'Borrowed'}{' '}
                                    Successfully
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                            {isShowBlock({
                                lend: lendTx.status === 'lend',
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
                </DialogHeader>

                <div className="flex flex-col gap-[12px]">
                    {/* Block 1 */}
                    {isShowBlock({
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        <div className="flex items-center gap-[8px] px-[24px] py-[18.5px] bg-white rounded-5 w-full">
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
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        <div className="flex items-center justify-between px-[24px] mb-[4px]">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isLendPositionType(positionType)
                                    ? 'Bal.'
                                    : 'Remaining limit'}
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {handleSmallestValue(
                                    (isLendPositionType(positionType)
                                        ? balance
                                        : Number(maxBorrowAmount) -
                                          Number(amount)
                                    ).toString()
                                )}
                            </BodyText>
                        </div>
                    )}
                    {/* Block 3 */}
                    <div className="flex flex-col items-center justify-between px-[24px] bg-white rounded-5 divide-y divide-gray-300">
                        <div className="flex items-center justify-between w-full py-[16px]">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isLendPositionType(positionType)
                                    ? 'Lend'
                                    : 'Net'}{' '}
                                APY
                            </BodyText>
                            <Badge variant="green">
                                {abbreviateNumber(
                                    Number(assetDetails?.asset?.apy ?? 0)
                                )}
                                %
                            </Badge>
                        </div>
                        {!isLendPositionType(positionType) && (
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
                                        {abbreviateNumber(
                                            (isLendPositionType(positionType)
                                                ? Number(balance)
                                                : Number(maxBorrowAmount)) -
                                                Number(amount)
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
                            lend: lendTx.status === 'view',
                            borrow: borrowTx.status === 'view',
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
                                                isLendPositionType(positionType)
                                                    ? lendTx.hash
                                                    : borrowTx.hash,
                                                assetDetails?.platform_name
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isLendPositionType(positionType)
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
                    {/* Block 4 */}
                    <ActionButton
                        disabled={disabled}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        positionType={positionType}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}

function getExplorerLink(hash: string, platform_name: PlatformValue) {
    return `${TX_EXPLORER_LINKS[platform_name]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}
