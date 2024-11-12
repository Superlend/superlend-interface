"use client"

import React, { useState } from 'react';
import { BodyText, HeadingText, Label } from '@/components/ui/typography';
import { AreaChartStacked } from '@/components/charts/area-chart-stacked';
import { useSearchParams } from 'next/navigation';
import { Period, PeriodLongDisplay, PeriodShortDisplay } from '@/types/periodButtons';
import useGetPlatformHistoryData from '@/hooks/useGetPlatformHistoryData';
import { HISTORY_CHART_SELECT_OPTIONS } from '@/constants';
import { abbreviateNumber, extractTimeFromDate } from '@/lib/utils';
import InfoTooltip from '@/components/tooltips/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function AssetHistory() {
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    // const chain_id = searchParams.get("chain_id") || "";
    const protocol_identifier = searchParams.get("protocol_identifier") || "";
    const positionType = searchParams.get("position_type") || "lend";
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth);
    const [selectedFilter, setSelectedFilter] = useState<any>(
        positionType === "borrow" ? HISTORY_CHART_SELECT_OPTIONS[3] : HISTORY_CHART_SELECT_OPTIONS[0]
    );

    // [API_CALL: GET] - Get Platform history data
    const {
        data: platformHistoryData,
        isLoading: isLoadingPlatformHistory,
        isError: isErrorPlatformHistory
    } = useGetPlatformHistoryData({
        protocol_identifier,
        token: tokenAddress,
        period: selectedRange
    });

    // [CHART_DATA] - Format data for chart
    const chartData: any = platformHistoryData?.processMap?.map((item: any) => {
        const date = new Date(item.timestamp);
        const dateOptions: any = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
        const timeStamp = extractTimeFromDate(date, { exclude: ["seconds"] });

        const requiredFields = HISTORY_CHART_SELECT_OPTIONS.reduce((acc: any, option) => {
            acc[option.value] = abbreviateNumber(item.data[option.value]);
            return acc;
        }, {});

        return {
            ...requiredFields,
            timestamp: selectedRange === Period.oneDay ? timeStamp : formattedDate
        };
    });

    // [CHART_DATA] - Disable category filters
    const disableCategoryFilters = HISTORY_CHART_SELECT_OPTIONS
        .filter((option) => {
            return !chartData?.some((item: any) => !!Number(item[option.value]))
        })
        .map(option => option.value);

    // [EVENT_HANDLERS] - Handle range change
    function handleRangeChange(value: Period) {
        setSelectedRange(value)
    }

    // [FOOTER_STATS] - Get average values for footer stats
    const depositRateAverage = Number(platformHistoryData?.stats?.depositRateAverage ?? 0);
    const depositRateRewardAverage = Number(platformHistoryData?.stats?.depositRateRewardAverage ?? 0);
    const borrowRateAverage = Number(platformHistoryData?.stats?.variableBorrowRateAverage ?? 0);
    const borrowRateRewardAverage = Number(platformHistoryData?.stats?.variableBorrowRateRewardAverage ?? 0);
    const utilizationRateAverage = Number(platformHistoryData?.stats?.utilizationRateAverage ?? 0);

    // [UTILS] - Get formatted average value
    function getFormattedAverageValue(value: number, key?: string) {
        // [UTILS] - Handle N/A values
        if (!value && value === 0 && (key === "depositRateReward" || key === "variableBorrowRateReward")) {
            return "N/A"
        }
        // [UTILS] - Handle values less than -1M% and greater than 1M%
        if (value < -1000000) {
            return "< -1M%"
        } else if (value > 1000000) {
            return "> 1M%"
        }
        // [UTILS] - Handle values between 0 and 1M%
        return abbreviateNumber(value) + "%";
    }

    // [FOOTER_STATS] - Footer stats
    const HISTORY_CHART_FOOTER_STATS = [
        {
            key: "deposit",
            label: `Avg Deposit (${PeriodShortDisplay[selectedRange]})`,
            value: getFormattedAverageValue(depositRateAverage),
            show: true,
        },
        {
            key: "depositRateReward",
            label: `Avg Deposit + Reward (${PeriodShortDisplay[selectedRange]})`,
            value: getFormattedAverageValue(depositRateRewardAverage, "depositRateReward"),
            show: !disableCategoryFilters.includes("depositRateReward"),
        },
        {
            key: "borrow",
            label: `Avg Borrow (${PeriodShortDisplay[selectedRange]})`,
            value: getFormattedAverageValue(borrowRateAverage),
            show: true,
        },
        {
            key: "variableBorrowRateReward",
            label: `Avg Borrow + Reward (${PeriodShortDisplay[selectedRange]})`,
            value: getFormattedAverageValue(borrowRateRewardAverage, "variableBorrowRateReward"),
            show: !disableCategoryFilters.includes("variableBorrowRateReward"),
        },
        {
            key: "utilization",
            label: `Avg Utilization (${PeriodShortDisplay[selectedRange]})`,
            value: getFormattedAverageValue(utilizationRateAverage),
            show: true,
        },
    ]

    // [RENDER] - Render component
    return (
        <motion.section
            className="bg-white bg-opacity-40 rounded-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        >
            <AreaChartStacked
                selectedRange={selectedRange}
                handleRangeChange={handleRangeChange}
                selectedFilter={selectedFilter}
                handleFilterChange={setSelectedFilter}
                chartData={chartData}
                disableCategoryFilters={disableCategoryFilters}
            />
            <div className="py-[36px] px-[30px] md:px-[55px] grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                {
                    HISTORY_CHART_FOOTER_STATS.filter((block) => block.show).map((block, blockIndex) => (
                        <div key={blockIndex} className="block-1 flex flex-col gap-[4px] sm:gap-[8px] md:gap-[12px]">
                            <InfoTooltip
                                label={
                                    <BodyText level='body2' className={`text-gray-600 border-b cursor-help border-dashed border-gray-800 hover:border-transparent`}>
                                        {block.label}
                                    </BodyText>
                                }
                                content={
                                    `Average ${block.key.toLowerCase()} rate for ${PeriodLongDisplay[selectedRange].toLowerCase()}`
                                }
                            // hide={blockIndex === 0}
                            />
                            {!isLoadingPlatformHistory &&
                                <HeadingText level='h3' weight='medium' className="text-gray-800">
                                    {block.value}
                                </HeadingText>
                            }
                            {
                                isLoadingPlatformHistory && <Skeleton className='h-[28px] w-[80px] rounded-4' />
                            }
                        </div>
                    ))
                }
            </div>
        </motion.section>
    )
}