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
import { abbreviateNumber, roundLeverageUp } from '@/lib/utils'
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

interface LoopPositionOverviewProps {
    loopPair?: any
}

export default function LoopPositionOverview({ loopPair }: LoopPositionOverviewProps) {
    const searchParams = useSearchParams()
    const chain_id = searchParams?.get('chain_id') || '1'
    const protocol_identifier = searchParams?.get('protocol_identifier') || ''
    const lendTokenAddressParam = searchParams?.get('lend_token') || ''
    const borrowTokenAddressParam = searchParams?.get('borrow_token') || ''
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const [activeTab, setActiveTab] = useState('overview')
    const { providerStatus, uiPoolDataProviderAddress, lendingPoolAddressProvider } = useAaveV3Data()
    const { allChainsData, allTokensData } = useContext(AssetsDataContext)
    const { hasAppleFarmRewards, appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards } = useAppleFarmRewards()
    const { findLoopOpportunity } = useLoopOpportunities()
    const { mBasisAPY, mTbillAPY } = useGetMidasKpiData()

    const loopOpportunityData = useMemo(() => {
        if (loopPair) {
            return loopPair;
        }
        return findLoopOpportunity(lendTokenAddressParam, borrowTokenAddressParam, protocol_identifier)
    }, [loopPair, findLoopOpportunity, lendTokenAddressParam, borrowTokenAddressParam, protocol_identifier])

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

    const findOpportunityData = useMemo(() => (tokenAddress: string) => {
        if (!opportunitiesData?.length) return null
        const foundOpportunity = opportunitiesData.find(item => 
            item.token.address.toLowerCase() === tokenAddress.toLowerCase() &&
            item.chain_id === Number(chain_id) &&
            item.platform.protocol_identifier === protocol_identifier
        )
        
        return foundOpportunity
    }, [opportunitiesData, chain_id, protocol_identifier])

    const lendTokenDetails = useMemo(() => {
        if (loopPair?.lendReserve) {
            const asset = loopPair.lendReserve;
            const appleFarmReward = appleFarmRewardsAprs?.[asset.token.address] ?? 0;
            const baseSupplyAPY = asset.apy.current;
            const enhancedSupplyAPY = baseSupplyAPY + appleFarmReward;

            return {
                ...asset.token,
                apy: enhancedSupplyAPY,
                baseApy: baseSupplyAPY,
                appleFarmReward: appleFarmReward,
                ltv: asset.max_ltv,
                remaining_supply_cap: asset.remaining_supply_cap,
                totalSupply: Number(asset.liquidity) * asset.token.price_usd
            };
        }

        if (!platformData?.assets) return null;
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        if (!asset) return null
        
        const opportunityData = findOpportunityData(lendTokenAddressParam)
        
        const baseSupplyAPY = opportunityData ? 
            parseFloat(opportunityData.platform.apy.current) : 
            (asset.supply_apy || 0)
            
        const appleFarmReward = appleFarmRewardsAprs?.[asset.token.address] ?? 0
        const enhancedSupplyAPY = baseSupplyAPY + appleFarmReward
        
        const totalSupplyUSD = opportunityData ? 
            Number(opportunityData.platform.liquidity) * Number(opportunityData.token.price_usd) : 
            asset.remaining_supply_cap * asset.token.price_usd

        return {
            ...asset.token,
            apy: enhancedSupplyAPY,
            baseApy: baseSupplyAPY,
            appleFarmReward: appleFarmReward,
            ltv: asset.ltv,
            remaining_supply_cap: asset.remaining_supply_cap,
            totalSupply: totalSupplyUSD
        }
    }, [platformData, lendTokenAddressParam, appleFarmRewardsAprs, findOpportunityData])

    const borrowTokenDetails = useMemo(() => {
        if (loopPair?.borrowReserve) {
            const asset = loopPair.borrowReserve;
            const liquidityUSD = Number(asset.liquidity) * asset.token.price_usd;
            const borrowsUSD = Number(asset.borrows) * asset.token.price_usd;
            const availableLiquidityUSD = liquidityUSD - borrowsUSD;

            return {
                ...asset.token,
                apy: asset.variable_borrow_rate,
                borrow_enabled: true,
                remaining_borrow_cap: asset.remaining_borrow_cap,
                totalBorrow: borrowsUSD,
                availableLiquidity: availableLiquidityUSD
            };
        }

        if (!platformData?.assets) return null;
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )
        
        const opportunityData = findOpportunityData(borrowTokenAddressParam)
        const liquidityUSD = opportunityData ? Number(opportunityData.platform.liquidity) * Number(opportunityData.token.price_usd) : 0
        const borrowsUSD = opportunityData ? Number(opportunityData.platform.borrows) * Number(opportunityData.token.price_usd) : 0
        const availableLiquidityUSD = liquidityUSD - borrowsUSD

        return asset ? {
            ...asset.token,
            apy: asset.variable_borrow_apy,
            borrow_enabled: asset.borrow_enabled,
            remaining_borrow_cap: asset.remaining_borrow_cap,
            totalBorrow: borrowsUSD || asset.remaining_borrow_cap * asset.token.price_usd,
            availableLiquidity: availableLiquidityUSD || asset.remaining_borrow_cap * asset.token.price_usd
        } : null
    }, [platformData, borrowTokenAddressParam, findOpportunityData])

    const userPositions = useMemo(() => {
        if (!portfolioData?.platforms || !walletAddress) return []
        
        return portfolioData.platforms.filter((platform) => {
            const isLoopPlatform = platform.name.toLowerCase().includes('looped') || 
                                   platform.platform_name.toLowerCase().includes('loop')
            const matchesProtocol = platform?.protocol_identifier?.toLowerCase() === protocol_identifier?.toLowerCase()
            
            return isLoopPlatform && matchesProtocol
        })
    }, [portfolioData, protocol_identifier, walletAddress])

    const SHOW_MULTIPLE_POSITIONS_WARNING = true

    const hasMultiplePositions = useMemo(() => {
        if (!userPositions.length) return false
        
        const platform = userPositions[0]
        if (!platform.positions || platform.positions.length <= 2) return false

        const otherPositions = platform.positions.filter(position => {
            const isSelectedLendToken = position.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
            const isSelectedBorrowToken = position.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
            return !isSelectedLendToken && !isSelectedBorrowToken
        })

        return otherPositions.length > 0
    }, [userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    const userLoopPosition = useMemo(() => {
        if (!userPositions.length) return null
        
        const matchingPlatform = userPositions.find(platform => {
            const lendPosition = platform.positions.find(p => 
                p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
            )
            const borrowPosition = platform.positions.find(p => 
                p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
            )
            
            return lendPosition && borrowPosition
        })
        
        if (!matchingPlatform) return null
        
        const lendPosition = matchingPlatform.positions.find(p => 
            p.type === 'lend' && p.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        const borrowPosition = matchingPlatform.positions.find(p => 
            p.type === 'borrow' && p.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )

        if (!lendPosition || !borrowPosition) return null

        const lendAmount = parseFloat(lendPosition.amount.toString())
        const borrowAmount = parseFloat(borrowPosition.amount.toString())
        const lendPrice = parseFloat(lendPosition.token.price_usd.toString())
        const borrowPrice = parseFloat(borrowPosition.token.price_usd.toString())

        const collateralValueUSD = lendAmount * lendPrice
        const borrowValueUSD = borrowAmount * borrowPrice
        const netValue = collateralValueUSD - borrowValueUSD
        
        const leverageDenominator = collateralValueUSD - borrowValueUSD
        const currentLeverage = roundLeverageUp(leverageDenominator > 0.000001 ? collateralValueUSD / leverageDenominator : 1)
        const netAPY = (lendPosition.apy * currentLeverage) - (borrowPosition.apy * (currentLeverage - 1))

        const liquidationThreshold = lendPosition.liquidation_threshold || 80
        const liquidationPrice = borrowAmount > 0 ? 
            (lendAmount * lendPrice * (liquidationThreshold / 100)) / borrowAmount : 0

        return {
            netValue: parseFloat(netValue.toFixed(8)),
            currentLeverage: parseFloat(currentLeverage.toFixed(1)),
            netAPY: parseFloat(netAPY.toFixed(4)),
            collateralAsset: {
                token: lendPosition.token,
                amount: lendAmount,
                amountUSD: parseFloat(collateralValueUSD.toFixed(8)),
                apy: lendPosition.apy,
                baseApy: lendPosition.apy
            },
            borrowAsset: {
                token: borrowPosition.token,
                amount: borrowAmount,
                amountUSD: parseFloat(borrowValueUSD.toFixed(8)),
                apy: borrowPosition.apy
            },
            healthFactor: parseFloat(matchingPlatform.health_factor.toFixed(2)),
            platformNetAPY: parseFloat(matchingPlatform.net_apy.toFixed(2)), 
            hasMultiplePositions: SHOW_MULTIPLE_POSITIONS_WARNING ? hasMultiplePositions : false,
            positionLTV: parseFloat(((borrowValueUSD / collateralValueUSD) * 100).toFixed(4)),
            liquidationLTV: liquidationThreshold,
            liquidationPrice: parseFloat(liquidationPrice.toFixed(8)),
            utilizationRate: parseFloat(((borrowValueUSD / collateralValueUSD) * 100).toFixed(4)),
            totalSupplied: parseFloat(collateralValueUSD.toFixed(8)),
            totalBorrowed: parseFloat(borrowValueUSD.toFixed(8))
        }
    }, [userPositions, lendTokenAddressParam, borrowTokenAddressParam])

    const metrics = useMemo(() => {
        const borrowSymbol = borrowTokenDetails?.symbol || 'Unknown'
        const lendSymbol = lendTokenDetails?.symbol || 'Unknown'
        
        let intrinsicAPY = 0
        if (lendSymbol?.toLowerCase() === 'mtbill') {
            intrinsicAPY = mTbillAPY || 0
        } else if (lendSymbol?.toLowerCase() === 'mbasis') {
            intrinsicAPY = mBasisAPY || 0
        }
        
        const appleFarmRewardAPY = lendTokenDetails?.appleFarmReward || 0
        const totalSupplyAPY = lendTokenDetails?.apy || 0
        
        const maxLeverageValue = loopPair?.strategy?.max_leverage || 1;
        
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
                value: `${maxLeverageValue.toFixed(2)}x`,
                icon: TrendingUp,
                tooltip: `Maximum leverage multiplier available for ${lendSymbol}/${borrowSymbol} loop positions. Higher leverage amplifies both potential returns and risks.`,
                className: 'text-primary'
            }
        ]

        return baseMetrics
    }, [lendTokenDetails, borrowTokenDetails, loopPair, mTbillAPY, mBasisAPY, hasAppleFarmRewards])

    const loopData = useMemo(() => {
        if (userLoopPosition) {
            return {
                ...userLoopPosition,
                maxLeverage: parseFloat((loopPair?.strategy?.max_leverage || 4.0).toFixed(2)),
                platform: {
                    name: platformData?.platform?.name || 'Unknown',
                    logo: platformData?.platform?.logo || '',
                    chain_id: Number(chain_id)
                }
            }
        }

        return null
    }, [userLoopPosition, loopPair, platformData, chain_id, lendTokenAddressParam, borrowTokenAddressParam])

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
            content: loopData ? (
                <LoopPositionDetails
                    loopData={loopData}
                    isLoading={isLoading}
                />
            ) : (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <BodyText level="body1" className="text-gray-600">
                            No matching loop position found for this token pair.
                        </BodyText>
                    </div>
                </div>
            )
        },
        {
            label: 'Performance',
            value: 'performance',
            content: loopData ? (
                <LoopPerformance
                    loopData={loopData}
                    isLoading={isLoading}
                />
            ) : (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <BodyText level="body1" className="text-gray-600">
                            No matching loop position found for this token pair.
                        </BodyText>
                        <BodyText level="body3" className="text-gray-500 mt-2">
                            You need to have both lend and borrow positions in a looped platform to view performance data.
                        </BodyText>
                    </div>
                </div>
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
            <BodyText level="body1" weight="medium" className="py-2 text-gray-800">
                Supply APY Breakdown
            </BodyText>
            <div className="flex items-center justify-between gap-[70px] py-2" style={{ gap: '70px' }}>
                <div className="flex items-center gap-1">
                    <Percent className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Base APY
                    </Label>
                </div>
                <BodyText level="body3" weight="medium" className="text-gray-800">
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
                        <BodyText level="body3" weight="medium" className="text-gray-800">
                            + {abbreviateNumber(supplyAPY, 2)}%
                        </BodyText>
                    </div>
                )
            })}
            <div className="flex items-center justify-between gap-[100px] py-2" style={{ gap: '70px' }}>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Total APY
                    </Label>
                </div>
                <BodyText level="body3" weight="medium" className="text-gray-800">
                    = {totalAPY === 0 ? '0.00' : abbreviateNumber(totalAPY, 2)}%
                </BodyText>
            </div>
        </div>
    )
} 