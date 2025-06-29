'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import ImageWithDefault from '@/components/ImageWithDefault'
import { motion } from 'framer-motion'

interface LoopMetricsCardsProps {
    metrics: any[]
    isLoading: boolean
}

export default function LoopMetricsCards({ metrics, isLoading }: LoopMetricsCardsProps) {

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
                                    <div className="flex items-center gap-1">
                                        <HeadingText
                                            level="h4"
                                            weight="medium"
                                            className={metric.className}
                                        >
                                            {metric.value}
                                        </HeadingText>
                                        {/* Apple Farm Rewards Icon for Supply APY */}
                                        {metric.hasAppleFarmRewards && (
                                            <InfoTooltip
                                                label={
                                                    <motion.div
                                                        initial={{ rotate: 0 }}
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1.5, repeat: 0, ease: "easeInOut" }}
                                                        whileHover={{ rotate: -360 }}
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    >
                                                        <ImageWithDefault
                                                            src="/images/apple-farm-favicon.ico"
                                                            alt="Apple Farm Rewards"
                                                            width={16}
                                                            height={16}
                                                        />
                                                    </motion.div>
                                                }
                                                content={metric.appleFarmTooltip}
                                            />
                                        )}
                                    </div>
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