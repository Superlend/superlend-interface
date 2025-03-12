'use client'

import { Button } from '@/components/ui/button'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPositionType } from '@/types'
import { PlatformType, TPlatformAsset } from '@/types/platform'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    scientificToDecimal,
} from '@/lib/utils'
import AAVE_POOL_ABI from '@/data/abi/aaveApproveABI.json'
import { useReadContract } from 'wagmi'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import {
    CHAIN_ID_MAPPER,
    FLUID_MAX_VALUE,
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
} from '@/constants'
import {
    TRepayTx,
    TTxContext,
    useTxContext,
    TWithdrawTx,
} from '@/context/tx-provider'
import { useAaveV3Data } from '../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { calculateHealthFactorFromBalancesBigUnits } from '@aave/math-utils'
import { valueToBigNumber } from '@aave/math-utils'
import { ChainId } from '@/types/chain'
import { SelectTokenByChain } from '@/components/dialogs/SelectTokenByChain'
import { useMorphoVaultData } from '@/hooks/protocols/useMorphoVaultData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { AccrualPosition, MarketId } from '@morpho-org/blue-sdk'
import { BUNDLER_ADDRESS_MORPHO } from '@/lib/constants'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useERC20Balance } from '../../hooks/useERC20Balance'
import { WithdrawOrRepayTxDialog } from '@/components/dialogs/WithdrawOrRepayTxDialog'

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
    const { logEvent } = useAnalytics()
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()
    const { getVaultData, getMarketData } = useMorphoVaultData()
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [amount, setAmount] = useState('')
    // Morpho vault when the user is withdrawing from morpho vaults
    const [maxWithdrawAmountMorphoVaults, setMaxWithdrawAmountMorphoVaults] =
        useState('0')
    // Morpho vault when the user is withdrawing from morpho vaults
    const [morphoVault, setMorphoVault] = useState<any>(null)

    const [isLoadingMaxAmount, setIsLoadingMaxAmount] =
        useState(false)
    const [borrowTokensDetails, setBorrowTokensDetails] = useState<
        TPlatformAsset[]
    >([])
    const [selectedBorrowTokenDetails, setSelectedBorrowTokenDetails] =
        useState<TPlatformAsset | null>(null)
    const [maxWithdrawTokensAmount, setMaxWithdrawTokensAmount] = useState<
        Record<
            string,
            {
                maxToWithdraw: string
                maxToWithdrawFormatted: string
                maxToWithdrawSCValue: string
                user: any
            }
        >
    >({})
    const [maxRepayTokensAmount, setMaxRepayTokensAmount] = useState<
        Record<
            string,
            {
                maxToRepay: string
                maxToRepayFormatted: string
                maxToRepaySCValue: string
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
    const {
        fetchAaveV3Data,
        getMaxWithdrawAmount,
        getMaxRepayAmount,
        getAllowance,
        providerStatus,
    } = useAaveV3Data()
    const {
        withdrawTx,
        setWithdrawTx,
        repayTx,
        setRepayTx,
        lendTx,
        borrowTx,
        isLendBorrowTxDialogOpen,
    } = useTxContext() as TTxContext
    const isWithdrawAction = actionType === 'withdraw'
    const [isSelectTokenDialogOpen, setIsSelectTokenDialogOpen] =
        useState(false)
    const [isWithdrawRepayTxDialogOpen, setIsWithdrawRepayTxDialogOpen] =
        useState(false)
    const [selectedTokenDetails, setSelectedTokenDetails] =
        useState<ITokenDetails | null>(null)
    const { handleSwitchChain, walletAddress } = useWalletConnection()
    const { data: erc20Balances } = useERC20Balance(walletAddress)

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

    const isMorphoProtocol =
        platformData?.platform?.protocol_type === PlatformType.MORPHO
    const isMorphoVaultsProtocol =
        isMorphoProtocol && platformData?.platform?.isVault
    const isMorphoMarketsProtocol =
        isMorphoProtocol && !platformData?.platform?.isVault

    const isFluidProtocol =
        platformData?.platform?.protocol_type === PlatformType.FLUID
    const isFluidVaultsProtocol =
        isFluidProtocol && platformData?.platform?.isVault
    const isFluidLendProtocol =
        isFluidProtocol && !platformData?.platform?.isVault

    const vaultData = getVaultData({
        vaultId: platformData?.platform?.core_contract as `0x${string}`,
        chainId: Number(chain_id),
        enabled: isMorphoVaultsProtocol,
    })

    const morphoMarketData = getMarketData({
        marketId: platformData?.platform?.morpho_market_id as MarketId,
        chainId: Number(chain_id),
        enabled: isMorphoMarketsProtocol,
        walletAddress: walletAddress as `0x${string}`,
    })

    const hasSingleToken = tokenDetails.length === 1

    // Get max withdraw amount for morpho
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

        if (
            morphoMarketData &&
            morphoMarketData.marketData &&
            morphoMarketData.position
        ) {
            let market = morphoMarketData.marketData
            let position = morphoMarketData.position
            const accrualPosition: AccrualPosition = new AccrualPosition(
                position,
                market
            )

            let withdrawAmount = accrualPosition?.withdrawableCollateral
                ? accrualPosition?.withdrawableCollateral
                : 0

            let repayAmount = accrualPosition?.borrowAssets ?? 0

            const decimal =
                tokenDetails.find(
                    (token) =>
                        token.address ===
                        market?.params?.collateralToken.toString()
                )?.decimals ?? 0
            const decimalRepay =
                tokenDetails.find(
                    (token) =>
                        token.address === market?.params?.loanToken.toString()
                )?.decimals ?? 0

            const token: string =
                market?.params?.collateralToken.toString() ?? ''
            const loanToken: string = market?.params?.loanToken.toString() ?? ''

            const formattedWithdrawAmount = formatUnits(
                BigNumber.from(withdrawAmount),
                decimal
            )
            const formattedRepayAmount = formatUnits(
                BigNumber.from(repayAmount),
                decimalRepay
            )

            let newformattedWithdrawAmount = (
                parseFloat(formattedWithdrawAmount) * 0.99
            ).toFixed(decimal ?? 6)
            let newformattedRepayAmount = (
                parseFloat(formattedRepayAmount) * 0.99
            ).toFixed(decimalRepay ?? 6)

            if (!maxWithdrawTokensAmount[token]) {
                setMaxWithdrawTokensAmount({
                    [token]: {
                        maxToWithdraw: newformattedWithdrawAmount.toString(),
                        maxToWithdrawFormatted:
                            newformattedWithdrawAmount.toString(),
                        maxToWithdrawSCValue: '0', // TODO : update this
                        user: {},
                    },
                })
            }
            if (!maxRepayTokensAmount[loanToken]) {
                setMaxRepayTokensAmount({
                    [loanToken]: {
                        maxToRepay: newformattedRepayAmount.toString(),
                        maxToRepayFormatted: newformattedRepayAmount.toString(),
                        maxToRepaySCValue: '0', // TODO: update this
                        user: {},
                    },
                })
            }
        }
    }, [isMorphoVaultsProtocol, vaultData, morphoMarketData, portfolioData])

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

    function normalizeScientificNotation(value: string | number): string {
        const strValue = value.toString()

        // Check if value is in scientific notation
        if (strValue.includes('e')) {
            const num = Number(strValue)
            // If the number is extremely small (less than 1e-6), return "0"
            if (Math.abs(num) < 1e-6) {
                return '0'
            }
            // Otherwise use the existing scientificToDecimal function
            return scientificToDecimal(num).toString()
        }

        return strValue
    }

    // Get max withdraw amount for aave v3 and fluid
    useEffect(() => {
        setIsLoadingMaxAmount(true)

        if (
            !!walletAddress &&
            !!Object.keys(erc20Balances).length &&
            !!platformData.assets.length &&
            providerStatus.isReady
        ) {
            if (isAaveV3Protocol) {
                fetchAaveV3Data(
                    Number(chain_id),
                    platformData.platform.uiPoolDataProvider!,
                    platformData.platform.poolAddressesProvider!
                )
                    .then((r) => {
                        if (!r || !r[0]) {
                            // Add null check
                            // setMaxBorrowAmount('0')

                            setIsLoadingMaxAmount(false)
                            return
                        }
                        // Initialize maxWithdrawAmounts
                        const maxWithdrawAmounts: Record<
                            string,
                            {
                                maxToWithdraw: string
                                maxToWithdrawFormatted: string
                                maxToWithdrawSCValue: string
                                user: any
                            }
                        > = {}
                        for (const withdrawToken of tokenDetails) {
                            const withdrawTokenAddress =
                                withdrawToken?.address.toLowerCase()
                            const _maxWithdrawValue = getMaxWithdrawAmount(
                                withdrawTokenAddress,
                                chain_id as number,
                                r as any
                            )
                            maxWithdrawAmounts[withdrawTokenAddress] =
                                _maxWithdrawValue
                                    ? {
                                          ..._maxWithdrawValue,
                                          maxToWithdrawSCValue: '0',
                                      }
                                    : {
                                          maxToWithdraw: '0',
                                          maxToWithdrawFormatted: '0',
                                          maxToWithdrawSCValue: '0',
                                          user: {},
                                      }
                        }

                        const maxRepayAmounts: Record<
                            string,
                            {
                                maxToRepay: string
                                maxToRepayFormatted: string
                                maxToRepaySCValue: string
                                user: any
                            }
                        > = {}
                        for (const repayToken of tokenDetails) {
                            const repayTokenAddress =
                                repayToken?.address.toLowerCase()
                            const _maxRepayValue = getMaxRepayAmount(
                                repayTokenAddress,
                                chain_id as number,
                                r as any
                            )
                            maxRepayAmounts[repayTokenAddress] = _maxRepayValue
                                ? { ..._maxRepayValue, maxToRepaySCValue: '0' }
                                : {
                                      maxToRepay: '0',
                                      maxToRepayFormatted: '0',
                                      maxToRepaySCValue: '0',
                                      user: {},
                                  }
                        }

                        setMaxRepayTokensAmount(maxRepayAmounts)
                        setMaxWithdrawTokensAmount(maxWithdrawAmounts)
                    })
                    .catch((error) => {
                        console.log(
                            'error fetching max withdraw/repay amount',
                            error
                        )
                        // setMaxBorrowAmount('0')
                        setIsLoadingMaxAmount(false)
                    })
            } else if (isFluidVaultsProtocol) {
                const lendTokenDetails = platformData.assets.filter(
                    (a) => a.ltv > 0
                )[0]
                const borrowPositionDetails =
                    portfolioData.platforms[0].positions.filter(
                        (p) => p.type === 'borrow'
                    )[0]
                const lendPositionDetails =
                    portfolioData.platforms[0].positions.filter(
                        (p) => p.type === 'lend'
                    )[0]

                // Get max withdraw amount for fluid
                const maxWithdrawAmounts: Record<
                    string,
                    {
                        maxToWithdraw: string
                        maxToWithdrawFormatted: string
                        maxToWithdrawSCValue: string
                        user: any
                    }
                > = {}
                for (const withdrawToken of tokenDetails) {
                    if (actionType !== 'withdraw') continue
                    const withdrawTokenAddress =
                        withdrawToken?.address.toLowerCase()
                    const borrowPositionUSD =
                        Number(
                            normalizeScientificNotation(
                                borrowPositionDetails?.amount ?? 0
                            )
                        ) * (borrowPositionDetails?.token?.price_usd ?? 0)
                    const collatRequiredInUsd =
                        (borrowPositionUSD * 100) / (lendTokenDetails?.ltv ?? 1)
                    const collatRequiredInToken =
                        collatRequiredInUsd /
                        lendPositionDetails.token.price_usd
                    const amountToWithdraw = parseUnits(
                        (
                            lendPositionDetails.amount - collatRequiredInToken
                        ).toFixed(lendTokenDetails?.token?.decimals ?? 0),
                        (lendTokenDetails?.token?.decimals ?? 0)
                    ).toString()

                    const amountToWithdrawFluid =
                        collatRequiredInUsd === 0
                            ? FLUID_MAX_VALUE
                            : '-' + amountToWithdraw
                    maxWithdrawAmounts[withdrawTokenAddress] = {
                        maxToWithdraw: amountToWithdraw,
                        maxToWithdrawFormatted: formatUnits(
                            amountToWithdraw,
                            (lendTokenDetails?.token?.decimals ?? 0)
                        ),
                        maxToWithdrawSCValue: amountToWithdrawFluid,
                        user: {},
                    }
                }

                // Get max repay amount for fluid
                const maxRepayAmounts: Record<
                    string,
                    {
                        maxToRepay: string
                        maxToRepayFormatted: string
                        maxToRepaySCValue: string
                        user: any
                    }
                > = {}
                for (const repayToken of tokenDetails) {
                    if (actionType !== 'repay') continue
                    const repayTokenAddress = repayToken?.address.toLowerCase()
                    const maxDebt = parseUnits(
                        normalizeScientificNotation(repayToken?.tokenAmount?.toString() ?? '0'),
                        repayToken.decimals
                    )
                    const balance = BigNumber.from(
                        erc20Balances[chain_id as number][repayTokenAddress]
                            .balanceRaw
                    )
                    const maxRepay = balance.lte(maxDebt) ? balance : maxDebt
                    const maxRepayFluid = maxRepay.eq(maxDebt)
                        ? FLUID_MAX_VALUE
                        : '-' + maxRepay.toString()
                    maxRepayAmounts[repayTokenAddress] = {
                        maxToRepay: maxRepay.toString(),
                        maxToRepayFormatted: formatUnits(
                            maxRepay.toString(),
                            repayToken.decimals
                        ),
                        maxToRepaySCValue: maxRepayFluid,
                        user: {},
                    }
                }

                setMaxWithdrawTokensAmount(maxWithdrawAmounts)
                setMaxRepayTokensAmount(maxRepayAmounts)
            }
            setIsLoadingMaxAmount(false)
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
        erc20Balances,
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
            if (
                withdrawTx.status === 'approve' &&
                withdrawTx.isRefreshingAllowance
            ) {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isConfirming: true,
                }))
            }
            // Get allowance
            getAllowance(
                Number(chain_id),
                isMorphoVaultsProtocol
                    ? BUNDLER_ADDRESS_MORPHO[Number(chain_id)]
                    : platformData.platform.core_contract,
                tokenAddress
            ).then((r: BigNumber) => {
                // console.log('r', r)
                // console.log('r.toString()', r.toString())
                // Update allowanceBN and set isRefreshingAllowance to false
                if (!isWithdrawAction) {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        allowanceBN: r,
                        isRefreshingAllowance: false,
                    }))
                } else {
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        allowanceBN: r,
                        isRefreshingAllowance: false,
                    }))
                }
                // Check if the allowance is greater than or equal to the amount
                const positionTypeBasedAssetDetails =
                    assetDetailsForTx?.asset?.token?.decimals ?? 0
                const amountBN = parseUnits('0', positionTypeBasedAssetDetails)
                // Update the status of the repayTx based on the allowance and the confirmation state
                if (repayTx.status === 'approve' && repayTx.isConfirmed) {
                    setRepayTx((prev: TRepayTx) => ({
                        ...prev,
                        status: r.gte(amountBN) ? 'repay' : 'approve',
                        errorMessage: r.gte(amountBN)
                            ? ''
                            : 'Insufficient allowance',
                        isConfirming: false,
                    }))
                }
                if (withdrawTx.status === 'approve' && withdrawTx.isConfirmed) {
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        status: r.gte(amountBN) ? 'withdraw' : 'approve',
                        errorMessage: r.gte(amountBN)
                            ? ''
                            : 'Insufficient allowance',
                        isConfirming: false,
                    }))
                }
            })
        }
    }, [
        walletAddress,
        !!platformData.platform?.core_contract,
        BUNDLER_ADDRESS_MORPHO[Number(chain_id)],
        repayTx.status,
        repayTx.isRefreshingAllowance,
        withdrawTx.isRefreshingAllowance,
        providerStatus.isReady,
    ])

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (
            (withdrawTx.status === 'view' ||
                repayTx.status === 'view' ||
                lendTx.status === 'view' ||
                borrowTx.status === 'view') &&
            !isWithdrawRepayTxDialogOpen &&
            !isLendBorrowTxDialogOpen
        ) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [
        repayTx.status,
        withdrawTx.status,
        lendTx.status,
        borrowTx.status,
        isWithdrawRepayTxDialogOpen,
        isLendBorrowTxDialogOpen,
    ])

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

    // const assetDetails: any = getFormattedAssetDetails(tokenAddress)
    const assetDetailsForTx = getAssetDetails(
        hasSingleToken
            ? tokenDetails[0].address
            : (selectedTokenDetails?.address ?? '')
    )

    const fluidVaultNftId = useMemo(() => {
        return (
            portfolioData?.platforms[0]?.positions?.find(
                (p) =>
                    p.token.address.toLowerCase() ===
                    assetDetailsForTx?.asset?.token?.address?.toLowerCase()
            )?.fluid_vault_nftId ?? 0
        )
    }, [portfolioData?.platforms, assetDetailsForTx?.asset?.token?.address])

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

    const healthFactorValues = getHealthFactorValues(
        hasSingleToken ? tokenDetails[0] : selectedTokenDetails
    )

    function getMaxWithdrawAmountForTx() {
        const isMorphoVaultsProtocol =
            assetDetailsForTx.protocol_type === PlatformType.MORPHO &&
            assetDetailsForTx.isVault
        const isFluidLendProtocol =
            assetDetailsForTx.protocol_type === PlatformType.FLUID &&
            !assetDetailsForTx.isVault

        if (isMorphoVaultsProtocol) {
            const maxToWithdraw = (Number(tokenDetails[0]?.tokenAmount) * 0.999)
            .toFixed(tokenDetails[0]?.decimals)
            .toString() ?? '0'

            return (
                {
                    maxToWithdraw: maxToWithdraw,
                    maxToWithdrawFormatted: maxToWithdraw,
                    maxToWithdrawSCValue: '0',
                    user: {},
                }
            )
        }

        if (isFluidLendProtocol) {
            const maxToWithdraw = Number(tokenDetails[0]?.tokenAmount)
            .toFixed(tokenDetails[0]?.decimals)
            .toString() ?? '0'

            return (
                {
                    maxToWithdraw: maxToWithdraw,
                    maxToWithdrawFormatted: maxToWithdraw,
                    maxToWithdrawSCValue: '0',
                    user: {},
                }
            )
        }

        return (
            maxWithdrawTokensAmount[
                hasSingleToken
                    ? tokenDetails[0].address
                    : (selectedTokenDetails?.address ?? '')
            ] ?? {
                maxToWithdraw: '0',
                maxToWithdrawFormatted: '0',
                maxToWithdrawSCValue: '0',
                user: {},
            }
        )
    }

    function getMaxRepayAmountForTx() {
        const isMorphoVaultsProtocol =
            assetDetailsForTx.protocol_type === PlatformType.MORPHO &&
            assetDetailsForTx.isVault

        const maxToRepay = Number(tokenDetails[0]?.amount)
            .toFixed(tokenDetails[0]?.decimals)
            .toString() ?? '0'

        if (isMorphoVaultsProtocol) {
            return {
                maxToRepay: maxToRepay,
                maxToRepayFormatted: maxToRepay,
                maxToRepaySCValue: '0',
                user: {},
            }
        }

        return (
            maxRepayTokensAmount[
                hasSingleToken
                    ? tokenDetails[0].address
                    : (selectedTokenDetails?.address ?? '')
            ] ?? {
                maxToRepay: '0',
                maxToRepayFormatted: '0',
                maxToRepaySCValue: '0',
                user: {},
            }
        )
    }

    const maxWithdrawAmountForTx = getMaxWithdrawAmountForTx()

    const maxRepayAmountForTx = getMaxRepayAmountForTx()

    const positionAmount = hasSingleToken
        ? tokenDetails[0]?.amount
        : (selectedTokenDetails?.amount ?? 0)

    const withdrawErrorMessage = useMemo(() => {
        if (Number(amount) > Number(maxWithdrawAmountForTx.maxToWithdrawFormatted)) {
            return 'You do not have enough withdraw limit'
        } else if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        } else {
            return null
        }
    }, [amount, maxWithdrawAmountForTx, toManyDecimals])

    const repayErrorMessage = useMemo(() => {
        if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        }
        if (Number(amount) > Number(maxRepayAmountForTx.maxToRepayFormatted)) {
            return 'Amount exceeds available repay limit'
        }
        return null
    }, [hasCollateral, canBorrow, amount, balance, toManyDecimals])

    const errorMessage = useMemo(() => {
        return isWithdrawAction ? withdrawErrorMessage : repayErrorMessage
    }, [positionType, withdrawErrorMessage, repayErrorMessage])

    const disabledButton: boolean = useMemo(
        () =>
        (isWithdrawAction ? (withdrawTx.status === 'view') : (repayTx.status === 'view')) ? false :
            (Number(amount) >
                Number(
                    isWithdrawAction
                        ? maxWithdrawAmountForTx.maxToWithdrawFormatted
                        : maxRepayAmountForTx.maxToRepayFormatted
                ) ||
            Number(amount) <= 0 ||
            toManyDecimals),
        [amount, maxWithdrawAmountForTx, toManyDecimals, isWithdrawAction, withdrawTx.status, repayTx.status]
    )

    const isAaveV3Protocol = platformData?.platform?.protocol_type === 'aaveV3'

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

    // Loading skeleton
    // if (isLoading && isAaveV3Protocol && isPolygonChain) {
    //     return <LoadingSectionSkeleton className="h-[300px] w-full" />
    // }

    // Check if platform is aaveV3 or compoundV2, else return null
    // if (!(isAaveV3Protocol && isPolygonChain)) {
    //     return null
    // }

    const assetDetails = isMorphoProtocol
        ? {
              ...assetDetailsForTx,
              vault: !vaultData ? null : vaultData,
              market: !morphoMarketData ? null : morphoMarketData.marketData,
          }
        : isFluidVaultsProtocol
          ? {
                ...assetDetailsForTx,
                fluid_vault_nftId: fluidVaultNftId,
            }
          : assetDetailsForTx

    function handleSelectAction() {
        setIsSelectTokenDialogOpen(true)
        logEvent(
            isWithdrawAction
                ? 'withdraw_button_clicked'
                : 'repay_button_clicked'
        )
    }

    function handleSelectToken(token: any) {
        // Set selected token details
        setSelectedTokenDetails(token)
        // Close select token dialog
        setIsSelectTokenDialogOpen(false)
        // Open confirmation dialog
        setIsWithdrawRepayTxDialogOpen(true)
        // Log event
        logEvent(
            isWithdrawAction
                ? 'withdraw_token_selected'
                : 'repay_token_selected',
            {
                token_symbol: token.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails.chain_id) as ChainId],
                wallet_address: walletAddress,
            }
        )
    }

    // Render component
    return (
        <section className="withdraw-and-repay-section-wrapper flex flex-col gap-[12px]">
            {/* More than 1 token - Select token dialog */}
            {tokenDetails.length > 1 && (
                <>
                    <Button
                        onClick={handleSelectAction}
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
                        tokens={tokenDetails.map((token) => ({
                            address: token.address,
                            amount: String(token.amount),
                            logo: token.logo,
                            symbol: token.symbol,
                            apy: token.apy,
                            price_usd: String(token.price_usd),
                            decimals: token.decimals,
                        }))}
                        onSelectToken={handleSelectToken}
                        filterByChain={false}
                        showChainBadge={false}
                    />
                </>
            )}
            {/* Single token - Confirmation dialog */}
            {(tokenDetails.length === 1 || isWithdrawRepayTxDialogOpen) && (
                <WithdrawOrRepayTxDialog
                    isOpen={isWithdrawRepayTxDialogOpen}
                    setIsOpen={setIsWithdrawRepayTxDialogOpen}
                    disabled={disabledButton}
                    actionType={actionType}
                    assetDetails={assetDetails}
                    maxWithdrawAmount={maxWithdrawAmountForTx}
                    maxRepayAmount={maxRepayAmountForTx}
                    isLoadingMaxAmount={isLoadingMaxAmount}
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
