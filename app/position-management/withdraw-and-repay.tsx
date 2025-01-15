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
import { TActionType, TPositionType } from '@/types'
import { PlatformType, TPlatformAsset } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheck,
    CircleCheckIcon,
    CircleXIcon,
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
    CHAIN_ID_MAPPER,
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
    TX_EXPLORER_LINKS,
} from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TRepayTx,
    TTxContext,
    useTxContext,
    TWithdrawTx,
} from '@/context/tx-provider'
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
} from '@/components/ui/drawer'
import { ChainId } from '@/types/chain'
import { SelectTokenByChain } from '@/components/dialogs/SelectTokenByChain'
import { useMorphoVaultData } from '@/hooks/protocols/useMorphoVaultData'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWalletConnection } from '@/hooks/useWalletConnection'

interface ITokenDetails {
    address: string
    decimals: number
    logo: string
    symbol: string
    amount: string | number
    liquidation_threshold?: number // optional for repay
    tokenAmount: string | number
    apy: number
    price_usd: number
    positionAmount?: string | number
}

export default function WithdrawAndRepayActionButton({
    actionType,
    tokenDetails,
}: {
    actionType: 'withdraw' | 'repay'
    tokenDetails: ITokenDetails[]
}) {
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()
    const { getVaultData } = useMorphoVaultData()
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [amount, setAmount] = useState('')
    const [maxBorrowAmount, setMaxBorrowAmount] = useState('0')
    // Morpho vault when the user is withdrawing from morpho vaults
    const [maxWithdrawAmountMorphoVaults, setMaxWithdrawAmountMorphoVaults] =
        useState('0')
    // Morpho vault when the user is withdrawing from morpho vaults
    const [morphoVault, setMorphoVault] = useState<any>(null)

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
    const [maxWithdrawTokensAmount, setMaxWithdrawTokensAmount] = useState<
        Record<
            string,
            {
                maxToWithdraw: string
                maxToWithdrawFormatted: string
                user: any
            }
        >
    >({})
    const [maxRepayTokensAmount, setMaxRepayTokensAmount] = useState<
        Record<
            string,
            { maxToRepay: string; maxToRepayFormatted: string; user: any }
        >
    >({})

    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const positionTypeParam: TPositionType =
        (searchParams.get('position_type') as TPositionType) || 'lend'
    const {
        fetchAaveV3Data,
        getMaxWithdrawAmount,
        getMaxRepayAmount,
        getAllowance,
        providerStatus,
    } = useAaveV3Data()
    const { withdrawTx, setWithdrawTx, repayTx, setRepayTx } =
        useTxContext() as TTxContext
    const isWithdrawAction = actionType === 'withdraw'
    const [isSelectTokenDialogOpen, setIsSelectTokenDialogOpen] =
        useState(false)
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState(false)
    const [selectedTokenDetails, setSelectedTokenDetails] =
        useState<ITokenDetails | null>(null)
    const { handleSwitchChain, walletAddress } = useWalletConnection()

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

    // const isMorphoMarketsProtocol =
    //     platformData?.platform?.protocol_type === 'morpho' &&
    //     !platformData?.platform?.isVault

    const isMorphoVaultsProtocol =
        platformData?.platform?.protocol_type === 'morpho' &&
        platformData?.platform?.isVault

    const vaultData = getVaultData({
        vaultId: platformData?.platform?.core_contract as `0x${string}`,
        chainId: Number(chain_id),
        enabled: isMorphoVaultsProtocol,
    })

    const hasSingleToken = tokenDetails.length === 1

    useEffect(() => {
        if (vaultData) {
            setMorphoVault(vaultData)
            let currentVaultPosition = portfolioData.platforms.find(
                (platform) =>
                    platform.protocol_identifier ===
                    platformData.platform.protocol_identifier
            )
            let positionAmount = currentVaultPosition?.total_liquidity
            setMaxWithdrawAmountMorphoVaults(positionAmount?.toString() ?? '0')
        }
    }, [isMorphoVaultsProtocol, vaultData, portfolioData])

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

    // Get max withdraw amount
    useEffect(() => {
        setIsLoadingMaxBorrowingAmount(true)
        if (
            walletAddress &&
            walletAddress.length > 0 &&
            platformData.assets.length > 0 &&
            platformData.platform.protocol_type === 'aaveV3' &&
            providerStatus.isReady
        ) {
            // const _borrowableTokens = platformData.assets.filter(
            //     (a) => a.borrow_enabled
            // )
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
                    // Initialize maxWithdrawAmounts
                    const maxWithdrawAmounts: Record<
                        string,
                        {
                            maxToWithdraw: string
                            maxToWithdrawFormatted: string
                            user: any
                        }
                    > = {}
                    for (const withdrawToken of tokenDetails) {
                        const withdrawTokenAddress =
                            withdrawToken?.address.toLowerCase()
                        maxWithdrawAmounts[withdrawTokenAddress] =
                            getMaxWithdrawAmount(
                                withdrawTokenAddress,
                                r as any
                            ) ?? {
                                maxToWithdraw: '0',
                                maxToWithdrawFormatted: '0',
                                user: {},
                            }
                    }

                    const maxRepayAmounts: Record<
                        string,
                        {
                            maxToRepay: string
                            maxToRepayFormatted: string
                            user: any
                        }
                    > = {}
                    for (const repayToken of tokenDetails) {
                        const repayTokenAddress =
                            repayToken?.address.toLowerCase()
                        maxRepayAmounts[repayTokenAddress] = getMaxRepayAmount(
                            repayTokenAddress,
                            chain_id as number,
                            r as any
                        ) ?? {
                            maxToRepay: '0',
                            maxToRepayFormatted: '0',
                            user: {},
                        }
                    }

                    setMaxRepayTokensAmount(maxRepayAmounts)
                    setMaxWithdrawTokensAmount(maxWithdrawAmounts)
                })
                .catch((error) => {
                    console.log('error fetching max withdraw/repay amount', error)
                    setMaxBorrowAmount('0')
                    setIsLoadingMaxBorrowingAmount(false)
                })
        }
    }, [
        walletAddress,
        Object.keys(platformData.platform).length,
        providerStatus.isReady,
        withdrawTx.status,
        repayTx.status,
        selectedTokenDetails?.address,
        withdrawTx.isConfirmed,
        repayTx.isConfirmed,
        isSelectTokenDialogOpen,
    ])

    // useEffect(() => {
    //     if (!Object.keys(maxBorrowTokensAmount).length) return

    //     const currentTokenDetails = selectedTokenDetails
    //     const decimals = currentTokenDetails?.decimals ?? 0
    //     const maxAmountToWithdraw = Math.abs(
    //         Number(
    //             withdrawTokensAmount[
    //                 currentTokenDetails?.address.toLowerCase() ?? ''
    //             ]?.maxToWithdrawFormatted
    //         )
    //     )?.toFixed(decimals)
    //     const hasZeroLimit = !Math.abs(Number(maxAmountToWithdraw))

    //     setMaxWithdrawAmount(hasZeroLimit ? '0' : maxAmountToWithdraw)
    //     setIsLoadingMaxBorrowingAmount(false)
    // }, [selectedTokenDetails?.address, withdrawTokensAmount])

    useEffect(() => {
        if (
            providerStatus.isReady &&
            !!walletAddress &&
            !!platformData.platform?.core_contract &&
            !!tokenAddress
        ) {
            // Set isConfirming to true when the status is 'approve' and isRefreshingAllowance is true
            if (repayTx.status === 'approve' && repayTx.isRefreshingAllowance) {
                setRepayTx((prev: TRepayTx) => ({
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
                setRepayTx((prev: TRepayTx) => ({
                    ...prev,
                    allowanceBN: r,
                    isRefreshingAllowance: false,
                }))
                // Check if the allowance is greater than or equal to the amount
                const positionTypeBasedAssetDetails =
                    assetDetailsForTx?.asset?.token?.decimals ?? 0
                const amountBN = parseUnits(
                    // Boolean(amount) ? amount : '0',
                    '0',
                    positionTypeBasedAssetDetails
                )
                // Update the status of the repayTx based on the allowance and the confirmation state
                if (repayTx.status === 'approve' && repayTx.isConfirmed) {
                    // console.log('r', r)
                    // console.log('amountBN', amountBN)
                    // console.log('amount', amount)
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        status: r.gte(amountBN) ? 'repay' : 'approve',
                        errorMessage: r.gte(amountBN)
                            ? ''
                            : 'Insufficient allowance',
                        isConfirming: false,
                    }))
                }
            })
        }
        // console.log('walletAddress', walletAddress)
        // console.log('platformData.platform?.core_contract', platformData.platform?.core_contract)
        // console.log('repayTx.status', repayTx.status)
        // console.log('repayTx.isRefreshingAllowance', repayTx.isRefreshingAllowance)
        // console.log('providerStatus.isReady', providerStatus.isReady)
    }, [
        walletAddress,
        !!platformData.platform?.core_contract,
        repayTx.status,
        repayTx.isRefreshingAllowance,
        providerStatus.isReady,
    ])
    // console.log('repayTx', repayTx)

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (withdrawTx.status === 'view' && withdrawTx.isConfirmed) {
            setIsRefreshingErc20TokensBalanceData(true)
        }

        if (repayTx.status === 'view' && repayTx.isConfirmed) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [
        repayTx.status,
        withdrawTx.status,
        repayTx.isConfirmed,
        withdrawTx.isConfirmed,
    ])

    // Refresh balance when wallet address changes
    useEffect(() => {
        setIsRefreshingErc20TokensBalanceData(true)
    }, [walletAddress])

    // Set selected borrow token details
    useEffect(() => {
        setSelectedBorrowTokenDetails(borrowTokensDetails[0])
    }, [!!borrowTokensDetails.length])

    // Reset Amount
    // useEffect(() => {
    //     setAmount('')
    // }, [positionType, selectedBorrowTokenDetails?.token?.address])

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

    // const assetDetails: any = getFormattedAssetDetails(tokenAddress)
    const assetDetailsForTx = getAssetDetails(
        hasSingleToken
            ? tokenDetails[0].address
            : (selectedTokenDetails?.address ?? '')
    )

    const selectedBorrowTokenDetailsFormatted =
        formatSelectedBorrowTokenDetails(
            selectedBorrowTokenDetails?.token?.address ?? ''
        )

    // Get balance
    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[
            selectedTokenDetails?.address.toLowerCase() ??
            tokenAddress.toLowerCase()
        ]?.balanceFormatted ?? 0
    ).toString()

    // Check if amount has too many decimals
    const toManyDecimals = useMemo(() => {
        if (assetDetailsForTx) {
            return checkDecimalPlaces(
                amount,
                assetDetailsForTx?.asset?.token?.decimals ?? 0
            )
        }
        return false
    }, [assetDetailsForTx, amount])

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

    const healthFactorValues = getHealthFactorValues(hasSingleToken ? tokenDetails[0] : selectedTokenDetails)
    // console.log(healthFactorValues)

    function getMaxWithdrawAmountForTx() {
        const isMorphoVaultsProtocol =
            assetDetailsForTx.protocol_type === PlatformType.MORPHO &&
            assetDetailsForTx.isVault

        if (isMorphoVaultsProtocol) {
            return (
                Number(tokenDetails[0].amount)
                    .toFixed(tokenDetails[0].decimals)
                    .toString() ?? '0'
            )
        }

        return (
            maxWithdrawTokensAmount[hasSingleToken ? tokenDetails[0].address : selectedTokenDetails?.address ?? '']
                ?.maxToWithdrawFormatted ?? '0'
        )
    }

    function getMaxRepayAmountForTx() {
        const isMorphoVaultsProtocol =
            assetDetailsForTx.protocol_type === PlatformType.MORPHO &&
            assetDetailsForTx.isVault

        if (isMorphoVaultsProtocol) {
            return (
                Number(tokenDetails[0].amount)
                    .toFixed(tokenDetails[0].decimals)
                    .toString() ?? '0'
            )
        }

        return (
            maxRepayTokensAmount[hasSingleToken ? tokenDetails[0].address : selectedTokenDetails?.address ?? '']
                ?.maxToRepayFormatted ?? '0'
        )
    }

    const maxWithdrawAmountForTx = getMaxWithdrawAmountForTx()

    const maxRepayAmountForTx = getMaxRepayAmountForTx()

    const positionAmount = hasSingleToken ? tokenDetails[0].amount : selectedTokenDetails?.positionAmount ?? 0

    const lendErrorMessage = useMemo(() => {
        if (Number(amount) > Number(maxWithdrawAmountForTx)) {
            return 'You do not have enough withdraw limit'
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
        if (Number(amount) > Number(maxRepayAmountForTx)) {
            return 'Amount exceeds available repay limit'
        }
        return null
    }, [hasCollateral, canBorrow, amount, balance, toManyDecimals])

    const errorMessage = useMemo(() => {
        return isWithdrawAction ? lendErrorMessage : borrowErrorMessage
    }, [positionType, lendErrorMessage, borrowErrorMessage])

    const disabledButton: boolean = useMemo(
        () =>
            Number(amount) >
            Number(isWithdrawAction ? maxWithdrawAmountForTx : maxRepayAmountForTx) ||
            Number(amount) <= 0 ||
            toManyDecimals,
        [amount, maxWithdrawAmountForTx, toManyDecimals, isWithdrawAction]
    )

    const isAaveV3Protocol = platformData?.platform?.protocol_type === 'aaveV3'
    const isPolygonChain = Number(chain_id) === 137

    const isLoadingHelperText = isWithdrawAction
        ? isLoadingErc20TokensBalanceData
        : isLoadingMaxBorrowingAmount

    function getLoadingHelperText() {
        return isWithdrawAction
            ? 'Loading balance...'
            : 'Loading borrow limit...'
    }

    function getMaxDecimalsToDisplay(): number {
        return isWithdrawAction
            ? assetDetailsForTx?.asset?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                assetDetailsForTx?.asset?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 4
                : 2
            : selectedBorrowTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                selectedBorrowTokenDetails?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 4
                : 2
    }

    function handleSelectToken(token: any) {
        // Set selected token details
        setSelectedTokenDetails(token)
        // Close select token dialog
        setIsSelectTokenDialogOpen(false)
        // Open confirmation dialog
        setIsConfirmationDialogOpen(true)
    }

    // Loading skeleton
    // if (isLoading && isAaveV3Protocol && isPolygonChain) {
    //     return <LoadingSectionSkeleton className="h-[300px] w-full" />
    // }

    // Check if platform is aaveV3 or compoundV2, else return null
    // if (!(isAaveV3Protocol && isPolygonChain)) {
    //     return null
    // }

    // Render component
    return (
        <section className="withdraw-and-repay-section-wrapper flex flex-col gap-[12px]">
            {/* More than 1 token - Select token dialog */}
            {tokenDetails.length > 1 && (
                <>
                    <Button
                        onClick={() => setIsSelectTokenDialogOpen(true)}
                        variant={'secondaryOutline'}
                        size="sm"
                        className="uppercase w-[100px] py-3"
                    >
                        <span className="uppercase leading-[0]">
                            {isWithdrawAction ? 'Withdraw' : 'Repay'}
                        </span>
                    </Button>
                    <SelectTokenByChain
                        open={isSelectTokenDialogOpen}
                        setOpen={setIsSelectTokenDialogOpen}
                        networks={[]}
                        tokens={tokenDetails.map((token) => ({
                            address: token.address,
                            positionAmount: String(token.tokenAmount),
                            positionAmountInUsd: String(token.amount),
                            logo: token.logo,
                            symbol: token.symbol,
                            apy: token.apy,
                            price_usd: token.price_usd,
                            decimals: token.decimals,
                        }))}
                        onSelectToken={handleSelectToken}
                    />
                </>
            )}
            {/* Single token - Confirmation dialog */}
            {(tokenDetails.length === 1 || isConfirmationDialogOpen) && (
                <ConfirmationDialog
                    isOpen={isConfirmationDialogOpen}
                    setIsOpen={setIsConfirmationDialogOpen}
                    disabled={disabledButton}
                    actionType={actionType}
                    assetDetails={
                        isMorphoVaultsProtocol
                            ? {
                                ...assetDetailsForTx,
                                vault: vaultData,
                            }
                            : assetDetailsForTx
                    }
                    maxWithdrawAmount={
                        // isMorphoVaultsProtocol ? maxWithdrawAmountMorphoVaults : maxWithdrawAmountForTx
                        maxWithdrawAmountForTx
                    }
                    maxRepayAmount={maxRepayAmountForTx}
                    healthFactorValues={healthFactorValues}
                    amount={amount}
                    setAmount={setAmount}
                    positionAmount={positionAmount}
                    errorMessage={errorMessage}
                />
            )}
        </section>
    )
}

