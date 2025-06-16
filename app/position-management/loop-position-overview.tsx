'use client'

import React, { useState, useMemo, useEffect } from 'react'
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

    const { data: platformData, isLoading: isLoadingPlatformData } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const { data: portfolioData, isLoading: isLoadingPortfolioData } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    const borrowTokenLiquidity = useMemo(() => {
        platformData
    }, [portfolioData])

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
    }, [providerStatus])

    // Dummy data structure - easily replaceable with real API data
    const dummyLoopPositionData = useMemo(() => ({
        // Position Overview
        netValue: 1250.50,
        pnl: {
            value: 125.30,
            percentage: 11.2,
            isPositive: true
        },
        netAPY: 8.45,
        currentMultiplier: 2.5,

        // Position Details
        collateralAsset: {
            token: {
                symbol: 'USDC',
                name: 'USD Coin',
                logo: '/images/tokens/usdc.webp',
                address: lendTokenAddressParam,
                decimals: 6,
                price_usd: 1.0
            },
            amount: 1000,
            amountUSD: 1000,
            apy: 8.5
        },
        borrowAsset: {
            token: {
                symbol: 'USDT',
                name: 'Tether',
                logo: '/images/tokens/usdt.webp',
                address: borrowTokenAddressParam,
                decimals: 18,
                price_usd: 2500
            },
            amount: 0.6,
            amountUSD: 1500,
            apy: 7.73
        },

        // Risk Metrics
        healthFactor: 1.62,
        liquidationPrice: 1875.40,
        maxLeverage: 4.0,
        currentLeverage: 2.5,
        utilizationRate: 62.5,

        // Performance
        totalSupplied: 2500,
        totalBorrowed: 1500,
        positionLTV: 60,
        liquidationLTV: 80,

        // Platform Details
        platform: {
            name: platformData?.platform?.name || 'Aave V3',
            logo: platformData?.platform?.logo || '/platforms/aave.svg',
            chain_id: Number(chain_id)
        }
    }), [platformData, lendTokenAddressParam, borrowTokenAddressParam, chain_id])

    const metrics = [
        // {
        //     title: 'Net Value',
        //     value: `$${abbreviateNumber(dummyLoopPositionData.netValue)}`,
        //     icon: DollarSign,
        //     tooltip: 'Total value of your loop position after accounting for all assets and debts',
        //     className: 'text-gray-800'
        // },
        // {
        //     title: 'PnL',
        //     value: `${dummyLoopPositionData.pnl.isPositive ? '+' : ''}$${abbreviateNumber(dummyLoopPositionData.pnl.value)}`,
        //     subValue: `${dummyLoopPositionData.pnl.isPositive ? '+' : ''}${dummyLoopPositionData.pnl.percentage.toFixed(2)}%`,
        //     icon: dummyLoopPositionData.pnl.isPositive ? TrendingUp : TrendingDown,
        //     tooltip: 'Profit and loss from your loop position since opening',
        //     className: dummyLoopPositionData.pnl.isPositive ? 'text-green-600' : 'text-red-600'
        // },
        {
            title: 'Liquidity',
            value: `$${abbreviateNumber(dummyLoopPositionData.totalSupplied)}`,
            icon: DollarSign,
            tooltip: 'Total value of your loop position after accounting for all assets and debts',
            className: 'text-gray-800'
        },
        {
            title: 'Max APY',
            value: `${dummyLoopPositionData.netAPY >= 0 ? '+' : ''}${dummyLoopPositionData.netAPY.toFixed(2)}%`,
            icon: Target,
            tooltip: 'Your effective APY after accounting for supply rewards and borrowing costs',
            className: dummyLoopPositionData.netAPY >= 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            title: 'Total Supply',
            value: `$${abbreviateNumber(dummyLoopPositionData.totalSupplied)}`,
            icon: DollarSign,
            tooltip: 'Total value of your loop position after accounting for all assets',
            className: 'text-gray-800'
        },
        {
            title: 'Max Multiplier',
            value: `${maxLeverage}x`,
            icon: TrendingUp,
            tooltip: 'Your current leverage multiplier - how much your exposure is amplified',
            className: 'text-primary'
        }
    ]

    const isLoading = isLoadingPlatformData || isLoadingPortfolioData

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
                    loopData={dummyLoopPositionData}
                    isLoading={isLoading}
                />
            )
        },
        {
            label: 'Performance',
            value: 'performance',
            content: (
                <LoopPerformance
                    loopData={dummyLoopPositionData}
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