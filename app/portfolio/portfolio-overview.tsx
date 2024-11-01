"use client"

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import React from 'react'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive, convertScientificToNormal, isLowestValue } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPositionsByPlatform } from '@/components/charts/user-positions-pie-chart'

type TProps = {
    walletAddress: `0x${string}` | undefined
}

export default function PortfolioOverview({
    walletAddress
}: TProps) {
    const {
        data,
        isLoading,
        isError
    } = useGetPortfolioData({
        user_address: walletAddress,
    });

    const COLLATERAL = getStatDisplayValue(data?.total_supplied);
    const BORROWINGS = getStatDisplayValue(data?.total_borrowed);
    const NET_WORTH = getStatDisplayValue(Number(data?.total_supplied ?? 0) - Number(data?.total_borrowed ?? 0));
    const EARNINGS = getStatDisplayValue(Number(data?.platforms.reduce((acc, curr) => acc + curr.pnl, 0) ?? 0));

    const POSITIONS_BREAKDOWN_DATA = [
        {
            label: "collateral",
            data: COLLATERAL,
            id: 1
        },
        {
            label: "borrowings",
            data: BORROWINGS,
            id: 2
        },
        {
            label: "earnings",
            data: EARNINGS,
            id: 3
        },
    ]

    return (
        <section id='your-stats' className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_380px] gap-[16px] px-5">
            <article>
                <Card>
                    <div className="positions-net-worth-block px-[24px] md:px-[32px] pt-[28px] flex flex-col sm:flex-row sm:items-center gap-[29px] pb-[24px]">
                        <div className="shrink-0">
                            {isLoading && <Skeleton className='h-10 w-[75%]' />}
                            {!isLoading && <HeadingText level='h2'>{NET_WORTH}</HeadingText>}
                            <BodyText level='body1' className='text-gray-600'>Your Positions Net worth</BodyText>
                        </div>
                        <Card className='w-full'>
                            <CardContent className='bg-white py-[25px] sm:px-[44px] flex flex-col md:flex-row sm:items-center justify-between gap-[20px]'>
                                {
                                    POSITIONS_BREAKDOWN_DATA.map((position, positionIndex) => (
                                        <React.Fragment key={positionIndex}>
                                            <div className="data-block-1">
                                                {isLoading && <Skeleton className='h-6 w-16' />}
                                                {!isLoading && <BodyText level='body1' weight='medium'>{position.data}</BodyText>}
                                                <Label className="text-gray-600 text-success-500">Your {position.label}</Label>
                                            </div>
                                            <span className="hidden md:inline text-gray-500 [&:nth-child(6)]:hidden">|</span>
                                        </React.Fragment>
                                    ))
                                }
                            </CardContent>
                        </Card>
                    </div>
                    {/* <div className="bg-white rounded-t-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-[26px] px-[28px] gap-[16px]">
                            <div className="flex items-center gap-[8px]">
                                <BodyText level='body1' weight='medium'>Portfolio Trend</BodyText>
                                <Badge variant="blue">1W</Badge>
                            </div>
                            <Tabs defaultValue="day" className="w-fit">
                                <TabsList>
                                    <TabsTrigger value="day">1D</TabsTrigger>
                                    <TabsTrigger value="week">1W</TabsTrigger>
                                    <TabsTrigger value="month">1M</TabsTrigger>
                                    <TabsTrigger value="year">1Y</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <AreaChartStacked />
                    </div> */}
                </Card>
            </article>
            <article>
                <UserPositionsByPlatform
                    data={data}
                    isLoading={isLoading}
                />
            </article>
        </section>
    )
}

function getStatDisplayValue(value: number) {
    const normalValue = convertScientificToNormal(value);
    const VALUE = isLowestValue(normalValue) ? 0.01 : normalValue;

    if (containsNegativeInteger(VALUE)) {
        return `-$${abbreviateNumber(Number(convertNegativeToPositive(VALUE)))}`
    }
    return `${isLowestValue(value) ? "<" : ""} $${abbreviateNumber(VALUE)}`
}