function ConfirmationDialog({
    isOpen,
    setIsOpen,
    disabled,
    actionType,
    assetDetails,
    maxWithdrawAmount,
    maxRepayAmount,
    healthFactorValues,
    amount,
    setAmount,
    positionAmount,
    errorMessage,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    disabled: boolean
    actionType: TActionType
    assetDetails: any
    maxWithdrawAmount: string
    maxRepayAmount: string
    healthFactorValues: {
        healthFactor: any
        newHealthFactor: any
    }
    amount: string
    setAmount: (amount: string) => void
    positionAmount: string | number | undefined
    errorMessage: string | null
}) {
    const { withdrawTx, setWithdrawTx, repayTx, setRepayTx } =
        useTxContext() as TTxContext
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || 1
    const { width: screenWidth } = useDimensions()
    // const [amount, setAmount] = useState('')
    const isDesktop = screenWidth > 768
    const isWithdrawAction = actionType === 'withdraw'
    const isTxFailed = isWithdrawAction
        ? withdrawTx.errorMessage.length > 0
        : repayTx.errorMessage.length > 0
    const { handleSwitchChain, isWalletConnected, walletAddress } =
        useWalletConnection()

    const isMorphoVaultsProtocol = assetDetails?.vault ? true : false

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetLendwithdrawTx()
        }
    }, [])

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        if (isOpen) {
            // Switch chain when the dialog is opened
            if (!!walletAddress) {
                // modal.switchNetwork(CHAIN_ID_MAPPER[Number(chain_id) as ChainId])
                handleSwitchChain(Number(chain_id))
            }
        }
    }, [isOpen, chain_id])

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
            status: 'withdraw',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        // When opening the dialog, reset the amount and the tx status
        setIsOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (!open) {
            setAmount('')
            resetLendwithdrawTx()
        }
    }

    function isShowBlock(status: { repay: boolean; withdraw: boolean }) {
        return isWithdrawAction ? status.withdraw : status.repay
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

    const currentPositionAmount = Number(positionAmount)
    const newPositionAmount = Number(positionAmount) - Number(amount)

    const disableActionButton =
        disabled
    // || (!hasAcknowledgedRisk && !isWithdrawAction && isHfLow())

    const isDisabledMaxBtn = () => {
        if (isWithdrawAction) {
            return (
                !isWalletConnected ||
                Number(amount) === Number(maxWithdrawAmount)
            )
        }

        return (
            !isWalletConnected ||
            Number(amount) === Number(positionAmount)
        )
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
                    tokenName: assetDetails?.asset?.token?.symbol,
                    txStatus: isWithdrawAction ? withdrawTx : repayTx,
                    actionType,
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
                                    assetDetails?.chain_id ||
                                    assetDetails?.platform?.chain_id
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
                repay: repayTx.status === 'approve' && !isRepayTxInProgress,
                withdraw:
                    withdrawTx.status === 'withdraw' && !isWithdrawTxInProgress,
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
                repay:
                    (repayTx.status === 'repay' && !isRepayTxInProgress) ||
                    (repayTx.status === 'view' && !isRepayTxInProgress),
                withdraw:
                    // (withdrawTx.status === 'borrow' && !isWithdrawTxInProgress) ||
                    withdrawTx.status === 'view' && !isWithdrawTxInProgress,
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
                            repay: repayTx.status === 'view',
                            withdraw: withdrawTx.status === 'view',
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
                            repay:
                                repayTx.status === 'repay' && !isRepayTxInProgress,
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
            <div className="flex flex-col gap-[12px]">
                {/* Block 1 */}
                {isShowBlock({
                    repay: repayTx.status === 'approve' && !isRepayTxInProgress,
                    withdraw:
                        withdrawTx.status === 'withdraw' &&
                        !isWithdrawTxInProgress,
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
                                    setAmount(
                                        isWithdrawAction
                                            ? (maxWithdrawAmount.toString() ?? '0')
                                            : (maxRepayAmount.toString() ?? '0')
                                    )
                                }
                                disabled={isDisabledMaxBtn()}
                            >
                                max
                            </Button>
                        </div>
                    )}
                {/* Block 2 */}
                {isShowBlock({
                    repay: repayTx.status === 'approve' && !isRepayTxInProgress,
                    withdraw:
                        withdrawTx.status === 'withdraw' &&
                        !isWithdrawTxInProgress,
                }) && (
                        <div
                            className={`flex items-center justify-end px-[24px] mb-[4px] gap-1`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isWithdrawAction ? 'Withdraw limit:' : 'Borrowed:'}
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {handleSmallestValue(
                                    isWithdrawAction
                                        ? maxWithdrawAmount.toString()
                                        : (positionAmount ?? 0).toString()
                                )}{' '}
                                {assetDetails?.asset?.token?.symbol ??
                                    assetDetails?.token?.symbol}
                            </BodyText>
                        </div>
                    )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-[24px] bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        repay: !isRepayTxInProgress && repayTx.status === 'approve',
                        withdraw: !isWithdrawTxInProgress && withdrawTx.status === 'withdraw',
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Remaining {isWithdrawAction ? "supply" : "debt"}
                                </BodyText>
                                <div className="flex flex-col items-end justify-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={`text-gray-800`}
                                        >
                                            {handleSmallestValue(currentPositionAmount.toString())}
                                        </BodyText>
                                        {(currentPositionAmount !== newPositionAmount) &&
                                            <>
                                                <ArrowRightIcon
                                                    width={16}
                                                    height={16}
                                                    className="stroke-gray-800"
                                                    strokeWidth={2.5}
                                                />
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className={`text-gray-800`}
                                                >
                                                    {handleSmallestValue(newPositionAmount.toString())}
                                                </BodyText>
                                            </>
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        repay: repayTx.status === 'approve' &&
                            !isRepayTxInProgress &&
                            !!Number(healthFactorValues.newHealthFactor),
                        withdraw:
                            withdrawTx.status === 'withdraw' &&
                            !isWithdrawTxInProgress &&
                            !!Number(healthFactorValues.newHealthFactor),
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
                        repay:
                            (repayTx.status === 'repay' ||
                                repayTx.status === 'view') &&
                            repayTx.hash.length > 0 &&
                            !isRepayTxInProgress,
                        withdraw:
                            withdrawTx.status === 'view' &&
                            withdrawTx.hash.length > 0 &&
                            !isWithdrawTxInProgress,
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
                                                isWithdrawAction
                                                    ? withdrawTx.hash
                                                    : repayTx.hash,
                                                assetDetails?.chain_id ||
                                                assetDetails?.platform?.chain_id
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
                {/* Error Message */}
                {errorMessage && <CustomAlert description={errorMessage} />}
                {/* Block 4 */}
                <div className={`${isTxInProgress ? 'invisible h-0' : ''}`}>
                    <ActionButton
                        disabled={disableActionButton}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        actionType={actionType}
                    />
                </div>
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
        <Drawer open={isOpen} dismissible={false}>
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

function isRepayPositionType(actionType: TActionType) {
    return actionType === 'repay'
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
}: {
    amount: string
    tokenName: string
    txStatus: TRepayTx | TWithdrawTx
    actionType: TActionType
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve spending ${formattedText} from your wallet`,
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
