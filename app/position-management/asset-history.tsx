'use client'

import React, { useEffect, useState } from 'react'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { AreaChartStacked } from '@/components/charts/area-chart-stacked'
import { useSearchParams } from 'next/navigation'
import {
    Period,
    PeriodLongDisplay,
    PeriodShortDisplay,
} from '@/types/periodButtons'
import useGetPlatformHistoryData from '@/hooks/useGetPlatformHistoryData'
import { HISTORY_CHART_SELECT_OPTIONS } from '@/constants'
import {
    abbreviateNumber,
    containsNegativeInteger,
    convertNegativeToPositive,
    extractTimeFromDate,
} from '@/lib/utils'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import ImageWithDefault from '@/components/ImageWithDefault'
import { PlatformType } from '@/types/platform'
import { usePositionManagementContext } from '@/context/position-management-provider'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

export default function AssetHistory() {
    const searchParams = useSearchParams()
    const { logEvent } = useAnalytics()
    const tokenAddress = searchParams.get('token') || ''
    // const chain_id = searchParams.get("chain_id") || "";
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const positionType = searchParams.get('position_type') || 'lend'
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [selectedFilter, setSelectedFilter] = useState<any>(
        positionType === 'borrow'
            ? HISTORY_CHART_SELECT_OPTIONS[3]
            : HISTORY_CHART_SELECT_OPTIONS[0]
    )
    const { platformData } = usePositionManagementContext()

    const isMorpho =
        platformData?.platform?.platform_name?.split('-')[0]?.toLowerCase() ===
        PlatformType.MORPHO
    const isVault = platformData?.platform?.isVault

    // [API_CALL: GET] - Get Platform history data
    const {
        data: platformHistoryData,
        isLoading: isLoadingPlatformHistory,
        isError: isErrorPlatformHistory,
    } = useGetPlatformHistoryData({
        protocol_identifier,
        token: tokenAddress,
        period: selectedRange,
    })

    useEffect(() => {
        logEvent('history_range_selected', {
            option: selectedRange,
            default: true,
        })
        logEvent('history_filter_selected', {
            option: selectedFilter,
            default: true,
        })
    }, [])

    // [CHART_DATA] - Format data for chart
    const chartData: any = platformHistoryData?.processMap?.map((item: any) => {
        const date = new Date(item.timestamp)
        const dateOptions: any = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }
        const formattedDate = new Intl.DateTimeFormat(
            'en-US',
            dateOptions
        ).format(date)
        const timeStamp = extractTimeFromDate(date, { exclude: ['seconds'] })

        const requiredFields = HISTORY_CHART_SELECT_OPTIONS.reduce(
            (acc: any, option) => {
                acc[option.value] = Number(item.data[option.value] ?? 0)
                return acc
            },
            {}
        )

        return {
            ...requiredFields,
            timestamp:
                selectedRange === Period.oneDay ? timeStamp : formattedDate,
        }
    })

    // [CHART_DATA] - Disable category filters
    const disableCategoryFilters = HISTORY_CHART_SELECT_OPTIONS.filter(
        (option) => {
            return !chartData?.some((item: any) => !!Number(item[option.value]))
        }
    ).map((option) => option.value)

    // [EVENT_HANDLERS] - Handle range change
    function handleRangeChange(value: Period) {
        setSelectedRange(value)
        logEvent('history_range_selected', {
            option: value,
            default: false,
        })
    }

    // [EVENT_HANDLERS] - Handle filter change
    function handleFilterChange(value: any) {
        setSelectedFilter(value)
        logEvent('history_filter_selected', {
            option: value,
            default: false,
        })
    }

    // [FOOTER_STATS] - Get average values for footer stats
    const depositRateAverage = Number(
        platformHistoryData?.stats?.depositRateAverage ?? 0
    )
    const depositRateRewardAverage = Number(
        platformHistoryData?.stats?.depositRateRewardAverage ?? 0
    )
    const borrowRateAverage = Number(
        platformHistoryData?.stats?.variableBorrowRateAverage ?? 0
    )
    const borrowRateRewardAverage = Number(
        platformHistoryData?.stats?.variableBorrowRateRewardAverage ?? 0
    )
    const utilizationRateAverage = Number(
        platformHistoryData?.stats?.utilizationRateAverage ?? 0
    )

    // [UTILS] - Get formatted average value
    function getFormattedAverageValue(value: number, key?: string) {
        let formattedValue = value
        const hasNegativeValue = containsNegativeInteger(value)
        const negativeSymbol = hasNegativeValue ? '-' : ''
        // [UTILS] - Handle N/A values
        if (
            !value &&
            value === 0 &&
            (key === 'depositRateReward' || key === 'variableBorrowRateReward')
        ) {
            return 'N/A'
        }
        // [UTILS] - Handle negative values
        if (hasNegativeValue) {
            formattedValue = Number(convertNegativeToPositive(value))
        }
        // [UTILS] - Handle values less than -1M% and greater than 1M%
        if (formattedValue < -1000000) {
            return '< -1M%'
        } else if (formattedValue > 1000000) {
            return '> 1M%'
        }
        // [UTILS] - Handle values between -1M% and 1M%
        return negativeSymbol + abbreviateNumber(formattedValue) + '%'
    }

    // [FOOTER_STATS] - Footer stats
    const HISTORY_CHART_FOOTER_STATS = [
        {
            key: 'deposit',
            label: `Avg Deposit`,
            value: getFormattedAverageValue(depositRateAverage),
            show: true,
        },
        {
            key: 'depositRateReward',
            label: `Avg Deposit`,
            value: getFormattedAverageValue(
                depositRateRewardAverage,
                'depositRateReward'
            ),
            show: !disableCategoryFilters.includes('depositRateReward'),
        },
        {
            key: 'borrow',
            label: `Avg Borrow`,
            value: getFormattedAverageValue(borrowRateAverage),
            show: !(isMorpho && isVault),
        },
        {
            key: 'variableBorrowRateReward',
            label: `Avg Borrow`,
            value: getFormattedAverageValue(
                borrowRateRewardAverage,
                'variableBorrowRateReward'
            ),
            show: !disableCategoryFilters.includes('variableBorrowRateReward'),
        },
        {
            key: 'utilization',
            label: `Avg Utilization`,
            value: getFormattedAverageValue(utilizationRateAverage),
            show: !(isMorpho && isVault),
        },
    ]

    // [RENDER] - Render component
    return (
        <motion.section
            className="bg-white bg-opacity-40 rounded-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
        >
            <AreaChartStacked
                selectedRange={selectedRange}
                handleRangeChange={handleRangeChange}
                selectedFilter={selectedFilter}
                handleFilterChange={handleFilterChange}
                chartData={chartData}
                disableCategoryFilters={disableCategoryFilters}
            />
            <div className="py-[36px] px-[30px] md:px-[55px] grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                {HISTORY_CHART_FOOTER_STATS.filter((block) => block.show).map(
                    (block, blockIndex) => (
                        <div
                            key={blockIndex}
                            className="block-1 flex flex-col gap-[4px] sm:gap-[8px] md:gap-[12px]"
                        >
                            <InfoTooltip
                                label={
                                    <BodyText
                                        level="body2"
                                        className={`text-gray-600 border-b cursor-help border-dashed border-gray-800 hover:border-transparent flex items-center gap-[4px]`}
                                    >
                                        {block.label} (
                                        {PeriodShortDisplay[selectedRange]}){' '}
                                        {hasReward(block.key) && (
                                            <ImageWithDefault
                                                src="/icons/sparkles.svg"
                                                alt={`${block.label} With Reward`}
                                                width={16}
                                                height={16}
                                            />
                                        )}
                                    </BodyText>
                                }
                                content={`Average ${block?.label?.split(' ')?.slice(1)?.join('')?.toLowerCase()} rate ${hasReward(block?.key) ? 'with rewards' : ''} for ${PeriodLongDisplay[selectedRange]?.toLowerCase()}`}
                            />
                            {!isLoadingPlatformHistory && (
                                <HeadingText
                                    level="h3"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    {block.value}
                                </HeadingText>
                            )}
                            {isLoadingPlatformHistory && (
                                <Skeleton className="h-[28px] w-[80px] rounded-4" />
                            )}
                        </div>
                    )
                )}
            </div>
        </motion.section>
    )
}

function hasReward(key: string) {
    return key === 'depositRateReward' || key === 'variableBorrowRateReward'
}
