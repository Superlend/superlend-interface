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
import { Config, useAccount, useReadContract } from 'wagmi'
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
import {
    TLendTx,
    TLendBorrowTxContext,
    useLendBorrowTxContext,
    TBorrowTx,
} from '@/context/lend-borrow-tx-provider'
import { PlatformValue } from '@/types/platform'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useAaveV3Data } from '../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { calculateHealthFactorFromBalancesBigUnits } from '@aave/math-utils'
import { valueToBigNumber } from '@aave/math-utils'
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
} from "@/components/ui/drawer"


export default function LendAndBorrowAssets() {
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [amount, setAmount] = useState('')
    const [maxBorrowAmount, setMaxBorrowAmount] = useState('0')
    const [isLoadingMaxBorrowingAmount, setIsLoadingMaxBorrowingAmount] =
        useState(false)
    const [borrowTokensDetails, setBorrowTokensDetails] = useState<
        TPlatformAsset[]
    >([])
    const [selectedBorrowTokenDetails, setSelectedBorrowTokenDetails] =
        useState<TPlatformAsset | null>(null)
    const [maxBorrowTokensAmount, setMaxBorrowTokensAmount] = useState<
        Record<
            string,
            {
                maxToBorrow: string
                maxToBorrowFormatted: string
                user: any
            }
        >
    >({})

    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const positionTypeParam: TPositionType =
        (searchParams.get('position_type') as TPositionType) || 'lend'
    const { address: walletAddress } = useAccount()
    const { switchChainAsync } = useSwitchChain()
    const {
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getAllowance,
        providerStatus,
    } = useAaveV3Data()
    const { lendTx, setLendTx, borrowTx, setBorrowTx } =
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

    // const customChain = defineChain(Number(chain_id))

    // Switch chain
    useEffect(() => {
        if (!!walletAddress) {
            switchChainAsync({ chainId: Number(chain_id) })
        }
    }, [walletAddress, Number(chain_id)])

    // Set position type, to select lend or borrow tab -
    // - when user navigates to this page with position type param
    useEffect(() => {
        setPositionType(positionTypeParam)
    }, [positionTypeParam])

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
            const _borrowableTokens = platformData.assets.filter(
                (a) => a.borrow_enabled
            )
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
                    const maxBorrowAmounts: Record<
                        string,
                        {
                            maxToBorrow: string
                            maxToBorrowFormatted: string
                            user: any
                        }
                    > = {}
                    setBorrowTokensDetails(_borrowableTokens)
                    for (const borrowToken of _borrowableTokens) {
                        const borrowTokenAddress =
                            borrowToken?.token?.address.toLowerCase()
                        maxBorrowAmounts[borrowTokenAddress] =
                            getMaxBorrowAmount(
                                borrowTokenAddress,
                                r as any
                            ) ?? {
                                maxToBorrow: '0',
                                maxToBorrowFormatted: '0',
                                user: {}
                            }
                    }

                    setMaxBorrowTokensAmount(maxBorrowAmounts)
                })
                .catch((error) => {
                    console.log('error fetching max borrow amount', error)
                    setMaxBorrowAmount('0')
                    setIsLoadingMaxBorrowingAmount(false)
                })
        }
    }, [
        walletAddress,
        Object.keys(platformData.platform).length,
        providerStatus.isReady,
        borrowTx.status,
        lendTx.status,
        lendTx.isConfirmed,
        borrowTx.isConfirmed,
    ])

    useEffect(() => {
        if (!Object.keys(maxBorrowTokensAmount).length) return

        const currentTokenDetails = selectedBorrowTokenDetails?.token
        const decimals = currentTokenDetails?.decimals ?? 0
        const maxAmountToBorrow = Math.abs(
            Number(
                maxBorrowTokensAmount[
                    currentTokenDetails?.address.toLowerCase() ?? ''
                ]?.maxToBorrowFormatted
            )
        )?.toFixed(decimals)
        const hasZeroLimit = !Math.abs(Number(maxAmountToBorrow))

        setMaxBorrowAmount(hasZeroLimit ? '0' : maxAmountToBorrow)
        setIsLoadingMaxBorrowingAmount(false)
    }, [selectedBorrowTokenDetails?.token?.address, maxBorrowTokensAmount])

    useEffect(() => {
        if (
            providerStatus.isReady &&
            !!walletAddress &&
            !!platformData.platform?.core_contract &&
            !!tokenAddress
        ) {
            // Set isConfirming to true when the status is 'approve' and isRefreshingAllowance is true
            if (lendTx.status === 'approve' && lendTx.isRefreshingAllowance) {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    isConfirming: true,
                }))
            }
            // Get allowance
            getAllowance(
                Number(chain_id),
                platformData.platform.core_contract,
                tokenAddress
            ).then((r: BigNumber) => {
                // Update allowanceBN and set isRefreshingAllowance to false
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    allowanceBN: r,
                    isRefreshingAllowance: false,
                }))
                // Check if the allowance is greater than or equal to the amount
                const positionTypeBasedAssetDetails = isLendPositionType(positionType) ? (assetDetails?.asset?.token?.decimals ?? 0) : (selectedBorrowTokenDetails?.token?.decimals ?? 0)
                const amountBN = parseUnits(Boolean(amount) ? amount : '0', positionTypeBasedAssetDetails);
                // Update the status of the lendTx based on the allowance and the confirmation state
                if (lendTx.status === 'approve' && lendTx.isConfirmed) {
                    setLendTx((prev: TLendTx) => ({
                        ...prev,
                        status: r.gte(amountBN) ? 'lend' : 'approve',
                        errorMessage: r.gte(amountBN) ? '' : 'Insufficient allowance',
                        isConfirming: false,
                    }))
                }
            })
        }
    }, [
        walletAddress,
        platformData,
        lendTx.status,
        lendTx.isRefreshingAllowance,
        providerStatus.isReady,
    ])

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (lendTx.status === 'view' && lendTx.isConfirmed) {
            setIsRefreshingErc20TokensBalanceData(true)
        }

        if (borrowTx.status === 'view' && borrowTx.isConfirmed) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [lendTx.status, borrowTx.status, lendTx.isConfirmed, borrowTx.isConfirmed])

    // Refresh balance when wallet address changes
    useEffect(() => {
        setIsRefreshingErc20TokensBalanceData(true)
    }, [walletAddress])

    // Set selected borrow token details
    useEffect(() => {
        setSelectedBorrowTokenDetails(borrowTokensDetails[0])
    }, [!!borrowTokensDetails.length])

    // Reset Amount
    useEffect(() => {
        setAmount('')
    }, [positionType, selectedBorrowTokenDetails?.token?.address])

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

    const getFormattedAssetDetails = (tokenAddress: string) => {
        if (!!selectedPlatformDetails && hasPosition) {
            return getAssetDetailsFromPortfolio(tokenAddress)
        }
        return getAssetDetails(tokenAddress)
    }

    function getAssetDetails(tokenAddress: string) {
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

    function formatSelectedBorrowTokenDetails(tokenAddress: string) {
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

    const assetDetails: any = getFormattedAssetDetails(tokenAddress)
    const assetDetailsForLendBorrowTx = getAssetDetails(tokenAddress)
    const selectedBorrowTokenDetailsFormatted =
        formatSelectedBorrowTokenDetails(
            selectedBorrowTokenDetails?.token?.address ?? ''
        )

    // Get balance
    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[tokenAddress.toLowerCase()]
            ?.balanceFormatted ?? 0
    ).toString()

    // Check if amount has too many decimals
    const toManyDecimals = useMemo(() => {
        if (assetDetails || selectedBorrowTokenDetails) {
            return checkDecimalPlaces(
                amount,
                isLendPositionType(positionType)
                    ? (assetDetails?.asset?.token?.decimals ?? 0)
                    : (selectedBorrowTokenDetails?.token?.decimals ?? 0)
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

    const getHealthFactorValues = (maxBorrowTokensAmount: any): {
        healthFactor: any,
        newHealthFactor: any
    } => {
        const borrowTokenDetails = maxBorrowTokensAmount?.[selectedBorrowTokenDetails?.token?.address ?? ''] ?? {}

        const { user } = borrowTokenDetails;

        if (user) {
            const amountToBorrowInUsd = valueToBigNumber(amount).multipliedBy(selectedBorrowTokenDetails?.token?.price_usd ?? 0)

            const newHealthFactor = calculateHealthFactorFromBalancesBigUnits({
                collateralBalanceMarketReferenceCurrency: user.totalCollateralUSD,
                borrowBalanceMarketReferenceCurrency: valueToBigNumber(user.totalBorrowsUSD).plus(
                    amountToBorrowInUsd
                ),
                currentLiquidationThreshold: user.currentLiquidationThreshold ?? 0,
            });

            const healthFactor = calculateHealthFactorFromBalancesBigUnits({
                collateralBalanceMarketReferenceCurrency: user.totalCollateralUSD,
                borrowBalanceMarketReferenceCurrency: valueToBigNumber(user.totalBorrowsUSD),
                currentLiquidationThreshold: user.currentLiquidationThreshold ?? 0,
            })

            return {
                healthFactor,
                newHealthFactor
            }
        }

        return {
            healthFactor: 0,
            newHealthFactor: 0
        }
    }

    const healthFactorValues = getHealthFactorValues(maxBorrowTokensAmount);

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
            return 'You do not have sufficient collateral to borrow'
        }
        if (!canBorrow || Number(amount) > Number(maxBorrowAmount ?? 0)) {
            return 'Amount exceeds available borrow limit'
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

    const isDisabledMaxBtn = () => {
        if (isLendPositionType(positionType)) {
            return (Number(amount) === Number(balance)) ||
                !walletAddress ||
                isLoadingErc20TokensBalanceData ||
                (Number(balance) <= 0)
        }

        return (Number(amount) === Number(maxBorrowAmount)) ||
            !walletAddress ||
            isLoadingMaxBorrowingAmount ||
            isLoadingErc20TokensBalanceData ||
            (Number(maxBorrowAmount) <= 0)
    }

    const isAaveV3Protocol = platformData?.platform?.protocol_type === 'aaveV3'
    const isPolygonChain = Number(chain_id) === 137

    const isLoadingHelperText = isLendPositionType(positionType) ? isLoadingErc20TokensBalanceData : isLoadingMaxBorrowingAmount;

    function getLoadingHelperText() {
        return isLendPositionType(positionType) ?
            'Loading balance...'
            : 'Loading borrow limit...'
    }

    function getMaxDecimalsToDisplay(): number {
        return isLendPositionType(positionType) ?
            (assetDetails?.asset?.token?.symbol.toLowerCase().includes('btc') || assetDetails?.asset?.token?.symbol.toLowerCase().includes('eth')) ? 4 : 2
            : (selectedBorrowTokenDetails?.token?.symbol.toLowerCase().includes('btc') || selectedBorrowTokenDetails?.token?.symbol.toLowerCase().includes('eth')) ? 4 : 2
    }

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
                            : `borrow ${selectedBorrowTokenDetails?.token?.symbol || ''}`}
                    </BodyText>
                    {walletAddress && isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal:{' '}
                            {isLoadingErc20TokensBalanceData ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(balance ?? 0),
                                            getMaxDecimalsToDisplay()
                                        )
                                    ),
                                    getMaxDecimalsToDisplay()
                                )
                            )}
                            <span className="inline-block truncate max-w-[70px]">
                                {
                                    isLendPositionType(positionType) ?
                                        assetDetails?.asset?.token?.symbol
                                        : selectedBorrowTokenDetails?.token?.symbol
                                }
                            </span>
                        </BodyText>
                    )}
                    {walletAddress && !isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit:{' '}
                            {isLoadingMaxBorrowingAmount ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                handleSmallestValue(maxBorrowAmount, getMaxDecimalsToDisplay())
                            )}
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div className={cn(isLendPositionType(positionType) ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]' : 'border-t rounded-t-5', "border-gray-200 py-[12px] px-[16px] flex items-center gap-[12px]")}>
                        {isLoading && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {/* Lend position type - Selected token image */}
                        {!isLoading && isLendPositionType(positionType) && (
                            <ImageWithDefault
                                src={assetDetails?.asset?.token?.logo || ''}
                                alt={assetDetails?.asset?.token?.symbol || ''}
                                className="shrink-0 w-[24px] h-[24px] rounded-full"
                                width={24}
                                height={24}
                            />
                        )}
                        {/* Borrow position type - Select token dropdown */}
                        {(isLoading ||
                            !selectedBorrowTokenDetails?.token?.address) &&
                            !isLendPositionType(positionType) && (
                                <LoaderCircle className="text-primary w-[60px] h-[34px] animate-spin" />
                            )}
                        {!isLoading &&
                            !!selectedBorrowTokenDetails?.token?.address &&
                            !isLendPositionType(positionType) && (
                                <SelectTokensDropdown
                                    key={positionType}
                                    options={borrowTokensDetails}
                                    selectedItemDetails={
                                        selectedBorrowTokenDetails
                                    }
                                    setSelectedItemDetails={
                                        setSelectedBorrowTokenDetails
                                    }
                                />
                            )}
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
                            disabled={isDisabledMaxBtn()}
                        >
                            max
                        </Button>
                    </div>
                    {/* Net APY - ONLY FOR BORROW TAB */}
                    {(!isLendPositionType(positionType) && walletAddress) &&
                        <div className="flex items-center justify-between w-full py-[12px] px-[24px] rounded-b-5 bg-white border-y border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Net APY
                            </BodyText>
                            {isLoadingMaxBorrowingAmount && <Skeleton className="w-[50px] h-[20px]" />}
                            {!isLoadingMaxBorrowingAmount && <Badge variant="green">
                                {abbreviateNumber(
                                    isLendPositionType(positionType)
                                        ? Number(
                                            assetDetails?.asset?.apy ?? 0
                                        )
                                        : Number(
                                            selectedBorrowTokenDetails?.variable_borrow_apy ?? 0
                                        )
                                )}
                                %
                            </Badge>}
                        </div>}
                    {walletAddress && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="mx-auto w-full text-gray-500 py-[16px] text-center max-w-[250px]"
                        >
                            {
                                isLoadingHelperText && getLoadingHelperText()
                            }
                            {(!errorMessage && !isLoadingHelperText) &&
                                (isLendPositionType(positionType)
                                    ? 'Enter amount to proceed with supplying collateral for this position'
                                    : 'Enter the amount you want to borrow from this position')}
                            {(errorMessage && !isLoadingHelperText) && (
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
                        <div className="flex flex-col gap-[12px] w-full">
                            <ConfirmationDialog
                                disabled={disabledButton}
                                positionType={positionType}
                                assetDetails={
                                    isLendPositionType(positionType)
                                        ? assetDetailsForLendBorrowTx
                                        : selectedBorrowTokenDetailsFormatted
                                }
                                amount={amount}
                                balance={balance}
                                maxBorrowAmount={maxBorrowAmount}
                                setAmount={setAmount}
                                healthFactorValues={healthFactorValues}
                            />
                        </div>
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
    options: TPlatformAsset[]
    selectedItemDetails: TPlatformAsset | null
    setSelectedItemDetails: (token: TPlatformAsset) => void
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
                <ScrollArea className="h-[200px]">
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
                </ScrollArea>
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
    healthFactorValues,
}: {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    maxBorrowAmount: string
    setAmount: (amount: string) => void
    healthFactorValues: {
        healthFactor: any,
        newHealthFactor: any
    }
}) {
    const { lendTx, setLendTx, borrowTx, setBorrowTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext
    const [open, setOpen] = useState(false)
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const { switchChainAsync } = useSwitchChain()
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || 1
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetLendBorrowTx()
        }
    }, [])

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        if (open) {
            // Switch chain when the dialog is opened
            switchChainAsync({ chainId: Number(chain_id) })
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

    const isLendTxInProgress = lendTx.isPending || lendTx.isConfirming
    const isBorrowTxInProgress = borrowTx.isPending || borrowTx.isConfirming

    const isTxInProgress = isLendTxInProgress || isBorrowTxInProgress

    const lendTxSpinnerColor = lendTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const borrowTxSpinnerColor = borrowTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const txSpinnerColor = isLendPositionType(positionType)
        ? lendTxSpinnerColor
        : borrowTxSpinnerColor

    const canDisplayExplorerLinkWhileLoading = isLendPositionType(positionType)
        ? (lendTx.hash.length > 0) && (lendTx.isConfirming || lendTx.isPending)
        : (borrowTx.hash.length > 0) && (borrowTx.isConfirming || borrowTx.isPending)

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
        return (Number(healthFactorValues.newHealthFactor.toString())) < Number(1.5)
    }

    const disableActionButton = disabled || (!hasAcknowledgedRisk && !isLendPositionType(positionType) && isHfLow())

    // SUB_COMPONENT: Trigger button to open the dialog
    const triggerButton = (
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
                    txStatus: isLendPositionType(positionType)
                        ? lendTx
                        : borrowTx,
                    positionType,
                })}
            </BodyText>
            {canDisplayExplorerLinkWhileLoading &&
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
            }
        </div>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                lend: lendTx.status === 'approve' && !isLendTxInProgress,
                borrow:
                    borrowTx.status === 'borrow' && !isBorrowTxInProgress,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        {isLendPositionType(positionType)
                            ? 'Lend collateral'
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
                    (borrowTx.status === 'view' && !isBorrowTxInProgress),
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
                                        ? 'Lend'
                                        : 'Borrow'}{' '}
                                    Successful
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                        {isShowBlock({
                            lend:
                                lendTx.status === 'lend' &&
                                !isLendTxInProgress,
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
                            className={`flex items-center ${isLendPositionType(positionType) ? 'justify-end' : 'justify-between'} px-[24px] mb-[4px] gap-1`}>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Bal:
                            </BodyText>
                            <BodyText level="body2" weight="normal" className="text-gray-600">
                                {handleSmallestValue((Number(balance) - Number(amount)).toString())}
                                {" "}
                                {assetDetails?.asset?.token?.symbol}
                            </BodyText>
                        </div>
                    )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-[24px] bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        lend: !isLendTxInProgress,
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
                                        isLendPositionType(positionType)
                                            ? Number(
                                                ((assetDetails?.asset?.apy || assetDetails?.asset?.supply_apy || assetDetails?.supply_apy || assetDetails?.apy) ?? 0)
                                            )
                                            : Number(
                                                ((assetDetails?.asset?.variable_borrow_apy || assetDetails?.variable_borrow_apy) ?? 0)
                                            )
                                    )}
                                    %
                                </Badge>
                            </div>
                        )}
                    {isShowBlock({
                        lend: false,
                        borrow: (borrowTx.status === 'borrow' && !isBorrowTxInProgress),
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
                                        {
                                            abbreviateNumber(
                                                (isLendPositionType(positionType)
                                                    ? (Number(balance) -
                                                        Number(amount))
                                                    : (Number(maxBorrowAmount)) -
                                                    Number(amount))
                                            )
                                        }
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
                    {
                        isShowBlock({
                            lend: false,
                            borrow: (borrowTx.status === 'borrow' && !isBorrowTxInProgress),
                        }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    Health factor
                                </BodyText>
                                <div className="flex flex-col items-end justify-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <BodyText level="body2" weight="normal" className={`text-gray-800`}>
                                            {(healthFactorValues.healthFactor).toFixed(2)}
                                        </BodyText>
                                        <ArrowRightIcon width={16} height={16} className="stroke-gray-800" strokeWidth={2.5} />
                                        <BodyText level="body2" weight="normal" className={getNewHfColor()}>
                                            {(healthFactorValues.newHealthFactor).toFixed(2)}
                                        </BodyText>
                                    </div>
                                    <Label size="small" className="text-gray-600">
                                        Liquidation at &lt;1.0
                                    </Label>
                                </div>
                            </div>
                        )
                    }
                    {isShowBlock({
                        lend: (lendTx.status === 'lend' || lendTx.status === 'view') && (lendTx.hash.length > 0) && !isLendTxInProgress,
                        borrow: borrowTx.status === 'view' && (borrowTx.hash.length > 0) && !isBorrowTxInProgress,
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
                {
                    isShowBlock({
                        lend: false,
                        borrow: (borrowTx.status === 'borrow' && !isBorrowTxInProgress && isHfLow()),
                    }) && (
                        <div className="flex flex-col items-center justify-center">
                            <CustomAlert
                                description="Borrowing this amount is not advisable, as the heath factor is close to 1, posing a risk of liquidation."
                            />
                            <div className="flex items-center gap-2 w-fit my-5" onClick={() => setHasAcknowledgedRisk(!hasAcknowledgedRisk)}>
                                <Checkbox id="terms" checked={hasAcknowledgedRisk} />
                                <Label size="medium" className="text-gray-800" id="terms">
                                    I acknowledge the risks involved.
                                </Label>
                            </div>
                        </div>
                    )
                }
                {/* Block 4 */}
                <div className={`${isTxInProgress ? 'invisible h-0' : ''}`}>
                    <ActionButton
                        disabled={disableActionButton}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        positionType={positionType}
                    />
                </div>
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                <DialogTrigger asChild>
                    {triggerButton}
                </DialogTrigger>
                <DialogContent aria-describedby={undefined} className="pt-[25px]">
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {txInProgressLoadingState}
                    {/* Initial Confirmation UI */}
                    <DialogHeader>
                        {contentHeader}
                    </DialogHeader>

                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} dismissible={false}>
            <DrawerTrigger asChild>
                {triggerButton}
            </DrawerTrigger>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {/* X Icon to close the drawer */}
                {closeContentButton}
                {/* Tx in progress - Loading state UI */}
                {txInProgressLoadingState}
                <DrawerHeader>
                    {contentHeader}
                </DrawerHeader>
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

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}

function getExplorerLink(hash: string, platform_name: PlatformValue) {
    return `${TX_EXPLORER_LINKS[platform_name]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    positionType,
}: {
    amount: string
    tokenName: string
    txStatus: TLendTx | TBorrowTx
    positionType: TPositionType
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve spending ${formattedText} from your wallet`,
            lend: `Approve transaction for lending ${formattedText} from your wallet`,
            borrow: `Approve transaction for borrowing ${formattedText} from your wallet`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            lend: `Confirming transaction for lending ${formattedText} from your wallet`,
            borrow: `Confirming transaction for borrowing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${isLendPositionType(positionType) ? 'lending' : 'borrowing'} ${formattedText} from your wallet`,
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
