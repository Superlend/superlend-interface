"use client"

import React, { useState } from 'react';
import { BodyText, HeadingText, Label } from '@/components/ui/typography';
import { AreaChartStacked } from '@/components/charts/area-chart-stacked';
import { useSearchParams } from 'next/navigation';
import { Period, PeriodLongDisplay, PeriodShortDisplay } from '@/types/periodButtons';
import useGetPlatformHistoryData from '@/hooks/useGetPlatformHistoryData';
import { HISTORY_CHART_SELECT_OPTIONS } from '@/constants';
import { abbreviateNumber } from '@/lib/utils';
import InfoTooltip from '@/components/tooltips/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetHistory() {
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    // const chain_id = searchParams.get("chain_id") || "";
    const platform_id = searchParams.get("platform_id") || "";
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth);
    const [selectedFilter, setSelectedFilter] = useState<any>(HISTORY_CHART_SELECT_OPTIONS[0]);

    // [API_CALL: GET] - Get Platform history data
    const {
        data: platformHistoryData,
        isLoading: isLoadingPlatformHistory,
        isError: isErrorPlatformHistory
    } = useGetPlatformHistoryData({
        platform_id,
        token: tokenAddress,
        period: selectedRange
    });

    function handleRangeChange(value: Period) {
        setSelectedRange(value)
    }

    const HISTORY_CHART_FOOTER_STATS = [
        {
            key: "deposit",
            label: `Avg Deposit (${PeriodShortDisplay[selectedRange]})`,
            value: `${abbreviateNumber(Number(platformHistoryData?.stats?.depositRateAverage))}%`
        },
        {
            key: "borrow",
            label: `Avg Borrow (${PeriodShortDisplay[selectedRange]})`,
            value: `${abbreviateNumber(Number(platformHistoryData?.stats?.variableBorrowRateAverage))}%`
        },
        {
            key: "utilization",
            label: `Avg Utilization (${PeriodShortDisplay[selectedRange]})`,
            value: `${abbreviateNumber(Number(platformHistoryData?.stats?.utilizationRateAverage))}%`
        },
    ]

    // const getLoanToValueTotal = platformHistoryData?.processMap?.map((item: any) => (item.data.ltv)).reduce((acc: number, curr: number) => acc + curr, 0);
    // const getBottomBorder = (blockIndex: number) => blockIndex === 0 ? "border-transparent" : "border-b cursor-help";

    return (
        <section className="bg-white bg-opacity-40 rounded-6">
            <AreaChartStacked
                selectedRange={selectedRange}
                handleRangeChange={handleRangeChange}
                selectedFilter={selectedFilter}
                handleFilterChange={setSelectedFilter}
                chartData={platformHistoryData?.processMap}
            />
            <div className="py-[36px] px-[30px] md:px-[55px] flex flex-col md:flex-row md:items-center justify-between gap-10">
                {
                    HISTORY_CHART_FOOTER_STATS.map((block, blockIndex) => (
                        <div key={blockIndex} className="block-1 flex flex-col gap-[4px] sm:gap-[8px] md:gap-[12px]">
                            <InfoTooltip
                                label={
                                    <BodyText level='body1' className={`text-gray-600 border-b cursor-help border-dashed border-gray-800 hover:border-transparent`}>
                                        {block.label}
                                    </BodyText>
                                }
                                content={
                                    `Average ${block.key.toLowerCase()} rate for ${PeriodLongDisplay[selectedRange].toLowerCase()}`
                                }
                            // hide={blockIndex === 0}
                            />
                            {!isLoadingPlatformHistory &&
                                <HeadingText level='h3'>
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
        </section>
    )
}