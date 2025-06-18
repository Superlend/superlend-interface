'use client'

import React, { useState, useMemo, useEffect, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import FlatTabs from '@/components/tabs/flat-tabs'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import LoopEducationSection from './loop-education-section'
import LoopMetricsCards from './loop-metrics-cards'
import LoopPositionDetails from './loop-position-details'
import LoopPerformance from './loop-performance'
import { abbreviateNumber } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { useAaveV3Data } from '@/hooks/protocols/useAaveV3Data'
import { ChainId } from '@/types/chain'
import { AssetsDataContext } from '@/context/data-provider'
import { TPlatformAsset } from '@/types/platform'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'

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

    const { data: platformData, isLoading: isLoadingPlatformData } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const { data: portfolioData, isLoading: isLoadingPortfolioData } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    // Get token details from platform data
    const lendTokenDetails = useMemo(() => {
        if (!platformData?.assets) return null
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === lendTokenAddressParam.toLowerCase()
        )
        if (!asset) return null
        
        // Calculate enhanced supply APY with apple farm rewards (similar to page-header)
        const baseSupplyAPY = asset.supply_apy || 0
        const appleFarmReward = appleFarmRewardsAprs?.[asset.token.address] ?? 0
        const enhancedSupplyAPY = baseSupplyAPY + appleFarmReward
        
        return {
            ...asset.token,
            apy: enhancedSupplyAPY,
            baseApy: baseSupplyAPY, // Keep original for reference
            appleFarmReward: appleFarmReward,
            ltv: asset.ltv, // Loan-to-value ratio
            remaining_supply_cap: asset.remaining_supply_cap, // Available supply capacity
            totalSupply: 0 // TODO: Need to calculate total supply from platform data - not available in asset
        }
    }, [platformData, lendTokenAddressParam, appleFarmRewardsAprs])

    const borrowTokenDetails = useMemo(() => {
        if (!platformData?.assets) return null
        const asset = platformData.assets.find((asset: TPlatformAsset) => 
            asset.token.address.toLowerCase() === borrowTokenAddressParam.toLowerCase()
        )
        return asset ? {
            ...asset.token,
            apy: asset.variable_borrow_apy, // Use variable borrow APY for borrowing
            borrow_enabled: asset.borrow_enabled, // Whether borrowing is enabled for this asset
            remaining_borrow_cap: asset.remaining_borrow_cap, // Available borrow capacity
            totalBorrow: 0, // TODO: Need to calculate total borrows - not available in asset
            availableLiquidity: 0 // TODO: Need to calculate available liquidity - not available in asset
        } : null
    }, [platformData, borrowTokenAddressParam])

    // Get user positions from portfolio data
    const userPositions = useMemo(() => {
        if (!portfolioData?.platforms || !walletAddress) return []
        return portfolioData.platforms.filter((platform) =>
            platform?.protocol_identifier?.toLowerCase() === protocol_identifier?.toLowerCase()
        )
    }, [portfolioData, protocol_identifier, walletAddress])

    const userLoopPosition = useMemo(() => {
        if (!userPositions.length) return null
        
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

        const collateralValueUSD = lendPosition.amount * lendPosition.token.price_usd
        const borrowValueUSD = borrowPosition.amount * borrowPosition.token.price_usd
        const netValue = collateralValueUSD - borrowValueUSD
        const currentLeverage = collateralValueUSD / (collateralValueUSD - borrowValueUSD)
        const netAPY = (lendPosition.apy * currentLeverage) - (borrowPosition.apy * (currentLeverage - 1))

        return {
            netValue,
            currentLeverage,
            netAPY,
            collateralAsset: {
                token: lendPosition.token,
                amount: lendPosition.amount,
                amountUSD: collateralValueUSD,
                apy: lendPosition.apy
            },
            borrowAsset: {
                token: borrowPosition.token,
                amount: borrowPosition.amount,
                amountUSD: borrowValueUSD,
                apy: borrowPosition.apy
            },
            healthFactor: platform.health_factor,
            positionLTV: (borrowValueUSD / collateralValueUSD) * 100,
            liquidationLTV: (lendPosition.liquidation_threshold || 80),
            liquidationPrice: borrowValueUSD / ((lendPosition.liquidation_threshold || 80) / 100 * lendPosition.amount),
            utilizationRate: (borrowValueUSD / collateralValueUSD) * 100,
            totalSupplied: collateralValueUSD,
            totalBorrowed: borrowValueUSD
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
        const baseMetrics = [
            {
                title: 'Liquidity',
                value: borrowTokenDetails?.availableLiquidity ? `$${abbreviateNumber(borrowTokenDetails.availableLiquidity)}` : '$1.2M', // Static fallback
                icon: DollarSign,
                tooltip: 'Available liquidity for borrowing',
                className: 'text-gray-800'
            },
            {
                title: 'Max APY',
                value: lendTokenDetails ? `${lendTokenDetails.apy.toFixed(2)}%` : '5.25%', // Static fallback
                icon: Target,
                tooltip: 'Maximum APY available for this position',
                className: 'text-green-600'
            },
            {
                title: 'Total Supply',
                value: lendTokenDetails?.totalSupply ? `$${abbreviateNumber(lendTokenDetails.totalSupply)}` : '$8.5M', // Static fallback
                icon: TrendingUp,
                tooltip: 'Total amount supplied to this market',
                className: 'text-gray-800'
            },
            {
                title: 'Max Multiplier',
                value: `${maxLeverage || 4.0}x`, // Static fallback to 4.0x
                icon: TrendingUp,
                tooltip: 'Maximum leverage multiplier available',
                className: 'text-primary'
            }
        ]

        return baseMetrics
    }, [lendTokenDetails, borrowTokenDetails, maxLeverage])

    // Dynamic loop data
    const loopData = useMemo(() => {
        if (userLoopPosition) {
            return {
                ...userLoopPosition,
                maxLeverage: maxLeverage || 4.0,
                platform: {
                    name: platformData?.platform?.name || 'Unknown',
                    logo: platformData?.platform?.logo || '',
                    chain_id: Number(chain_id)
                }
            }
        }

        // Fallback data for users without positions
        return {
            netValue: 0,
            currentLeverage: 1.0,
            netAPY: lendTokenDetails?.apy || 0,
            collateralAsset: {
                token: lendTokenDetails || {
                    symbol: 'Unknown',
                    name: 'Unknown',
                    logo: '',
                    address: lendTokenAddressParam,
                    decimals: 18,
                    price_usd: 0
                },
                amount: 0,
                amountUSD: 0,
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
                amount: 0,
                amountUSD: 0,
                apy: borrowTokenDetails?.apy || 0
            },
            healthFactor: 0,
            positionLTV: 0,
            liquidationLTV: 80,
            liquidationPrice: 0,
            maxLeverage: maxLeverage || 4.0,
            utilizationRate: 0,
            totalSupplied: 0,
            totalBorrowed: 0,
            platform: {
                name: platformData?.platform?.name || 'Unknown',
                logo: platformData?.platform?.logo || '',
                chain_id: Number(chain_id)
            }
        }
    }, [userLoopPosition, lendTokenDetails, borrowTokenDetails, maxLeverage, platformData, chain_id, lendTokenAddressParam, borrowTokenAddressParam])

    const isLoading = isLoadingPlatformData || isLoadingPortfolioData || isLoadingAppleFarmRewards

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
                    <LoopEducationSection />
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