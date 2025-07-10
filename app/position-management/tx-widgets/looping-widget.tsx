'use client'

import { FC, useState, useEffect, useContext, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { TLoopTx, useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
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
    convertScientificToNormal,
    formatTokenAmount,
} from '@/lib/utils'
import {
    ConfirmationDialog,
    getMaxDecimalsToDisplay,
    handleSmallestValue,
} from '@/components/dialogs/TxDialog'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useSmartTokenBalancesContext } from '@/context/smart-token-balances-provider'
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
import useGetMidasKpiData from '@/hooks/useGetMidasKpiData'
import { useDebounce } from '@/hooks/useDebounce'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import { TPositionType } from '@/types'

interface LoopingWidgetProps {
    isLoading?: boolean
    platformData?: any
    portfolioData?: any
    loopPair?: any
}

export const LoopingWidget: FC<LoopingWidgetProps> = ({
    isLoading = false,
    platformData,
    portfolioData,
    loopPair,
}) => {
    const searchParams = useSearchParams() || new URLSearchParams()
    const lendTokenAddressParam = searchParams.get('lend_token') || ''
    const borrowTokenAddressParam = searchParams.get('borrow_token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const [isLoopTxDialogOpen, setIsLoopTxDialogOpen] = useState(false)

    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()
    
    const { hasAppleFarmRewards, appleFarmRewardsAprs } = useAppleFarmRewards()
    
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
    const debouncedLeverage = useDebounce(leverage, 1000) // 1 second debounce
    const [isLeverageChanging, setIsLeverageChanging] = useState<boolean>(false)
    const [newHealthFactor, setNewHealthFactor] = useState<number>(0)
    const [flashLoanAmount, setFlashLoanAmount] = useState<string>('0')
    const [positionType, setPositionType] = useState<'increase' | 'decrease'>('increase')
    const { getMaxLeverage, getBorrowTokenAmountForLeverage, providerStatus, getUserData, getReservesData, refreshData, uiPoolDataProviderAddress, lendingPoolAddressProvider } =
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

    useEffect(() => {
        if (!userData || !reservesData) {
            refreshData({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                lendingPoolAddressProvider: lendingPoolAddressProvider,
            })
        }
    }, [userData, reservesData])

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
        const baseSupplyAPY = rayToPercentage(lendTokenReserve.liquidityRate || '0')
        const borrowAPY = rayToPercentage(borrowTokenReserve.variableBorrowRate || '0')

        // Add Midas KPI APY for mTbill and mBasis tokens (these should be leveraged)
        let additionalSupplyAPY = 0
        let additionalBorrowAPY = 0

        // Check lend token for Midas tokens
        if (selectedLendToken?.symbol?.toLowerCase() === 'mtbill') {
            additionalSupplyAPY = mTbillAPY || 0
        } else if (selectedLendToken?.symbol?.toLowerCase() === 'mbasis') {
            additionalSupplyAPY = mBasisAPY || 0
        }

        // Check borrow token for Midas tokens
        if (selectedBorrowToken?.symbol?.toLowerCase() === 'mtbill') {
            additionalBorrowAPY = mTbillAPY || 0
        } else if (selectedBorrowToken?.symbol?.toLowerCase() === 'mbasis') {
            additionalBorrowAPY = mBasisAPY || 0
        }

        // Calculate leveraged net APY without Apple Farm rewards
        // Formula: ((Base Supply APY + Additional Supply APY) × Leverage) - ((Borrow APY + Additional Borrow APY) × (Leverage - 1))
        let netAPYValue = ((baseSupplyAPY + additionalSupplyAPY) * leverage) - ((borrowAPY + additionalBorrowAPY) * (leverage - 1))

        // Add Apple Farm rewards as a flat bonus (not leveraged)
        const isEtherlinkChain = Number(chain_id) === ChainId.Etherlink
        if (isEtherlinkChain && hasAppleFarmRewards(selectedLendToken.address)) {
            const appleFarmAPY = appleFarmRewardsAprs?.[selectedLendToken.address.toLowerCase()] || 0
            netAPYValue += appleFarmAPY
        }

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

            console.log('proportions', proportions.positiveProportion.toString(), proportions.negativeProportion.toString())

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

    const { mBasisAPY, mTbillAPY } = useGetMidasKpiData()

    // Track when leverage is changing vs settled
    useEffect(() => {
        if (leverage !== debouncedLeverage) {
            setIsLeverageChanging(true)
        } else {
            setIsLeverageChanging(false)
        }
    }, [leverage, debouncedLeverage])

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
        addTokensToFetch,
    } = useSmartTokenBalancesContext()

    // Request platform tokens to be fetched when available
    useEffect(() => {
        if (platformData?.assets?.length && chain_id) {
            const platformTokens = platformData.assets.map((asset: any) => ({
                chainId: Number(chain_id),
                tokenAddress: asset.token.address
            }))
            addTokensToFetch(platformTokens)
        }
    }, [platformData, chain_id, addTokensToFetch])

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

    // Get Net APY directly from portfolio data (same as overview page)
    const portfolioNetAPY = useMemo(() => {
        if (userPositions?.length > 0) {
            const platformNetAPY = parseFloat(userPositions[0].net_apy.toFixed(2))
            return `${platformNetAPY >= 0 ? '+' : ''}${platformNetAPY.toFixed(2)}%`
        }
        return '0.00%'
    }, [userPositions])

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

    // Set Available tokens when platform data is available
    useEffect(() => {
        if (platformData?.assets?.length > 0) {
            const lendTokens = platformData.assets
                .filter((asset: any) => {
                    const isTokenOption1 = lendTokenAddressParam.toLowerCase() === asset.token.address.toLowerCase()
                    const isTokenOption2 = borrowTokenAddressParam.toLowerCase() === asset.token.address.toLowerCase()

                    return isTokenOption1 || isTokenOption2
                })
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })
            const borrowTokens = platformData.assets
                .filter((asset: any) => borrowTokenAddressParam.toLowerCase() === asset.token.address.toLowerCase())
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })

            setAvailableLendTokens(lendTokens)
            setAvailableBorrowTokens(borrowTokens)
        }
    }, [!!platformData, !!lendTokenAddressParam.length, !!borrowTokenAddressParam.length])

    useEffect(() => {
        const [defaultLendToken] = availableLendTokens.filter((token: any) => {
            const isLendToken = lendTokenAddressParam.toLowerCase() === token.address.toLowerCase()
            return isLendToken;
        })
        const defaultBorrowToken = availableBorrowTokens[0]

        setSelectedLendToken(defaultLendToken)
        setSelectedBorrowToken(defaultBorrowToken)
    }, [!!availableLendTokens.length, !!availableBorrowTokens.length])

    useEffect(() => {
        if (providerStatus.isReady) {
            // If we have loop pair data, use its max leverage
            if (loopPair?.strategy?.max_leverage) {
                setMaxLeverage({
                    [selectedLendToken?.address]: {
                        [selectedBorrowToken?.address]: loopPair.strategy.max_leverage
                    }
                });
            } else {
                // Fallback to fetching max leverage
                getMaxLeverage({
                    chainId: ChainId.Etherlink,
                    uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                    lendingPoolAddressProvider: lendingPoolAddressProvider,
                }).then((results) => {
                    setMaxLeverage(results as any)
                })
            }

            if (!!Number(lendAmount)) {
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
                    leverage: debouncedLeverage,
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
            return
        }

        // Reset values, if provider is not ready or no Lend Amount found
        setNewHealthFactor(0)
        setBorrowAmount('0')
        setBorrowAmountRaw('0')
        setFlashLoanAmount('0')
    }, [
        providerStatus.isReady,
        selectedLendToken?.address,
        lendAmount,
        selectedBorrowToken?.address,
        debouncedLeverage,
        loopPair
    ])

    // Calculate user's current net APY whenever relevant parameters change
    useEffect(() => {
        if (walletAddress && userData && reservesData?.reservesData) {
            setNetAPY({
                value: calculateUserCurrentNetAPY(),
                isLoading: false,
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

    const handTokenSwap = (token: TToken) => {
        const newBorrowToken = availableLendTokens.find((lendToken: any) => {
            return lendToken.address !== token.address
        })
        // If borrow token replacement found, then update lend token
        if (newBorrowToken) {
            handleBorrowTokenSelect(newBorrowToken)
            handleLendTokenSelect(token)
            return;
        }
        return;
    }

    const handleLendTokenSelect = (token: TToken) => {
        setSelectedLendToken(token)
        setLendAmount('')
    }

    const handleBorrowTokenSelect = (token: TToken) => {
        setSelectedBorrowToken(token)
        setBorrowAmount('0')
    }

    // Check if user has an existing loop position
    const hasLoopPosition = useMemo(() => {
        if (!userPositions?.length) return false
        
        // Look for looped platforms that match the current token pair
        const loopedPlatforms = userPositions.filter((platform: any) => 
            platform.name.toLowerCase().includes('looped') || 
            platform.platform_name.toLowerCase().includes('loop')
        )
        
        if (!loopedPlatforms.length) return false
        
        // Check if any looped platform has the specific token pair we're looking for
        return loopedPlatforms.some((platform: any) => {
            const lendPosition = platform.positions.find((p: any) => 
                p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
            )
            const borrowPosition = platform.positions.find((p: any) => 
                p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
            )
            
            return lendPosition && borrowPosition
        })
    }, [userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    // Update leverage slider disabled state to allow leverage changes for position adjustments
    const isLeverageDisabled = !isWalletConnected ||
        (!hasLoopPosition && !Number(lendAmount)) || // Simplified condition
        (maxLeverage?.[selectedLendToken?.address]?.[selectedBorrowToken?.address] ?? 0) <= 1

    const isDisabledMaxButton = !isWalletConnected || Number(selectedLendTokenBalance) <= 0

    // Check if button should be disabled
    const diableActionButton =
        !isWalletConnected ||
        !selectedLendToken ||
        (!lendAmount || Number(lendAmount) <= 0) && !hasLoopPosition || // Allow 0 amount for position changes
        Number(lendAmount) > Number(selectedLendTokenBalance) ||
        isLoadingBorrowAmount ||
        isLeverageChanging

    function handleLendAmountChange(amount: string = '') {
        if (!amount.length || !Number(amount)) {
            // Don't reset leverage to 1 if user has a position - they can adjust leverage without amount
            if (!hasLoopPosition) {
                setLeverage(1)
            }
        }
        setLendAmount(amount)
    }

    // Function to handle close position
    const handleClosePosition = () => {
        // TODO: Implement close position logic when API is ready
        console.log('Close position clicked - to be implemented')
    }

    // Get current position data from loop pair
    const getCurrentPositionData = () => {
        if (!hasLoopPosition || !userPositions?.length) return null

        // Find the specific looped platform with the matching token pair
        const loopedPlatforms = userPositions.filter((platform: any) => 
            platform.name.toLowerCase().includes('looped') || 
            platform.platform_name.toLowerCase().includes('loop')
        )
        
        const matchingPlatform = loopedPlatforms.find((platform: any) => {
            const lendPosition = platform.positions.find((p: any) => 
                p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
            )
            const borrowPosition = platform.positions.find((p: any) => 
                p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
            )
            
            return lendPosition && borrowPosition
        })

        if (!matchingPlatform) return null

        const lendPosition = matchingPlatform.positions.find((p: any) => 
            p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        const borrowPosition = matchingPlatform.positions.find((p: any) => 
            p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )

        if (!lendPosition || !borrowPosition) return null

        const lendAmount = parseFloat(lendPosition.amount.toString())
        const borrowAmount = parseFloat(borrowPosition.amount.toString())
        const collateralValueUSD = lendAmount * lendPosition.token.price_usd
        const borrowValueUSD = borrowAmount * borrowPosition.token.price_usd
        const currentLeverage = collateralValueUSD > 0 ? collateralValueUSD / (collateralValueUSD - borrowValueUSD) : 1

        return {
            lendAmount,
            borrowAmount,
            collateralValueUSD,
            borrowValueUSD,
            currentLeverage,
            healthFactor: matchingPlatform.health_factor,
            currentAPY: matchingPlatform.net_apy
        }
    }

    // Memoize current position data to avoid unnecessary re-renders and keep a
    // stable reference while the user is interacting with the slider. Without
    // this, the object reference would change on every render, causing the
    // `useEffect` that initialises leverage to fire again and reset the value
    // back to the current position leverage.
    const currentPositionData = useMemo(() => {
        return getCurrentPositionData()
    // Depend only on values that can truly change the underlying data.
    }, [hasLoopPosition, userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    // Calculate new position data based on changes
    const calculateNewPositionData = () => {
        if (!currentPositionData) return null

        const additionalLendAmount = Number(lendAmount) || 0
        const additionalBorrowAmount = Number(borrowAmount) || 0
        
        if (positionType === 'increase') {
            return {
                lendAmount: currentPositionData.lendAmount + additionalLendAmount,
                borrowAmount: currentPositionData.borrowAmount + additionalBorrowAmount,
                collateralValueUSD: currentPositionData.collateralValueUSD + (additionalLendAmount * (selectedLendToken?.price_usd || 0)),
                borrowValueUSD: currentPositionData.borrowValueUSD + (additionalBorrowAmount * (selectedBorrowToken?.price_usd || 0)),
                leverage: leverage,
                healthFactor: newHealthFactor || currentPositionData.healthFactor,
                estimatedAPY: loopNetAPY.value || '0.00%'
            }
        } else {
            return {
                lendAmount: Math.max(0, currentPositionData.lendAmount - additionalLendAmount),
                borrowAmount: Math.max(0, currentPositionData.borrowAmount - additionalBorrowAmount),
                collateralValueUSD: Math.max(0, currentPositionData.collateralValueUSD - (additionalLendAmount * (selectedLendToken?.price_usd || 0))),
                borrowValueUSD: Math.max(0, currentPositionData.borrowValueUSD - (additionalBorrowAmount * (selectedBorrowToken?.price_usd || 0))),
                leverage: leverage,
                healthFactor: newHealthFactor || currentPositionData.healthFactor,
                estimatedAPY: loopNetAPY.value || '0.00%'
            }
        }
    }

    const newPositionData = calculateNewPositionData()

    // Initialise leverage only once per position load (or when the underlying
    // current leverage actually changes). Using the memoised
    // `currentPositionData.currentLeverage` as dependency prevents the slider
    // from being reset while dragging.
    useEffect(() => {
        if (hasLoopPosition && currentPositionData) {
            setLeverage(Math.round(currentPositionData.currentLeverage * 10) / 10)
        }
    }, [hasLoopPosition, currentPositionData?.currentLeverage])

    // looping-widget
    return (
        <section className="looping-widget flex flex-col gap-3">
            {/* Toggle Tabs - only show when user has a position */}
            {hasLoopPosition && (
                <ToggleTab
                    type={positionType === 'increase' ? 'tab1' : 'tab2'}
                    handleToggle={(type: TTypeToMatch) => {
                        if (type === 'tab1') {
                            setPositionType('increase')
                        } else {
                            setPositionType('decrease')
                        }
                        setLendAmount('')
                        setBorrowAmount('0')
                        setLeverage(currentPositionData?.currentLeverage || 1)
                    }}
                    showTab={{
                        tab1: true,
                        tab2: true,
                        tab3: false,
                    }}
                    title={{
                        tab1: 'Increase Position',
                        tab2: 'Decrease Position',
                    }}
                />
            )}

            <Card className="flex flex-col gap-3 p-4">
                <CardContent className="p-0 space-y-4">
                    {/* Lend Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-2">
                            <Label size="medium">
                                {hasLoopPosition ? 
                                    (positionType === 'increase' ? 'Add Collateral' : 'Remove Collateral') : 
                                    'Lend'
                                }
                            </Label>
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
                                handleTokenSelect={handTokenSwap}
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
                                    setAmount={handleLendAmountChange}
                                    maxDecimals={
                                        selectedLendToken?.decimals || 18
                                    }
                                    title={lendAmount}
                                    placeholder={hasLoopPosition ? "0" : "0"}
                                />
                            </div>

                            <Button
                                variant="link"
                                className="uppercase text-[14px] font-medium"
                                onClick={handleMaxClick}
                                disabled={isDisabledMaxButton}
                            >
                                max
                            </Button>
                        </div>
                        
                        {hasLoopPosition && (
                            <BodyText level="body3" className="text-gray-500 px-2">
                                Leave empty to adjust leverage only
                            </BodyText>
                        )}
                    </div>

                    {/* Borrow Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2 mb-1 px-2">
                            <Label size="medium">
                                {hasLoopPosition ? 
                                    (positionType === 'increase' ? 'Additional Borrow' : 'Repay Amount') : 
                                    'Borrow'
                                }
                            </Label>
                            <Badge variant={'gray'} className='text-gray-600 rounded-4 px-2'>Read only</Badge>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-2 px-4 flex items-center gap-3 bg-gray-100 max-w-full">
                            {/* Single Token */}
                            <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedBorrowToken?.logo || ''}
                                    alt={selectedBorrowToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    {selectedBorrowToken?.symbol || 'Select token'}
                                </BodyText>
                            </div>

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            <div className="flex flex-col flex-1 gap-[4px] truncate">
                                {isLoadingBorrowAmount ? (
                                    <div className="flex items-center justify-start gap-1 py-2">
                                        <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                                        <span
                                            className="font-medium text-gray-600 text-sm"
                                        >
                                            Fetching amount...
                                        </span>
                                    </div>
                                ) : (
                                    <InfoTooltip
                                        classNameLabel="truncate max-w-full"
                                        label={
                                            <BodyText
                                                level="custom"
                                                weight="medium"
                                                className={cn(
                                                    'text-[24px] cursor-not-allowed hover:text-gray-500 select-none truncate',
                                                    !Number(borrowAmount)
                                                        ? 'text-gray-500'
                                                        : 'text-gray-800'
                                                )}
                                            >
                                                {borrowAmount}
                                            </BodyText>
                                        }
                                        content={
                                            <BodyText level="body1" weight='medium' className='p-0'>
                                                {borrowAmount}
                                            </BodyText>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leverage Slider */}
                    <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                            <Label size="medium">
                                {hasLoopPosition ? 'Target Leverage' : 'Leverage'}
                            </Label>
                            <Badge variant="secondary">{leverage}x</Badge>
                        </div>

                        <div>
                            <Slider
                                title={!isWalletConnected ? 'Connect wallet to enable leverage.' : ''}
                                value={[leverage]}
                                min={1}
                                max={
                                    hasLoopPosition && currentPositionData
                                        ? Math.max(currentPositionData.currentLeverage * 2, 4)
                                        : Number(
                                            maxLeverage?.[selectedLendToken?.address]?.[selectedBorrowToken?.address] ?? 4
                                          )
                                }
                                step={0.1}
                                onValueChange={(values) => {
                                    const newValue = values[0]
                                    if (typeof newValue === 'number' && !isNaN(newValue)) {
                                        setLeverage(newValue)
                                    }
                                }}
                                disabled={!isWalletConnected}
                                className="cursor-pointer"
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
                                    {hasLoopPosition && currentPositionData
                                        ? Math.max(currentPositionData.currentLeverage * 2, 4).toFixed(1)
                                        : Number(
                                            maxLeverage?.[selectedLendToken?.address]?.[selectedBorrowToken?.address] ?? 4
                                          ).toFixed(1)
                                    }x
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Current Position Overview - Show when user has a position */}
                    {hasLoopPosition && currentPositionData && (
                        <div className="p-4 bg-blue-50 rounded-5 border border-blue-200 mb-4">
                            <div className="flex flex-col gap-3">
                                <BodyText level="body2" weight="medium" className="text-blue-800">
                                    Current Loop Position
                                </BodyText>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <BodyText level="body3" className="text-blue-600">
                                            Collateral
                                        </BodyText>
                                        <BodyText level="body2" weight="medium" className="text-blue-800">
                                            {formatTokenAmount(currentPositionData.lendAmount)} {selectedLendToken?.symbol}
                                        </BodyText>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <BodyText level="body3" className="text-blue-600">
                                            Borrowed
                                        </BodyText>
                                        <BodyText level="body2" weight="medium" className="text-blue-800">
                                            {formatTokenAmount(currentPositionData.borrowAmount)} {selectedBorrowToken?.symbol}
                                        </BodyText>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <BodyText level="body3" className="text-blue-600">
                                            Leverage
                                        </BodyText>
                                        <BodyText level="body2" weight="medium" className="text-blue-800">
                                            {currentPositionData.currentLeverage.toFixed(2)}x
                                        </BodyText>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <BodyText level="body3" className="text-blue-600">
                                            Health Factor
                                        </BodyText>
                                        <BodyText level="body2" weight="medium" className="text-blue-800">
                                            {currentPositionData.healthFactor.toFixed(2)}
                                        </BodyText>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Position Changes Preview - Show when user has a position */}
                    {hasLoopPosition && currentPositionData && newPositionData && (Number(lendAmount) > 0 || leverage !== currentPositionData.currentLeverage) && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-5 border border-gray-200 mb-4">
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
                                        {formatTokenAmount(currentPositionData.lendAmount)} {selectedLendToken?.symbol}
                                    </BodyText>
                                    <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                    <BodyText level="body3" className="text-gray-800">
                                        {formatTokenAmount(newPositionData.lendAmount)} {selectedLendToken?.symbol}
                                    </BodyText>
                                </div>
                            </div>

                            {/* Borrowed Change */}
                            <div className="flex items-center justify-between">
                                <BodyText level="body3" className="text-gray-600">
                                    Total Borrowed
                                </BodyText>
                                <div className="flex items-center gap-2">
                                    <BodyText level="body3" className="text-gray-800">
                                        {formatTokenAmount(currentPositionData.borrowAmount)} {selectedBorrowToken?.symbol}
                                    </BodyText>
                                    <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                    <BodyText level="body3" className="text-gray-800">
                                        {formatTokenAmount(newPositionData.borrowAmount)} {selectedBorrowToken?.symbol}
                                    </BodyText>
                                </div>
                            </div>

                            {/* Leverage Change */}
                            <div className="flex items-center justify-between">
                                <BodyText level="body3" className="text-gray-600">
                                    Leverage
                                </BodyText>
                                <div className="flex items-center gap-2">
                                    <BodyText level="body3" className="text-gray-800">
                                        {currentPositionData.currentLeverage.toFixed(2)}x
                                    </BodyText>
                                    <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                    <BodyText level="body3" className="text-gray-800">
                                        {newPositionData.leverage.toFixed(2)}x
                                    </BodyText>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Health Factor & APY Card */}
                <Card className="p-4 bg-white bg-opacity-60 mb-4">
                    <div className="flex flex-col gap-4">
                        {/* Health Factor */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Health Factor
                                </BodyText>
                                <InfoTooltip content="A numeric representation of position safety. Below 1.0 triggers liquidation." />
                            </div>
                            <div className="flex items-center gap-2">
                                {hasLoopPosition && currentPositionData && (
                                    <>
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            {currentPositionData.healthFactor.toFixed(2)}
                                        </BodyText>
                                        {(Number(lendAmount) > 0 || leverage !== currentPositionData.currentLeverage) && newHealthFactor > 0 && (
                                            <>
                                                <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                                <BodyText level="body2" weight="medium" className={getHealthFactorColor()}>
                                                    {newHealthFactor.toFixed(2)}
                                                </BodyText>
                                            </>
                                        )}
                                    </>
                                )}
                                {!hasLoopPosition && (
                                    <BodyText level="body2" weight="medium" className={getHealthFactorColor()}>
                                        {getHealthFactorDisplay()}
                                    </BodyText>
                                )}
                            </div>
                        </div>

                        {/* Net APY */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Net APY
                                </BodyText>
                                <InfoTooltip content="Projected Net APY for the loop position after changes" />
                            </div>
                            <div className="flex items-center gap-2">
                                {hasLoopPosition && currentPositionData && (
                                    <>
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            {currentPositionData.currentAPY >= 0 ? '+' : ''}{currentPositionData.currentAPY.toFixed(2)}%
                                        </BodyText>
                                        {(Number(lendAmount) > 0 || leverage !== currentPositionData.currentLeverage) && loopNetAPY.value !== '0.00%' && (
                                            <>
                                                <ArrowRightIcon width={16} height={16} className="stroke-gray-600" />
                                                <BodyText 
                                                    level="body2" 
                                                    weight="medium" 
                                                    className={cn(
                                                        loopNetAPY.value.startsWith('+') ? 'text-green-600' : 
                                                        loopNetAPY.value.startsWith('-') ? 'text-red-600' : 'text-gray-800'
                                                    )}
                                                >
                                                    {loopNetAPY.value}
                                                </BodyText>
                                            </>
                                        )}
                                    </>
                                )}
                                {!hasLoopPosition && (
                                    <BodyText 
                                        level="body2" 
                                        weight="medium" 
                                        className={cn(
                                            loopNetAPY.value.startsWith('+') ? 'text-green-600' : 
                                            loopNetAPY.value.startsWith('-') ? 'text-red-600' : 'text-gray-800'
                                        )}
                                    >
                                        {loopNetAPY.isLoading ? (
                                            <LoaderCircle className="animate-spin w-4 h-4 text-primary" />
                                        ) : (
                                            loopNetAPY.value || '0.00%'
                                        )}
                                    </BodyText>
                                )}
                            </div>
                        </div>

                        <BodyText level="body3" className="text-gray-600">
                            Liquidation at Health Factor &lt;1.0
                        </BodyText>
                    </div>
                </Card>

                <CardFooter className="p-0 pt-2 flex flex-col gap-2">
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
                                    emode_category: loopPair?.lendReserve?.emode_category || 0,
                                },
                                borrowAsset: {
                                    token: selectedBorrowToken,
                                    borrow_enabled: true,
                                    ltv: 0,
                                    remaining_borrow_cap: 0,
                                    remaining_supply_cap: 0,
                                    emode_category: loopPair?.borrowReserve?.emode_category || 0,
                                },
                                pathTokens: [],
                                pathFees: [],
                                ...platformData?.platform,
                                netAPY: hasLoopPosition ? `${currentPositionData?.currentAPY.toFixed(2)}%` : '0.00%',
                                loopNetAPY: loopNetAPY.value,
                                lendReserve: loopPair?.lendReserve,
                                borrowReserve: loopPair?.borrowReserve,
                                strategy: loopPair?.strategy,
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
                                healthFactor: hasLoopPosition ? currentPositionData?.healthFactor : 0,
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