'use client'

import React, { useState, useMemo, useEffect, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import FlatTabs from '@/components/tabs/flat-tabs'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import LoopEducationSection from './loop-education-section'
import LoopMetricsCards from './loop-metrics-cards'
import LoopPositionDetails from './loop-position-details'
import LoopPerformance from './loop-performance'
import { abbreviateNumber } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Target, Percent } from 'lucide-react'
import { useAaveV3Data } from '@/hooks/protocols/useAaveV3Data'
import { ChainId } from '@/types/chain'
import { AssetsDataContext } from '@/context/data-provider'
import { TPlatformAsset } from '@/types/platform'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import { useLoopOpportunities } from '@/context/loop-opportunities-provider'
import useGetMidasKpiData from '@/hooks/useGetMidasKpiData'
import { motion } from 'framer-motion'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { BodyText, Label } from '@/components/ui/typography'

export default function LoopPositionOverview() {
    const searchParams = useSearchParams()
    const chain_id = searchParams?.get('chain_id') || '1'
    const protocol_identifier = searchParams?.get('protocol_identifier') || ''
    const lendTokenAddressParam = searchParams?.get('lend_token') || ''
    const borrowTokenAddressParam = searchParams?.get('borrow_token') || ''
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const [activeTab, setActiveTab] = useState('overview')
    const { getMaxLeverage, providerStatus, uiPoolDataProviderAddress, lendingPoolAddressProvider } = useAaveV3Data()
    const [maxLeverage, setMaxLeverage] = useState<number>(0)
    const { allChainsData, allTokensData } = useContext(AssetsDataContext)
    const { hasAppleFarmRewards, appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards } = useAppleFarmRewards()
    const { findLoopOpportunity } = useLoopOpportunities()
    const { mBasisAPY, mTbillAPY } = useGetMidasKpiData()

    // Get loop opportunity data for this specific token pair
    const loopOpportunityData = useMemo(() => {
        return findLoopOpportunity(lendTokenAddressParam, borrowTokenAddressParam, protocol_identifier)
    }, [findLoopOpportunity, lendTokenAddressParam, borrowTokenAddressParam, protocol_identifier])

    const { data: platformData, isLoading: isLoadingPlatformData } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })


    const { data: portfolioData, isLoading: isLoadingPortfolioData } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } = useGetOpportunitiesData({
        type: 'lend',
    })

    // Helper function to find opportunity data for a token
    const findOpportunityData = useMemo(() => (tokenAddress: string) => {
        if (!opportunitiesData?.length) return null
        const foundOpportunity = opportunitiesData.find(item => 
            item.token.address.toLowerCase() === tokenAddress.toLowerCase() &&
            item.chain_id === Number(chain_id) &&
            item.platform.protocol_identifier === protocol_identifier
        )
        
        // Debug logging for Midas tokens
        if (foundOpportunity && (foundOpportunity.token.symbol.toUpperCase() === 'MTBILL' || foundOpportunity.token.symbol.toUpperCase() === 'MBASIS')) {
            console.log(`Found opportunity data for ${foundOpportunity.token.symbol}:`, {
                tokenAddress: foundOpportunity.token.address,
                currentAPY: foundOpportunity.platform.apy.current,
                tokenSymbol: foundOpportunity.token.symbol
            })
        }
        
        return foundOpportunity
    }, [opportunitiesData, chain_id, protocol_identifier])

    // Get token details from platform data
    const lendTokenDetails = useMemo(() => {
        if (!platformData?.assets) return null
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        if (!asset) return null
        
        // Get opportunity data for more accurate APY (includes Midas API updates for MTBILL/MBASIS)
        const opportunityData = findOpportunityData(lendTokenAddressParam)
        
        // Use opportunity data APY if available (this includes Midas API updates), otherwise use platform data
        const baseSupplyAPY = opportunityData ? 
            parseFloat(opportunityData.platform.apy.current) : 
            (asset.supply_apy || 0)
            
        const appleFarmReward = appleFarmRewardsAprs?.[asset.token.address] ?? 0
        const enhancedSupplyAPY = baseSupplyAPY + appleFarmReward
        
        console.log('lendTokenDetails APY calculation:', {
            tokenSymbol: asset.token.symbol,
            platformSupplyAPY: asset.supply_apy,
            opportunityAPY: opportunityData?.platform.apy.current,
            baseSupplyAPY,
            appleFarmReward,
            enhancedSupplyAPY
        })
        
        const totalSupplyUSD = opportunityData ? 
            Number(opportunityData.platform.liquidity) * Number(opportunityData.token.price_usd) : 
            asset.remaining_supply_cap * asset.token.price_usd

        return {
            ...asset.token,
            apy: enhancedSupplyAPY,
            baseApy: baseSupplyAPY, // Keep original for reference
            appleFarmReward: appleFarmReward,
            ltv: asset.ltv, // Loan-to-value ratio
            remaining_supply_cap: asset.remaining_supply_cap, // Available supply capacity
            totalSupply: totalSupplyUSD // Total supply in USD from opportunities data
        }
    }, [platformData, lendTokenAddressParam, appleFarmRewardsAprs, findOpportunityData])

    const borrowTokenDetails = useMemo(() => {
        if (!platformData?.assets) return null
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )
        console.log('borrowTokenDetails', asset)
        // {
        //     "token": {
        //         "name": "Wrapped Ether",
        //         "symbol": "WETH",
        //         "address": "0xfc24f770f94edbca6d6f885e12d4317320bcb401",
        //         "decimals": 18,
        //         "price_usd": 2512.32657984,
        //         "logo": "https://superlend-public-assets.s3.ap-south-1.amazonaws.com/42793-weth.svg"
        //     },
        //     "supply_apy": 0.10986772477370454,
        //     "variable_borrow_apy": 1.1864865027015892,
        //     "stable_borrow_apy": 0,
        //     "borrow_enabled": true,
        //     "remaining_borrow_cap": 4130.895367835915,
        //     "remaining_supply_cap": 4422.910447438019,
        //     "ltv": 77
        // }
        // Get opportunity data for more accurate liquidity and borrow information
        const opportunityData = findOpportunityData(borrowTokenAddressParam)
        const liquidityUSD = opportunityData ? Number(opportunityData.platform.liquidity) * Number(opportunityData.token.price_usd) : 0
        const borrowsUSD = opportunityData ? Number(opportunityData.platform.borrows) * Number(opportunityData.token.price_usd) : 0
        const availableLiquidityUSD = liquidityUSD - borrowsUSD

        return asset ? {
            ...asset.token,
            apy: asset.variable_borrow_apy, // Use variable borrow APY for borrowing
            borrow_enabled: asset.borrow_enabled, // Whether borrowing is enabled for this asset
            remaining_borrow_cap: asset.remaining_borrow_cap, // Available borrow capacity
            totalBorrow: borrowsUSD || asset.remaining_borrow_cap * asset.token.price_usd, // Total borrows in USD from opportunities data
            availableLiquidity: availableLiquidityUSD || asset.remaining_borrow_cap * asset.token.price_usd // Available liquidity for borrowing in USD
        } : null
    }, [platformData, borrowTokenAddressParam, findOpportunityData])

    // Get user positions from portfolio data
    const userPositions = useMemo(() => {
        if (!portfolioData?.platforms || !walletAddress) return []
        return portfolioData.platforms.filter((platform) =>
            platform?.protocol_identifier?.toLowerCase() === protocol_identifier?.toLowerCase()
        )
    }, [portfolioData, protocol_identifier, walletAddress])

    // Feature flag to control multiple positions warning
    const SHOW_MULTIPLE_POSITIONS_WARNING = true

    // Helper function to check if user has multiple positions beyond selected token pair
    const hasMultiplePositions = useMemo(() => {
        if (!userPositions.length) return false
        
        const platform = userPositions[0]
        if (!platform.positions || platform.positions.length <= 2) return false

        // Check if user has positions other than the selected lend/borrow token pair
        const otherPositions = platform.positions.filter(position => {
            const isSelectedLendToken = position.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
            const isSelectedBorrowToken = position.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
            return !isSelectedLendToken && !isSelectedBorrowToken
        })

        return otherPositions.length > 0
    }, [userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    const userLoopPosition = useMemo(() => {
        if (!userPositions.length) return null
        
        console.log('userPositions', userPositions)
        const platform = userPositions[0]
        const lendPosition = platform.positions.find(p => 
            p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        const borrowPosition = platform.positions.find(p => 
            p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )

        console.log('lendPosition', lendPosition)
        console.log('borrowPosition', borrowPosition)

        if (!lendPosition || !borrowPosition) return null

        // Use parseFloat to ensure proper handling of scientific notation and small numbers
        const lendAmount = parseFloat(lendPosition.amount.toString())
        const borrowAmount = parseFloat(borrowPosition.amount.toString())
        const lendPrice = parseFloat(lendPosition.token.price_usd.toString())
        const borrowPrice = parseFloat(borrowPosition.token.price_usd.toString())

        // Calculate USD values with proper precision handling
        const collateralValueUSD = lendAmount * lendPrice
        const borrowValueUSD = borrowAmount * borrowPrice
        const netValue = collateralValueUSD - borrowValueUSD
        
        // Ensure we don't divide by zero or very small numbers that could cause issues
        const leverageDenominator = collateralValueUSD - borrowValueUSD
        const currentLeverage = leverageDenominator > 0.000001 ? collateralValueUSD / leverageDenominator : 1
        const netAPY = (lendPosition.apy * currentLeverage) - (borrowPosition.apy * (currentLeverage - 1))

        // Calculate liquidation price with proper handling of small amounts
        const liquidationThreshold = lendPosition.liquidation_threshold || 80
        // Calculate liquidation price for borrow token (how high it needs to rise for liquidation)
        const liquidationPrice = borrowAmount > 0 ? 
            (lendAmount * lendPrice * (liquidationThreshold / 100)) / borrowAmount : 0

        return {
            netValue: parseFloat(netValue.toFixed(8)), // Maintain precision up to 8 decimal places
            currentLeverage: parseFloat(currentLeverage.toFixed(6)),
            netAPY: parseFloat(netAPY.toFixed(4)),
            collateralAsset: {
                token: lendPosition.token,
                amount: lendAmount,
                amountUSD: parseFloat(collateralValueUSD.toFixed(8)),
                apy: lendPosition.apy,
                baseApy: lendPosition.apy // Store the base APY from portfolio data for apple farm reward calculation
            },
            borrowAsset: {
                token: borrowPosition.token,
                amount: borrowAmount,
                amountUSD: parseFloat(borrowValueUSD.toFixed(8)),
                apy: borrowPosition.apy
            },
            healthFactor: parseFloat(platform.health_factor.toFixed(2)),
            platformNetAPY: parseFloat(platform.net_apy.toFixed(2)), // Net APY from platform data
            hasMultiplePositions: SHOW_MULTIPLE_POSITIONS_WARNING ? hasMultiplePositions : false,
            positionLTV: parseFloat(((borrowValueUSD / collateralValueUSD) * 100).toFixed(4)),
            liquidationLTV: liquidationThreshold,
            liquidationPrice: parseFloat(liquidationPrice.toFixed(8)),
            utilizationRate: parseFloat(((borrowValueUSD / collateralValueUSD) * 100).toFixed(4)),
            totalSupplied: parseFloat(collateralValueUSD.toFixed(8)),
            totalBorrowed: parseFloat(borrowValueUSD.toFixed(8))
        }
    }, [userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    useEffect(() => {
        if (providerStatus.isReady) {
            getMaxLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress: uiPoolDataProviderAddress,
                lendingPoolAddressProvider: lendingPoolAddressProvider,
            }).then((results) => {
                const maxLeverage = (results?.[
                    lendTokenAddressParam.toLowerCase()
                ]?.[borrowTokenAddressParam.toLowerCase()] ?? 0)
                setMaxLeverage(maxLeverage)
            })
        }
    }, [providerStatus, lendTokenAddressParam, borrowTokenAddressParam])

    // Dynamic data for metrics
    const metrics = useMemo(() => {
        const borrowSymbol = borrowTokenDetails?.symbol || 'Unknown'
        const lendSymbol = lendTokenDetails?.symbol || 'Unknown'
        
        // Calculate intrinsic APY for mTBILL and mBASIS
        let intrinsicAPY = 0
        if (lendSymbol?.toLowerCase() === 'mtbill') {
            intrinsicAPY = mTbillAPY || 0
        } else if (lendSymbol?.toLowerCase() === 'mbasis') {
            intrinsicAPY = mBasisAPY || 0
        }
        
        const appleFarmRewardAPY = lendTokenDetails?.appleFarmReward || 0
        const totalSupplyAPY = lendTokenDetails?.apy || 0
        
        // Calculate base APY (reverse calculation for mTBILL/mBASIS)
        const baseSupplyAPY = (lendSymbol?.toLowerCase() === 'mtbill' || lendSymbol?.toLowerCase() === 'mbasis') 
            ? 0 
            : totalSupplyAPY - appleFarmRewardAPY - intrinsicAPY
        
        const baseMetrics = [
            {
                title: 'Liquidity',
                value: borrowTokenDetails?.availableLiquidity ? `$${abbreviateNumber(borrowTokenDetails.availableLiquidity)}` : '$0',
                icon: DollarSign,
                tooltip: `Available ${borrowSymbol} liquidity that can be borrowed for loop positions. This is the total ${borrowSymbol} supplied minus what's already been borrowed by other users.`,
                className: 'text-gray-800'
            },
            {
                title: 'Supply APY',
                value: lendTokenDetails ? `${lendTokenDetails.apy.toFixed(2)}%` : '0.00%',
                icon: Target,
                tooltip: `Current APY earned for supplying ${lendSymbol} as collateral. This rate is applied to your leveraged position.`,
                className: 'text-green-600',
                hasLoopBreakdown: Boolean(loopOpportunityData?.lendReserve?.rewards?.length),
                loopBreakdownTooltip: loopOpportunityData ? getLoopSupplyAPYBreakdownTooltip({
                    lendReserve: loopOpportunityData.lendReserve,
                    tokenSymbol: lendSymbol,
                }) : undefined
            },
            {
                title: 'Total Supply',
                value: lendTokenDetails?.totalSupply ? `$${abbreviateNumber(lendTokenDetails.totalSupply)}` : '$0',
                icon: TrendingUp,
                tooltip: `Total ${lendSymbol} currently supplied to the lending market by all users. Higher supply indicates more market depth and stability.`,
                className: 'text-gray-800'
            },
            {
                title: 'Max Leverage',
                value: `${(maxLeverage || 1).toFixed(2)}x`,
                icon: TrendingUp,
                tooltip: `Maximum leverage multiplier available for ${lendSymbol}/${borrowSymbol} loop positions. Higher leverage amplifies both potential returns and risks.`,
                className: 'text-primary'
            }
        ]

        return baseMetrics
    }, [lendTokenDetails, borrowTokenDetails, maxLeverage, mTbillAPY, mBasisAPY, hasAppleFarmRewards, lendTokenAddressParam, chain_id])

    // Dynamic loop data
    const loopData = useMemo(() => {
        if (userLoopPosition) {
            return {
                ...userLoopPosition,
                maxLeverage: parseFloat((maxLeverage || 4.0).toFixed(2)),
                platform: {
                    name: platformData?.platform?.name || 'Unknown',
                    logo: platformData?.platform?.logo || '',
                    chain_id: Number(chain_id)
                }
            }
        }

        // Check if user has any positions on this platform (even if not the specific token pair)
        const platformHealthFactor = userPositions.length > 0 && userPositions[0].health_factor != null ? parseFloat(userPositions[0].health_factor.toFixed(2)) : parseFloat((0).toFixed(2))
        const platformNetAPYValue = userPositions.length > 0 && userPositions[0].net_apy != null ? parseFloat(userPositions[0].net_apy.toFixed(2)) : 0

        // Fallback data for users without specific token pair positions
        return {
            netValue: parseFloat((0).toFixed(8)),
            currentLeverage: parseFloat((1.0).toFixed(6)),
            netAPY: parseFloat((lendTokenDetails?.apy || 0).toFixed(4)),
            collateralAsset: {
                token: lendTokenDetails || {
                    symbol: 'Unknown',
                    name: 'Unknown',
                    logo: '',
                    address: lendTokenAddressParam,
                    decimals: 18,
                    price_usd: 0
                },
                amount: parseFloat((0).toFixed(8)),
                amountUSD: parseFloat((0).toFixed(8)),
                apy: lendTokenDetails?.apy || 0
            },
            borrowAsset: {
                token: borrowTokenDetails || {
                    symbol: 'Unknown',
                    name: 'Unknown', 
                    logo: '',
                    address: borrowTokenAddressParam,
                    decimals: 18,
                    price_usd: 0
                },
                amount: parseFloat((0).toFixed(8)),
                amountUSD: parseFloat((0).toFixed(8)),
                apy: borrowTokenDetails?.apy || 0
            },
            healthFactor: platformHealthFactor, // Use platform health factor if user has any positions
            platformNetAPY: platformNetAPYValue, // Use platform Net APY if user has any positions
            hasMultiplePositions: SHOW_MULTIPLE_POSITIONS_WARNING ? hasMultiplePositions : false,
            positionLTV: parseFloat((0).toFixed(4)),
            liquidationLTV: 80,
            liquidationPrice: parseFloat((0).toFixed(8)),
            maxLeverage: parseFloat((maxLeverage || 4.0).toFixed(2)),
            utilizationRate: parseFloat((0).toFixed(4)),
            totalSupplied: parseFloat((0).toFixed(8)),
            totalBorrowed: parseFloat((0).toFixed(8)),
            platform: {
                name: platformData?.platform?.name || 'Unknown',
                logo: platformData?.platform?.logo || '',
                chain_id: Number(chain_id)
            }
        }
    }, [userLoopPosition, lendTokenDetails, borrowTokenDetails, maxLeverage, platformData, chain_id, lendTokenAddressParam, borrowTokenAddressParam])

    const isLoading = isLoadingPlatformData || isLoadingPortfolioData || isLoadingAppleFarmRewards || isLoadingOpportunitiesData

    const tabs = [
        {
            label: 'Overview',
            value: 'overview',
            content: (
                <div className="flex flex-col gap-6">
                    <LoopMetricsCards
                        metrics={metrics}
                        isLoading={isLoading}
                    />
                    <LoopEducationSection hasMultiplePositions={SHOW_MULTIPLE_POSITIONS_WARNING ? hasMultiplePositions : false} />
                </div>
            )
        },
        {
            label: 'Position Details',
            value: 'details',
            content: (
                <LoopPositionDetails
                    loopData={loopData}
                    isLoading={isLoading}
                />
            )
        },
        {
            label: 'Performance',
            value: 'performance',
            content: (
                <LoopPerformance
                    loopData={loopData}
                    isLoading={isLoading}
                />
            )
        }
    ]

    if (isLoading) {
        return <LoadingSectionSkeleton className="h-[400px]" />
    }

    return (
        <div className="loop-position-overview">
            <FlatTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </div>
    )
}

/**
 * Get supply APY breakdown tooltip content from loop opportunity API data
 */
function getLoopSupplyAPYBreakdownTooltip({
    lendReserve,
    tokenSymbol,
}: {
    lendReserve: any
    tokenSymbol: string
}) {
    const baseAPY = lendReserve.apy.current - (lendReserve.rewards?.reduce((total: number, reward: any) => total + reward.supply_apy, 0) || 0)
    const totalAPY = lendReserve.apy.current

    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800"
            >
                Supply APY Breakdown
            </BodyText>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <Percent className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Base APY
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    {baseAPY === 0 ? '0.00' : abbreviateNumber(baseAPY, 2)}%
                </BodyText>
            </div>
            {lendReserve.rewards?.map((reward: any, index: number) => {
                const isAppleFarm = reward.asset.symbol === 'APPL' || reward.asset.name.toLowerCase().includes('apple')
                const supplyAPY = reward.supply_apy || 0
                
                if (supplyAPY === 0) return null
                
                return (
                    <div
                        key={`${reward.asset.address}_${index}`}
                        className="flex items-center justify-between gap-[70px] py-2"
                        style={{ gap: '70px' }}
                    >
                        <div className="flex items-center gap-1">
                            {isAppleFarm ? (
                                <ImageWithDefault
                                    src="/images/apple-farm-favicon.ico"
                                    width={14}
                                    height={14}
                                    alt="Apple Farm"
                                    className="inline-block rounded-full object-contain"
                                />
                            ) : reward.asset.name?.toLowerCase().includes('intrinsic') ? (
                                <ImageWithDefault
                                    src="/icons/sparkles.svg"
                                    width={14}
                                    height={14}
                                    alt="Intrinsic APY"
                                    className="inline-block rounded-full object-contain"
                                />
                            ) : (
                                <ImageWithDefault
                                    src={reward.asset.logo}
                                    width={14}
                                    height={14}
                                    alt={reward.asset.name}
                                    className="inline-block rounded-full object-contain"
                                />
                            )}
                            <Label
                                weight="medium"
                                className="truncate text-gray-800 max-w-[100px] truncate"
                                title={reward.asset.name}
                            >
                                {isAppleFarm ? 'Apple Farm APR' : 
                                 reward.asset.name?.toLowerCase().includes('intrinsic') ? 'Intrinsic APY' : 
                                 reward.asset.symbol}
                            </Label>
                        </div>
                        <BodyText
                            level="body3"
                            weight="medium"
                            className="text-gray-800"
                        >
                            + {abbreviateNumber(supplyAPY, 2)}%
                        </BodyText>
                    </div>
                )
            })}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Total APY
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    = {totalAPY === 0 ? '0.00' : abbreviateNumber(totalAPY, 2)}%
                </BodyText>
            </div>
        </div>
    )
} 