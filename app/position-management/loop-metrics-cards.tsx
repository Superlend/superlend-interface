'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, abbreviateNumber } from '@/lib/utils'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

interface LoopMetricsCardsProps {
    loopData: any
    isLoading: boolean
}

export default function LoopMetricsCards({ loopData, isLoading }: LoopMetricsCardsProps) {
    const metrics = [
        {
            title: 'Net Value',
            value: `$${abbreviateNumber(loopData.netValue)}`,
            icon: DollarSign,
            tooltip: 'Total value of your loop position after accounting for all assets and debts',
            className: 'text-gray-800'
        },
        {
            title: 'PnL',
            value: `${loopData.pnl.isPositive ? '+' : ''}$${abbreviateNumber(loopData.pnl.value)}`,
            subValue: `${loopData.pnl.isPositive ? '+' : ''}${loopData.pnl.percentage.toFixed(2)}%`,
            icon: loopData.pnl.isPositive ? TrendingUp : TrendingDown,
            tooltip: 'Profit and loss from your loop position since opening',
            className: loopData.pnl.isPositive ? 'text-green-600' : 'text-red-600'
        },
        {
            title: 'Net APY',
            value: `${loopData.netAPY >= 0 ? '+' : ''}${loopData.netAPY.toFixed(2)}%`,
            icon: Target,
            tooltip: 'Your effective APY after accounting for supply rewards and borrowing costs',
            className: loopData.netAPY >= 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            title: 'Multiplier',
            value: `${loopData.currentMultiplier}x`,
            icon: TrendingUp,
            tooltip: 'Your current leverage multiplier - how much your exposure is amplified',
            className: 'text-primary'
        }
    ]

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-white bg-opacity-40">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {metrics.map((metric, index) => {
                const IconComponent = metric.icon
                return (
                    <Card key={index} className="bg-white bg-opacity-40 hover:bg-opacity-60 transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <IconComponent className={cn("w-4 h-4", metric.className)} />
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            {metric.title}
                                        </BodyText>
                                    </div>
                                    <InfoTooltip content={metric.tooltip} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <HeadingText
                                        level="h4"
                                        weight="medium"
                                        className={metric.className}
                                    >
                                        {metric.value}
                                    </HeadingText>
                                    {/* {metric.subValue && (
                                        <BodyText
                                            level="body3"
                                            weight="normal"
                                            className={cn("opacity-80", metric.className)}
                                        >
                                            {metric.subValue}
                                        </BodyText>
                                    )} */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
} 