'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { TPlatform, TPositionType } from '@/types'
import { PlatformType, TPlatformAsset } from '@/types/platform'
import { LoaderCircle, X } from 'lucide-react'
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
import { useReadContract } from 'wagmi'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    CHAIN_ID_MAPPER,
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
    TX_EXPLORER_LINKS,
} from '@/constants'
import {
    TLendTx,
    TTxContext,
    useTxContext,
    TBorrowTx,
} from '@/context/tx-provider'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useAaveV3Data } from '../../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { calculateHealthFactorFromBalancesBigUnits } from '@aave/math-utils'
import { valueToBigNumber } from '@aave/math-utils'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TPortfolio } from '@/types/queries/portfolio'
import {
    ConfirmationDialog,
    getMaxDecimalsToDisplay,
    handleSmallestValue,
} from '@/components/dialogs/TxDialog'

interface LendAndBorrowAssetsProps {
    isLoading: boolean
    platformData: TPlatform
    portfolioData: TPortfolio
}

export default function AaveV3TxWidget({
    isLoading,
    platformData,
    portfolioData,
}: LendAndBorrowAssetsProps) {
    const { logEvent } = useAnalytics()
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
    const { walletAddress, handleSwitchChain, isWalletConnected } =
        useWalletConnection()
    const {
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getAllowance,
        providerStatus,
    } = useAaveV3Data()
    const {
        lendTx,
        setLendTx,
        borrowTx,
        withdrawTx,
        repayTx,
        isLendBorrowTxDialogOpen,
        setIsLendBorrowTxDialogOpen,
    } = useTxContext() as TTxContext

    // Switch chain
    useEffect(() => {
        if (!!walletAddress) {
            handleSwitchChain(Number(chain_id))
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
            // walletAddress.length > 0 &&
            isWalletConnected &&
            platformData.assets.length > 0 &&
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
                                chain_id as number,
                                r as any
                            ) ?? {
                                maxToBorrow: '0',
                                maxToBorrowFormatted: '0',
                                user: {},
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
        isWalletConnected,
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
            isWalletConnected &&
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
                const positionTypeBasedAssetDetails = isLendPositionType(
                    positionType
                )
                    ? (assetDetails?.asset?.token?.decimals ?? 0)
                    : (selectedBorrowTokenDetails?.token?.decimals ?? 0)
                const amountBN = parseUnits(
                    Boolean(amount) ? amount : '0',
                    positionTypeBasedAssetDetails
                )
                // Update the status of the lendTx based on the allowance and the confirmation state
                if (lendTx.status === 'approve' && lendTx.isConfirmed) {
                    setLendTx((prev: TLendTx) => {
                        logEvent('approve_completed', {
                            amount,
                            token_symbol: assetDetails?.asset?.token?.symbol,
                            platform_name:
                                assetDetails?.name ||
                                platformData?.platform?.name,
                            chain_name:
                                CHAIN_ID_MAPPER[
                                    assetDetails?.chain_id as ChainId
                                ],
                            wallet_address: walletAddress,
                            error_message: r.gte(amountBN)
                                ? ''
                                : 'Insufficient allowance',
                            status: r.gte(amountBN) ? 'lend' : 'approve',
                        })

                        return {
                            ...prev,
                            status: r.gte(amountBN) ? 'lend' : 'approve',
                            errorMessage: r.gte(amountBN)
                                ? ''
                                : 'Insufficient allowance',
                            isConfirming: false,
                            isConfirmed: false,
                        }
                    })
                }
            })
        }
    }, [
        walletAddress,
        isWalletConnected,
        platformData,
        lendTx.status,
        lendTx.isRefreshingAllowance,
        providerStatus.isReady,
    ])

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (
            (lendTx.status === 'view' ||
                borrowTx.status === 'view' ||
                withdrawTx.status === 'view' ||
                repayTx.status === 'view') &&
            !isLendBorrowTxDialogOpen
        ) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [lendTx.status, borrowTx.status, withdrawTx.status, repayTx.status])

    // Set selected borrow token details
    useEffect(() => {
        setSelectedBorrowTokenDetails(borrowTokensDetails[0])
    }, [!!borrowTokensDetails.length])

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

    const getHealthFactorValues = (
        maxBorrowTokensAmount: any
    ): {
        healthFactor: any
        newHealthFactor: any
    } => {
        const borrowTokenDetails =
            maxBorrowTokensAmount?.[
                selectedBorrowTokenDetails?.token?.address ?? ''
            ] ?? {}

        const { user } = borrowTokenDetails

        if (user) {
            const amountToBorrowInUsd = valueToBigNumber(amount).multipliedBy(
                selectedBorrowTokenDetails?.token?.price_usd ?? 0
            )

            const newHealthFactor = calculateHealthFactorFromBalancesBigUnits({
                collateralBalanceMarketReferenceCurrency:
                    user.totalCollateralUSD,
                borrowBalanceMarketReferenceCurrency: valueToBigNumber(
                    user.totalBorrowsUSD
                ).plus(amountToBorrowInUsd),
                currentLiquidationThreshold:
                    user.currentLiquidationThreshold ?? 0,
            })

            const healthFactor = calculateHealthFactorFromBalancesBigUnits({
                collateralBalanceMarketReferenceCurrency:
                    user.totalCollateralUSD,
                borrowBalanceMarketReferenceCurrency: valueToBigNumber(
                    user.totalBorrowsUSD
                ),
                currentLiquidationThreshold:
                    user.currentLiquidationThreshold ?? 0,
            })

            return {
                healthFactor,
                newHealthFactor,
            }
        }

        return {
            healthFactor: 0,
            newHealthFactor: 0,
        }
    }

    const healthFactorValues = getHealthFactorValues(maxBorrowTokensAmount)

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
            return 'Amount exceeds borrow limit'
        }
        return null
    }, [hasCollateral, canBorrow, amount, balance, toManyDecimals])

    const errorMessage = useMemo(() => {
        if (amount === '') {
            return null
        }
        return isLendPositionType(positionType)
            ? lendErrorMessage
            : borrowErrorMessage
    }, [positionType, lendErrorMessage, borrowErrorMessage, amount])

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
            return (
                Number(amount) === Number(balance) ||
                !isWalletConnected ||
                isLoadingErc20TokensBalanceData ||
                Number(balance) <= 0
            )
        }

        return (
            Number(amount) === Number(maxBorrowAmount) ||
            !isWalletConnected ||
            isLoadingMaxBorrowingAmount ||
            isLoadingErc20TokensBalanceData ||
            Number(maxBorrowAmount) <= 0
        )
    }

    const isLoadingHelperText = isLendPositionType(positionType)
        ? isLoadingErc20TokensBalanceData
        : isLoadingMaxBorrowingAmount

    function getLoadingHelperText() {
        return isLendPositionType(positionType)
            ? 'Loading balance...'
            : 'Loading borrow limit...'
    }

    const tokenSymbol = isLendPositionType(positionType)
        ? assetDetails?.asset?.token?.symbol
        : selectedBorrowTokenDetails?.token?.symbol

    // Render component
    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <ToggleTab
                type={positionType === 'lend' ? 'tab1' : 'tab2'}
                handleToggle={(positionType: TTypeToMatch) => {
                    setPositionType(positionType === 'tab1' ? 'lend' : 'borrow')
                    setAmount('')
                }}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-gray-600"
                    >
                        {isLendPositionType(positionType)
                            ? 'Lend Collateral'
                            : `Borrow ${selectedBorrowTokenDetails?.token?.symbol || ''}`}
                    </BodyText>
                    {isWalletConnected && isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal:{' '}
                            {isLoadingErc20TokensBalanceData ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(balance ?? 0),
                                            getMaxDecimalsToDisplay(tokenSymbol)
                                        )
                                    ),
                                    getMaxDecimalsToDisplay(tokenSymbol)
                                )
                            )}
                            <span className="inline-block truncate max-w-[70px]">
                                {isLendPositionType(positionType)
                                    ? assetDetails?.asset?.token?.symbol
                                    : selectedBorrowTokenDetails?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                    {isWalletConnected && !isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit:{' '}
                            {isLoadingMaxBorrowingAmount ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                handleSmallestValue(
                                    maxBorrowAmount,
                                    getMaxDecimalsToDisplay(tokenSymbol)
                                )
                            )}
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div
                        className={cn(
                            isLendPositionType(positionType)
                                ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
                                : 'border-t rounded-t-5',
                            'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                        )}
                    >
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
                        {!isWalletConnected &&
                            !isLendPositionType(positionType) && (
                                <ImageWithDefault
                                    src={assetDetails?.asset?.token?.logo || ''}
                                    alt={
                                        assetDetails?.asset?.token?.symbol || ''
                                    }
                                    className="shrink-0 w-[24px] h-[24px] rounded-full"
                                    width={24}
                                    height={24}
                                />
                            )}
                        {(isLoading ||
                            (!selectedBorrowTokenDetails?.token?.address &&
                                !isLendPositionType(positionType) &&
                                isWalletConnected)) && (
                            <Skeleton className="shrink-0 w-[34px] h-[34px] rounded-full" />
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
                                    setSelectedItemDetails={(token) => {
                                        setSelectedBorrowTokenDetails(token)
                                        setAmount('')
                                    }}
                                />
                            )}
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-500"
                        >
                            |
                        </BodyText>
                        <div className="flex flex-col flex-1 gap-[4px]">
                            <CustomNumberInput
                                key={positionType}
                                amount={amount}
                                setAmount={(amount) => setAmount(amount)}
                            />
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium w-fit"
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
                    {!isLendPositionType(positionType) && isWalletConnected && (
                        <div className="flex items-center justify-between w-full py-[12px] px-[24px] rounded-b-5 bg-white border-y border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Net APY
                            </BodyText>
                            {isLoadingMaxBorrowingAmount && (
                                <Skeleton className="w-[50px] h-[20px]" />
                            )}
                            {!isLoadingMaxBorrowingAmount && (
                                <Badge variant="green">
                                    {abbreviateNumber(
                                        isLendPositionType(positionType)
                                            ? Number(
                                                  assetDetails?.asset?.apy ?? 0
                                              )
                                            : Number(
                                                  selectedBorrowTokenDetails?.variable_borrow_apy ??
                                                      0
                                              )
                                    )}
                                    %
                                </Badge>
                            )}
                        </div>
                    )}
                    {isWalletConnected && (
                        <div className="card-content-bottom max-md:px-2 py-3 max-w-[250px] mx-auto">
                            {isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="w-full text-gray-500 text-center"
                                >
                                    {getLoadingHelperText()}
                                </BodyText>
                            )}
                            {!errorMessage && !isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="w-full text-gray-500 text-center"
                                >
                                    {isLendPositionType(positionType)
                                        ? 'Enter amount to proceed with supplying collateral for this position'
                                        : 'Enter the amount you want to borrow from this position'}
                                </BodyText>
                            )}
                            {errorMessage &&
                                !isLoadingHelperText &&
                                !isLoadingErc20TokensBalanceData &&
                                !isLoadingMaxBorrowingAmount && (
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-center text-destructive-foreground"
                                    >
                                        {errorMessage}
                                    </BodyText>
                                )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!isWalletConnected && <ConnectWalletButton />}
                    {isWalletConnected && !isLoading && (
                        <div className="flex flex-col gap-[12px] w-full">
                            <ConfirmationDialog
                                disabled={disabledButton}
                                positionType={positionType}
                                assetDetails={
                                    isLendPositionType(positionType)
                                        ? assetDetails
                                        : selectedBorrowTokenDetailsFormatted
                                }
                                amount={amount}
                                balance={balance}
                                maxBorrowAmount={{
                                    maxToBorrow: maxBorrowAmount,
                                    maxToBorrowFormatted: maxBorrowAmount,
                                    maxToBorrowSCValue: '0',
                                    user: {},
                                }}
                                setAmount={setAmount}
                                healthFactorValues={healthFactorValues}
                                open={isLendBorrowTxDialogOpen}
                                setOpen={setIsLendBorrowTxDialogOpen}
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
                    className="group flex items-center gap-1 text-gray-800 px-0"
                >
                    <ImageWithDefault
                        src={selectedItemDetails?.token?.logo || ''}
                        alt={selectedItemDetails?.token?.symbol || ''}
                        width={24}
                        height={24}
                        className="rounded-full max-w-[24px] max-h-[24px]"
                    />
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <div className="h-full max-h-[200px] overflow-y-auto">
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
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}
