'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn, abbreviateNumber } from '@/lib/utils'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

interface LoopPerformanceProps {
    loopData: any
    isLoading: boolean
}

export default function LoopPerformance({ loopData, isLoading }: LoopPerformanceProps) {
    // Check if user has an active position
    const hasActivePosition = useMemo(() => {
        return loopData.netValue > 0 || loopData.totalSupplied > 0 || loopData.totalBorrowed > 0
    }, [loopData])

    // Transaction history - replaceable with real API data
    const transactionHistory = useMemo(() => {
        if (!hasActivePosition) return []
        
        return [
            {
                id: 1,
                type: 'loop_open',
                amount: loopData.totalSupplied || 1000,
                token: loopData.collateralAsset?.token?.symbol || 'USDC',
                timestamp: '2024-01-15T10:30:00Z',
                hash: '0x1234...5678',
                status: 'completed'
            },
            {
                id: 2,
                type: 'leverage_increase',
                amount: (loopData.totalSupplied || 1000) * 0.5,
                token: loopData.collateralAsset?.token?.symbol || 'USDC',
                timestamp: '2024-01-10T14:20:00Z',
                hash: '0x5678...9012',
                status: 'completed'
            }
        ]
    }, [hasActivePosition, loopData])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <Card className="bg-white bg-opacity-40">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-6 w-48" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'loop_open':
                return ArrowUpRight
            case 'leverage_increase':
                return TrendingUp
            case 'loop_close':
                return ArrowDownLeft
            default:
                return Activity
        }
    }

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'loop_open':
                return 'Loop Opened'
            case 'leverage_increase':
                return 'Leverage Increased'
            case 'loop_close':
                return 'Loop Closed'
            default:
                return 'Transaction'
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Performance Overview */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            Position Performance
                        </HeadingText>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Total Supplied
                                    </BodyText>
                                    <InfoTooltip content="Total amount supplied including compound effects" />
                                </div>
                                <HeadingText level="h4" weight="medium" className="text-gray-800">
                                    ${abbreviateNumber(loopData.totalSupplied || 0)}
                                </HeadingText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Total Borrowed
                                    </BodyText>
                                    <InfoTooltip content="Total amount borrowed across all loops" />
                                </div>
                                <HeadingText level="h4" weight="medium" className="text-gray-800">
                                    ${abbreviateNumber(loopData.totalBorrowed || 0)}
                                </HeadingText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Net Position
                                    </BodyText>
                                    <InfoTooltip content="Net value after accounting for all assets and liabilities" />
                                </div>
                                <HeadingText 
                                    level="h4" 
                                    weight="medium" 
                                    className={cn(
                                        (loopData.netValue || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    )}
                                >
                                    ${abbreviateNumber(loopData.netValue || 0)}
                                </HeadingText>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* APY Breakdown */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            APY Breakdown
                        </HeadingText>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <BodyText level="body2" weight="medium" className="text-green-800">
                                            Supply APY
                                        </BodyText>
                                        <BodyText level="body3" className="text-green-600">
                                            {loopData.collateralAsset?.token?.symbol || 'Token'} Earnings
                                        </BodyText>
                                    </div>
                                </div>
                                <HeadingText level="h4" weight="medium" className="text-green-700">
                                    +{(loopData.collateralAsset?.apy || 0).toFixed(2)}%
                                </HeadingText>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <ArrowDownLeft className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <BodyText level="body2" weight="medium" className="text-red-800">
                                            Borrow Cost
                                        </BodyText>
                                        <BodyText level="body3" className="text-red-600">
                                            {loopData.borrowAsset?.token?.symbol || 'Token'} Interest
                                        </BodyText>
                                    </div>
                                </div>
                                <HeadingText level="h4" weight="medium" className="text-red-700">
                                    -{(loopData.borrowAsset?.apy || 0).toFixed(2)}%
                                </HeadingText>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-primary-50 rounded-4 border border-primary/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <BodyText level="body2" weight="medium" className="text-primary-800">
                                        Net APY (After Leverage)
                                    </BodyText>
                                    <BodyText level="body3" className="text-primary-600">
                                        Effective return with {(loopData.currentLeverage || 1).toFixed(2)}x leverage
                                    </BodyText>
                                </div>
                                <HeadingText 
                                    level="h3" 
                                    weight="medium" 
                                    className={cn(
                                        (loopData.netAPY || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    )}
                                >
                                    {(loopData.netAPY || 0) >= 0 ? '+' : ''}{(loopData.netAPY || 0).toFixed(2)}%
                                </HeadingText>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            Transaction History
                        </HeadingText>
                        
                        {transactionHistory.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {transactionHistory.map((tx) => {
                                    const IconComponent = getTransactionIcon(tx.type)
                                    return (
                                        <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <IconComponent className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                                        {getTransactionLabel(tx.type)}
                                                    </BodyText>
                                                    <BodyText level="body3" className="text-gray-600">
                                                        {abbreviateNumber(tx.amount)} {tx.token}
                                                    </BodyText>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-500" />
                                                    <BodyText level="body3" className="text-gray-500">
                                                        {new Date(tx.timestamp).toLocaleDateString()}
                                                    </BodyText>
                                                </div>
                                                <BodyText level="body3" className="text-gray-500 font-mono">
                                                    {tx.hash}
                                                </BodyText>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-gray-400" />
                                </div>
                                <BodyText level="body1" className="text-gray-600">
                                    No transaction history available
                                </BodyText>
                                <BodyText level="body3" className="text-gray-500">
                                    Your loop transactions will appear here
                                </BodyText>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 