'use client'

import { FC, useState, useEffect, useContext, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { TLoopTx, useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
import ImageWithDefault from '@/components/ImageWithDefault'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowRightIcon, ChevronDownIcon, InfinityIcon } from 'lucide-react'
import { LoaderCircle } from 'lucide-react'
import {
    cn,
    abbreviateNumber,
    getLowestDisplayValue,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import {
    ConfirmationDialog,
    getMaxDecimalsToDisplay,
    handleSmallestValue,
} from '@/components/dialogs/TxDialog'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { useAaveV3Data } from '../../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { ChainId } from '@/types/chain'
import { TToken } from '@/types'
import { useIguanaDexData } from '@/hooks/protocols/useIguanaDexData'
import { parseUnits, formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import AAVE_POOL_ABI from '@/data/abi/aaveApproveABI.json'
import { calculateHealthFactorFromBalancesBigUnits, valueToBigNumber, formatReserves, formatUserSummary } from '@aave/math-utils'
import BigNumberJS from 'bignumber.js'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

interface LoopingWidgetProps {
    isLoading?: boolean
    platformData?: any
    portfolioData?: any
}

const LoopingWidget: FC<LoopingWidgetProps> = ({
    isLoading = false,
    platformData,
    portfolioData,
}) => {
    const searchParams = useSearchParams() || new URLSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const [isLoopTxDialogOpen, setIsLoopTxDialogOpen] = useState(false)
    const uiPoolDataProviderAddress =
        '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9'
    const lendingPoolAddressProvider =
        '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec'
    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()
    const [availableLendTokens, setAvailableLendTokens] = useState<TToken[]>([])
    const [availableBorrowTokens, setAvailableBorrowTokens] = useState<
        TToken[]
    >([])
    const [selectedLendToken, setSelectedLendToken] = useState<TToken>(
        availableLendTokens[0]
    )
    const [selectedBorrowToken, setSelectedBorrowToken] = useState<TToken>(
        availableBorrowTokens[0]
    )
    const [lendAmount, setLendAmount] = useState<string>('0')
    const [borrowAmount, setBorrowAmount] = useState<string>('0')
    const [borrowAmountRaw, setBorrowAmountRaw] = useState<string>('0')
    const [isLoadingBorrowAmount, setIsLoadingBorrowAmount] =
        useState<boolean>(false)
    const [leverage, setLeverage] = useState<number>(1)
    const [newHealthFactor, setNewHealthFactor] = useState<number>(0)
    const [flashLoanAmount, setFlashLoanAmount] = useState<string>('0')
    const { getMaxLeverage, getBorrowTokenAmountForLeverage, providerStatus, getUserData, getReservesData } =
        useAaveV3Data()
    const userData = getUserData(Number(chain_id))
    const reservesData = getReservesData(Number(chain_id))
    
    const [netAPY, setNetAPY] = useState<{
        value: string
        isLoading: boolean
    }>({
        value: '',
        isLoading: false,
    })
    
    const [loopNetAPY, setLoopNetAPY] = useState<{
        value: string
        isLoading: boolean
    }>({
        value: '',
        isLoading: false,
    })

    // Helper function to convert ray format to percentage
    const rayToPercentage = (rayValue: string): number => {
        // Ray format has 27 decimals, convert to percentage
        return (Number(rayValue) / Math.pow(10, 27)) * 100
    }

    // Calculate net APY for looping position
    const calculateLoopingNetAPY = () => {
        if (!selectedLendToken || !selectedBorrowToken || !reservesData?.reservesData || leverage <= 1) {
            return '0.00%'
        }

        // Find reserves for selected tokens
        const lendTokenReserve = reservesData.reservesData.find(
            (reserve: any) => reserve.underlyingAsset.toLowerCase() === selectedLendToken.address.toLowerCase()
        )
        
        const borrowTokenReserve = reservesData.reservesData.find(
            (reserve: any) => reserve.underlyingAsset.toLowerCase() === selectedBorrowToken.address.toLowerCase()
        )

        if (!lendTokenReserve || !borrowTokenReserve) {
            return '0.00%'
        }

        // Convert rates from ray format to percentage
        const supplyAPY = rayToPercentage(lendTokenReserve.liquidityRate || '0')
        const borrowAPY = rayToPercentage(borrowTokenReserve.variableBorrowRate || '0')

        // Calculate net APY for looping position
        // Formula: (Supply APY × Leverage) - (Borrow APY × (Leverage - 1))
        const netAPYValue = (supplyAPY * leverage) - (borrowAPY * (leverage - 1))

        // Format to 2 decimal places with % sign
        const formattedValue = Math.abs(netAPYValue) < 0.01 && netAPYValue !== 0
            ? `${netAPYValue >= 0 ? '+' : ''}${netAPYValue < 0.01 ? '<0.01' : netAPYValue.toFixed(2)}%`
            : `${netAPYValue >= 0 ? '+' : ''}${netAPYValue.toFixed(2)}%`
        
        return formattedValue
    }

    // Calculate user's current net APY from existing positions (similar to useAppDataProvider.tsx)
    const calculateUserCurrentNetAPY = () => {
        if (!userData || !reservesData?.reservesData || !walletAddress) {
            return '0.00%'
        }

        try {
            const currentTimestamp = Math.floor(Date.now() / 1000)
            const baseCurrencyData = reservesData.baseCurrencyData
            
            // Format reserves using the same logic as useAppDataProvider
            const formattedPoolReserves = formatReserves({
                reserves: reservesData.reservesData as any,
                currentTimestamp,
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            })

            // Format user summary
            const user = formatUserSummary({
                currentTimestamp,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                userReserves: userData.userReserves,
                formattedReserves: formattedPoolReserves as any,
                userEmodeCategoryId: userData.userEmodeCategoryId,
            })

            // Calculate proportions like in useAppDataProvider
            const proportions = user.userReservesData.reduce(
                (acc: any, value: any) => {
                    const reserve = formattedPoolReserves.find(
                        (r: any) => r.underlyingAsset === value.reserve.underlyingAsset
                    )
                    if (reserve) {
                        // Supply APY calculation
                        if (value.underlyingBalanceUSD !== '0') {
                            acc.positiveProportion = acc.positiveProportion.plus(
                                new BigNumberJS(reserve.supplyAPY).multipliedBy(value.underlyingBalanceUSD)
                            )
                        }
                        
                        // Variable borrow APY calculation
                        if (value.variableBorrowsUSD !== '0') {
                            acc.negativeProportion = acc.negativeProportion.plus(
                                new BigNumberJS(reserve.variableBorrowAPY).multipliedBy(value.variableBorrowsUSD)
                            )
                        }
                        
                        // Stable borrow APY calculation
                        if (value.stableBorrowsUSD !== '0') {
                            acc.negativeProportion = acc.negativeProportion.plus(
                                new BigNumberJS(value.stableBorrowAPY).multipliedBy(value.stableBorrowsUSD)
                            )
                        }
                    }
                    return acc
                },
                { 
                    positiveProportion: new BigNumberJS(0), 
                    negativeProportion: new BigNumberJS(0) 
                }
            )

            // Calculate net APY like in useAppDataProvider
            const earnedAPY = user.totalLiquidityUSD !== '0' 
                ? proportions.positiveProportion.dividedBy(user.totalLiquidityUSD).toNumber()
                : 0
                
            const debtAPY = user.totalBorrowsUSD !== '0'
                ? proportions.negativeProportion.dividedBy(user.totalBorrowsUSD).toNumber()
                : 0

            const netWorthUSD = user.netWorthUSD !== '0' ? user.netWorthUSD : '1'
            const netAPYValue = 
                (earnedAPY || 0) * (Number(user.totalLiquidityUSD) / Number(netWorthUSD)) - 
                (debtAPY || 0) * (Number(user.totalBorrowsUSD) / Number(netWorthUSD))

            // Format the result
            return `${netAPYValue >= 0 ? '+' : ''}${netAPYValue.toFixed(2)}%`
            
        } catch (error) {
            console.error('Error calculating user current net APY:', error)
            return '0.00%'
        }
    }
    const [maxLeverage, setMaxLeverage] = useState<Record<
        string,
        Record<string, number>
    > | null>(null)
    
    // Debug: Log APY calculation details
    // console.log('APY Debug:', {
    //     selectedLendToken: selectedLendToken?.symbol,
    //     selectedBorrowToken: selectedBorrowToken?.symbol,
    //     leverage,
    //     currentNetAPY: netAPY.value,
    //     loopNetAPY: loopNetAPY.value,
    //     hasUserData: !!userData,
    //     hasReservesData: !!reservesData?.reservesData,
    //     walletConnected: !!walletAddress,
    // })
    
    const { loopTx } = useTxContext()
    // Token balances
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingTokensBalanceData,
    } = useUserTokenBalancesContext()

    // Get user positions from portfolio data using protocol identifier
    const userPositions = useMemo(
        () =>
            portfolioData?.platforms.filter(
                (platform: any) =>
                    platform?.protocol_identifier?.toLowerCase() ===
                    (
                        platformData?.platform as any
                    )?.protocol_identifier?.toLowerCase()
            ),
        [portfolioData, platformData]
    )

    // Format user positions
    const [currentHealthFactor] = useMemo(
        () =>
            userPositions?.map((platform: any, index: number) => platform.health_factor),
        [userPositions]
    )

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (
            (loopTx.status === 'view' &&
                loopTx.isConfirmed &&
                !!loopTx.hash
            )
        ) {
            console.log('Refreshing tokens balance data')
            setIsRefreshingTokensBalanceData(true)
        }
    }, [loopTx.status, loopTx.isConfirmed, loopTx.hash])

    useEffect(() => {
        if (!isLoopTxDialogOpen && loopTx.status !== 'approve') {
            setLendAmount('')
            setBorrowAmount('0')
            setBorrowAmountRaw('0')
            setFlashLoanAmount('0')
            setLeverage(1)
            setNewHealthFactor(0)
        }
    }, [isLoopTxDialogOpen])

    // Setup tokens when platform data is available
    useEffect(() => {
        if (platformData?.assets?.length > 0) {
            const lendTokens = platformData.assets
                .filter((asset: any) => true)
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })
            const borrowTokens = platformData.assets
                .filter((asset: any) => asset.borrow_enabled)
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })
            // Select the first token by default
            const defaultLendToken =
                lendTokens.find(
                    (token: TToken) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || lendTokens[0]

            const defaultBorrowToken =
                borrowTokens.find(
                    (token: TToken) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || borrowTokens[0]

            setAvailableLendTokens(lendTokens)
            setAvailableBorrowTokens(borrowTokens)
            setSelectedLendToken(defaultLendToken)
            setSelectedBorrowToken(defaultBorrowToken)
        }
    }, [!!platformData, !!tokenAddress])

    useEffect(() => {
        if (providerStatus.isReady) {
            // Get max leverage
            getMaxLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                lendingPoolAddressProvider: lendingPoolAddressProvider,
            }).then((results) => {
                setMaxLeverage(results as any)
            })

            // Get borrow token amount for leverage
            setIsLoadingBorrowAmount(true)
            getBorrowTokenAmountForLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                lendingPoolAddressProvider: lendingPoolAddressProvider,
                supplyToken: selectedLendToken?.address || '',
                supplyTokenAmount: parseUnits(
                    lendAmount,
                    selectedLendToken?.decimals || 18
                ).toString(),
                leverage: leverage,
                borrowToken: selectedBorrowToken?.address || '',
                _walletAddress: walletAddress,
            })
                .then((result) => {
                    console.log(
                        'Borrow token amount for leverage result',
                        result
                    )
                    setNewHealthFactor(Number(result?.healthFactor ?? 0))
                    setBorrowAmount(result.amountFormatted)
                    setBorrowAmountRaw(result.amount)
                    setFlashLoanAmount(result.flashLoanAmountFormatted ?? '0')
                })
                .finally(() => {
                    setIsLoadingBorrowAmount(false)
                })
        }
    }, [
        providerStatus.isReady,
        selectedLendToken?.address,
        lendAmount,
        selectedBorrowToken?.address,
        leverage,
    ])

    // Calculate user's current net APY whenever relevant parameters change
    useEffect(() => {
        if (walletAddress && userData && reservesData?.reservesData) {
            setNetAPY({
                value: calculateUserCurrentNetAPY(),
                isLoading: false,
            })
        } else if (walletAddress && (!userData || !reservesData?.reservesData)) {
            setNetAPY({
                value: '',
                isLoading: true,
            })
        } else {
            setNetAPY({
                value: '0.00%',
                isLoading: false,
            })
        }
    }, [walletAddress, userData, reservesData])

    // Calculate loop net APY whenever relevant parameters change
    useEffect(() => {
        if (selectedLendToken && selectedBorrowToken && leverage > 1) {
            if (reservesData?.reservesData) {
                setLoopNetAPY({
                    value: calculateLoopingNetAPY(),
                    isLoading: false,
                })
            } else {
                setLoopNetAPY({
                    value: '',
                    isLoading: true,
                })
            }
        } else {
            setLoopNetAPY({
                value: '0.00%',
                isLoading: false,
            })
        }
    }, [selectedLendToken, selectedBorrowToken, reservesData, leverage])

    // Get balance for selected token
    const getTokenBalance = (token: TToken | null) => {
        if (!token || !isWalletConnected) return '0'

        return (
            erc20TokensBalanceData[Number(chain_id)]?.[
                token.address.toLowerCase()
            ]?.balanceFormatted ?? '0'
        ).toString()
    }

    /**
     * Even before all this
     * 1. Extract all the data pipeline to a different hook or function.
     * 2. Update useEffect etc to be dynamic, rn it's hard coded
     * TLDR : Cache the aave data hook based on chain id.
     *
     * Fetching data
     * 1. Get trade path using useIguanaDexData => getTradePath(borrowToken, lendToken, borrowAmount) => swap path token, swap path fees
     * 2. Get flash loan amount using useAaveV3Data
     *
     * Approvals
     * 1. Give approval to looping leverage sc of Lend token for lend amount => refer useIguanaDexData => loopingApproval => Params : SupplyToken, supplyTokenAmount
     * 2. Give approval to looping leverage sc of Credit delegation => refer useIguanaDexData => delegationCallApproval => Params : BorrowToken
     *
     * Call
     * 1. Smart contract call => refer useIguanaDexData => loopingCall => Params : supplyToken, borrowToken, supplyTokenAmount, flashLoanAmount, pathTokens, pathFees
     */

    const selectedLendTokenBalance = getTokenBalance(selectedLendToken)

    // Format health factor for display
    const getHealthFactorDisplay = () => {
        if (newHealthFactor === 0) return 'N/A'
        if (newHealthFactor > 10) return '∞'
        return newHealthFactor.toFixed(2)
    }

    // Get color for health factor
    const getHealthFactorColor = () => {
        if (newHealthFactor < 1) return 'text-red-600'
        if (newHealthFactor === currentHealthFactor) return 'text-gray-800'
        if (newHealthFactor < currentHealthFactor) return 'text-yellow-600'
        if (newHealthFactor > currentHealthFactor) return 'text-green-600'
        return 'text-gray-800'
    }

    // Handle max button click
    const handleMaxClick = () => {
        if (selectedLendToken && Number(selectedLendTokenBalance) > 0) {
            setLendAmount(selectedLendTokenBalance)
        }
    }

    const handleLendTokenSelect = (token: TToken) => {
        setSelectedLendToken(token)
        setLendAmount('')
    }

    const handleBorrowTokenSelect = (token: TToken) => {
        setSelectedBorrowToken(token)
        setBorrowAmount('0.00')
    }
    // Check if button should be disabled
    const diableActionButton =
        !isWalletConnected ||
        !selectedLendToken ||
        !lendAmount ||
        Number(lendAmount) <= 0 ||
        Number(lendAmount) > Number(selectedLendTokenBalance) ||
        isLoadingBorrowAmount

    // looping-widget
    return (
        <section className="looping-widget flex flex-col gap-3">
            <Card className="flex flex-col gap-3 p-4">
                <CardHeader className="p-0 pl-1">
                    <CardTitle className="text-lg font-medium text-gray-800">
                        Create New Loop Position
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {/* Lend Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-2">
                            <Label size="medium">Lend</Label>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Balance:{' '}
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedLendTokenBalance,
                                        selectedLendToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedLendToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-1 px-4 flex items-center gap-3 bg-gray-100">
                            {/* Token Dropdown */}
                            <TokenSelector
                                selectedToken={selectedLendToken}
                                availableTokens={availableLendTokens}
                                handleTokenSelect={handleLendTokenSelect}
                            />

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            {/* Amount Input */}
                            <div className="flex flex-col flex-1 gap-[4px]">
                                <CustomNumberInput
                                    amount={lendAmount}
                                    setAmount={(amount) =>
                                        setLendAmount(amount)
                                    }
                                    maxDecimals={
                                        selectedLendToken?.decimals || 18
                                    }
                                    title={lendAmount}
                                />
                            </div>

                            {/* Max Button */}
                            <Button
                                variant="link"
                                className="uppercase text-[14px] font-medium"
                                onClick={handleMaxClick}
                                disabled={
                                    !isWalletConnected ||
                                    Number(selectedLendTokenBalance) <= 0
                                }
                            >
                                max
                            </Button>
                        </div>
                    </div>

                    {/* Borrow Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-2">
                            <Label size="medium">Borrow</Label>
                            {/* <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Balance:{' '}
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedBorrowTokenBalance,
                                        selectedBorrowToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedBorrowToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText> */}
                        </div>

                        <div className="border rounded-5 border-gray-200 py-2 px-4 flex items-center gap-3 bg-gray-100 max-w-full">
                            {/* Single Token */}
                            {/* <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedLendToken?.logo || ''}
                                    alt={selectedLendToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    {selectedLendToken?.symbol || 'Select token'}
                                </BodyText>
                            </div> */}
                            {/* Token Selector */}
                            <TokenSelector
                                selectedToken={selectedBorrowToken}
                                availableTokens={availableBorrowTokens}
                                handleTokenSelect={handleBorrowTokenSelect}
                            />

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            <div className="flex flex-col flex-1 gap-[4px] truncate">
                                <BodyText
                                    level="custom"
                                    weight="medium"
                                    className={cn(
                                        'text-[24px] cursor-not-allowed hover:text-gray-500 select-none truncate',
                                        borrowAmount === '0.00'
                                            ? 'text-gray-500'
                                            : 'text-gray-800'
                                    )}
                                    title={borrowAmount}
                                >
                                    {isLoadingBorrowAmount ? (
                                        <div className="flex items-center justify-start gap-1 py-2.5">
                                            <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                                            <span
                                                className="font-medium text-gray-600 text-sm"
                                            >
                                                Fetching borrow amount...
                                            </span>
                                        </div>
                                    ) : (
                                        borrowAmount
                                    )}
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Leverage Slider */}
                    <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                            <Label size="medium">Leverage</Label>
                            <Badge variant="secondary">{leverage}x</Badge>
                        </div>

                        <div className="">
                            <Slider
                                value={[leverage]}
                                min={1}
                                max={
                                    Number(
                                        abbreviateNumber(
                                            maxLeverage?.[
                                            selectedLendToken?.address
                                            ]?.[selectedBorrowToken?.address] ??
                                            1,
                                            1
                                        )
                                    ) || 1
                                }
                                step={0.1}
                                onValueChange={(values) =>
                                    setLeverage(values[0])
                                }
                                disabled={
                                    !isWalletConnected ||
                                    Number(lendAmount) <= 0 ||
                                    (maxLeverage?.[
                                        selectedLendToken?.address
                                    ]?.[selectedBorrowToken?.address] ?? 0) <= 1
                                }
                            />
                            <div className="flex justify-between mt-3">
                                <BodyText
                                    level="body3"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    1x
                                </BodyText>
                                <BodyText
                                    level="body3"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    {abbreviateNumber(
                                        maxLeverage?.[
                                        selectedLendToken?.address
                                        ]?.[selectedBorrowToken?.address] ?? 1,
                                        1
                                    )}
                                    x
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Health Factor */}
                    <div className="flex items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5">
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600"
                        >
                            Health Factor
                        </BodyText>
                        {/* <BodyText
                            level="body2"
                            weight="medium"
                            className={cn(
                                'text-gray-800',
                                Number(lendAmount) > 0 && getHealthFactorColor()
                            )}
                        >
                            {getHealthFactorDisplay()}
                        </BodyText> */}
                        <div className="flex flex-col items-end justify-end gap-0">
                            <div className="flex items-center gap-2">
                                {currentHealthFactor &&
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className={`text-gray-800`}
                                    >
                                        {Number(currentHealthFactor) <
                                            0 && (
                                                <InfinityIcon className="w-4 h-4" />
                                            )}
                                        {Number(currentHealthFactor) >=
                                            0 &&
                                            currentHealthFactor.toFixed(
                                                2
                                            )}
                                    </BodyText>}
                                {(!!Number(currentHealthFactor) && !!Number(newHealthFactor) && Number(borrowAmount) > 0 && Number(lendAmount) > 0) &&
                                    <ArrowRightIcon
                                        width={16}
                                        height={16}
                                        className="stroke-gray-800"
                                        strokeWidth={2.5}
                                    />}
                                {(!!Number(currentHealthFactor) && !!Number(newHealthFactor) && Number(borrowAmount) > 0 && Number(lendAmount) > 0) &&
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className={getHealthFactorColor()}
                                    >
                                        {newHealthFactor.toFixed(
                                            2
                                        )}
                                    </BodyText>}
                            </div>
                            <Label size="small" className="text-gray-600">
                                Liquidation at &lt;1.0
                            </Label>
                        </div>
                    </div>

                    {/* Current Net APY */}
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-200 lg:bg-white rounded-5">
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
                                "text-gray-800",
                                netAPY.value && !netAPY.isLoading && (
                                    netAPY.value.startsWith('+') 
                                        ? 'text-green-600' 
                                        : netAPY.value.startsWith('-') 
                                        ? 'text-red-600' 
                                        : 'text-gray-800'
                                )
                            )}
                        >
                            {netAPY.isLoading ? (
                                <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                            ) : (
                                netAPY.value || '0.00%'
                            )}
                        </BodyText>
                    </div>

                    {/* Net APY of Loop */}
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-200 lg:bg-white rounded-5">
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
                                "text-gray-800",
                                loopNetAPY.value && !loopNetAPY.isLoading && (
                                    loopNetAPY.value.startsWith('+') 
                                        ? 'text-green-600' 
                                        : loopNetAPY.value.startsWith('-') 
                                        ? 'text-red-600' 
                                        : 'text-gray-800'
                                )
                            )}
                        >
                            {loopNetAPY.isLoading ? (
                                <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                            ) : (
                                loopNetAPY.value || '0.00%'
                            )}
                        </BodyText>
                    </div>

                    {/* <div className="flex items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5">
                        <div className="flex items-center gap-2">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                borrow in USD
                            </BodyText>
                        </div>
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800"
                        >
                            ${selectedLendToken && lendAmount ? (Number(lendAmount) * selectedLendToken.price_usd * (leverage - 1)).toFixed(2) : '0.00'}
                        </BodyText>
                    </div> */}
                    {/* {(isLoadingTradePath || isLoadingBorrowAmount) &&
                        <div className="flex items-center justify-start gap-2">
                            <LoaderCircle className="animate-spin w-4 h-4 text-secondary-500" />
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isLoadingTradePath && 'Fetching trade path...'}
                                {isLoadingBorrowAmount && 'Fetching borrow amount...'}
                            </BodyText>
                        </div>} */}
                </CardContent>

                <CardFooter className="p-0 pt-2">
                    {!isWalletConnected ? (
                        <ConnectWalletButton />
                    ) : (
                        <ConfirmationDialog
                            disabled={diableActionButton}
                            positionType="loop"
                            loopAssetDetails={{
                                supplyAsset: {
                                    token: selectedLendToken,
                                    borrow_enabled: false,
                                    ltv: 0,
                                    remaining_borrow_cap: 0,
                                    remaining_supply_cap: 0,
                                    stable_borrow_apy: 0,
                                    supply_apy: 0,
                                    variable_borrow_apy: 0,
                                },
                                borrowAsset: {
                                    token: selectedBorrowToken,
                                    borrow_enabled: true,
                                    ltv: 0,
                                    remaining_borrow_cap: 0,
                                    remaining_supply_cap: 0,
                                },
                                // pathTokens, // Fetched in TxDialog
                                // pathFees, // Fetched in TxDialog
                                ...platformData?.platform,
                                netAPY: netAPY.value,
                                loopNetAPY: loopNetAPY.value,
                            }}
                            lendAmount={lendAmount}
                            borrowAmount={borrowAmount}
                            borrowAmountRaw={borrowAmountRaw}
                            flashLoanAmount={flashLoanAmount}
                            balance={selectedLendTokenBalance}
                            maxBorrowAmount={{
                                maxToBorrow: '0',
                                maxToBorrowFormatted: '0',
                                maxToBorrowSCValue: '0',
                                user: {},
                            }}
                            setAmount={setLendAmount}
                            healthFactorValues={{
                                healthFactor: currentHealthFactor,
                                newHealthFactor: Number(borrowAmount) > 0 ? newHealthFactor : null,
                            }}
                            open={isLoopTxDialogOpen}
                            setOpen={setIsLoopTxDialogOpen}
                            leverage={leverage}
                        />
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

function TokenSelector({
    selectedToken,
    availableTokens,
    handleTokenSelect,
}: {
    selectedToken: TToken
    availableTokens: TToken[]
    handleTokenSelect: (token: TToken) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="group flex items-center gap-1 text-gray-800 p-0 h-auto"
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={selectedToken?.logo || ''}
                            alt={selectedToken?.symbol || ''}
                            width={24}
                            height={24}
                            className="rounded-full max-w-[24px] max-h-[24px]"
                        />
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800"
                        >
                            {selectedToken?.symbol || 'Select token'}
                        </BodyText>
                        <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <div className="h-full max-h-[200px] overflow-y-auto">
                    {availableTokens.map((token: TToken) => (
                        <DropdownMenuItem
                            key={token.address}
                            onClick={() => handleTokenSelect(token)}
                            className={cn(
                                'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                                selectedToken?.address === token.address &&
                                'bg-gray-400'
                            )}
                        >
                            <ImageWithDefault
                                src={token.logo || ''}
                                alt={token.symbol || ''}
                                width={24}
                                height={24}
                                className="rounded-full max-w-[24px] max-h-[24px]"
                            />
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {token.symbol || ''}
                            </BodyText>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default LoopingWidget
