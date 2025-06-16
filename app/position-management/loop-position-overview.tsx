'use client'

import React, { useState, useMemo } from 'react'
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

export default function LoopPositionOverview() {
    const searchParams = useSearchParams()
    const chain_id = searchParams?.get('chain_id') || '1'
    const protocol_identifier = searchParams?.get('protocol_identifier') || ''
    const lend_token = searchParams?.get('lend_token') || ''
    const borrow_token = searchParams?.get('borrow_token') || ''
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const [activeTab, setActiveTab] = useState('overview')

    // API calls for real data
    const { data: platformData, isLoading: isLoadingPlatformData } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const { data: portfolioData, isLoading: isLoadingPortfolioData } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

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
                logo: '/tokens/usdc.svg',
                address: lend_token,
                decimals: 6,
                price_usd: 1.0
            },
            amount: 1000,
            amountUSD: 1000,
            apy: 8.5
        },
        borrowAsset: {
            token: {
                symbol: 'WETH',
                name: 'Wrapped Ethereum',
                logo: '/tokens/weth.svg',
                address: borrow_token,
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
    }), [platformData, lend_token, borrow_token, chain_id])

    const isLoading = isLoadingPlatformData || isLoadingPortfolioData

    const tabs = [
        {
            label: 'Overview',
            value: 'overview',
            content: (
                <div className="flex flex-col gap-6">
                    <LoopMetricsCards
                        loopData={dummyLoopPositionData}
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