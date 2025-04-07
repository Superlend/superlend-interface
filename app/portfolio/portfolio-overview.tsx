'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import React, { useContext } from 'react'
import {
    abbreviateNumber,
    containsNegativeInteger,
    convertNegativeToPositive,
    isLowestValue,
    scientificToDecimal,
} from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPositionsByPlatform } from '@/components/charts/user-positions-pie-chart'
import { PortfolioContext } from '@/context/portfolio-provider'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import PointsWithCheckInCard from '@/components/PointsWithCheckInCard'
import DigitAnimatedNumber from '@/components/ui/digit-animated-number'

export default function PortfolioOverview() {
    const { portfolioData, isLoadingPortfolioData, isErrorPortfolioData } =
        useContext(PortfolioContext)

    const COLLATERAL = getStatDisplayValue(portfolioData?.total_supplied)
    const BORROWINGS = getStatDisplayValue(portfolioData?.total_borrowed)
    const NET_WORTH = getStatDisplayValue(
        Number(portfolioData?.total_supplied ?? 0) -
        Number(portfolioData?.total_borrowed ?? 0)
    )
    const EARNINGS = getStatDisplayValue(
        portfolioData?.platforms.reduce(
            (acc, curr) => acc + scientificToDecimal(curr.pnl),
            0
        )
    )

    const POSITIONS_BREAKDOWN_DATA = [
        {
            label: 'collateral',
            data: COLLATERAL,
            id: 1,
            icon: (
                <img
                    src="/icons/hand-money.svg"
                    alt="Wallet Money Icon"
                    className="w-6 h-6"
                />
            ),
        },
        {
            label: 'borrowings',
            data: BORROWINGS,
            id: 2,
            icon: (
                <img
                    src="/icons/cash-out.svg"
                    alt="Cash Out Icon"
                    className="w-6 h-6"
                />
            ),
        },
        {
            label: 'earnings',
            data: EARNINGS,
            id: 3,
            icon: (
                <img
                    src="/icons/wallet-money.svg"
                    alt="Earnings Icon"
                    className="w-6 h-6"
                />
            ),
            valueTooltip: 'Your earnings from Aave V3 positions only',
        },
    ]

    return (
        <section
            id="your-stats"
            className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_380px] gap-[16px] px-5"
        >
            <article>
                <Card className="h-full">
                    <div className="positions-net-worth-block h-full px-[24px] md:px-[32px] pt-[28px] flex flex-col items-start justify-between gap-[29px] pb-[24px]">
                        <div className="flex flex-wrap justify-between w-full gap-4">
                            <div className="shrink-0">
                                {isLoadingPortfolioData && (
                                    <Skeleton className="h-10 w-[75%] bg-gray-400 rounded-3" />
                                )}
                                {!isLoadingPortfolioData && (
                                    <HeadingText
                                        level="h2"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        <DigitAnimatedNumber 
                                            value={NET_WORTH.replace(/[<$]/g, '')} 
                                            prefix="$" 
                                            hasLowestValuePrefix={NET_WORTH.includes('<')}
                                            digitClassName="h2 font-medium"
                                        />
                                    </HeadingText>
                                )}
                                <BodyText level="body1" className="text-gray-600">
                                    Your Positions Net worth
                                </BodyText>
                            </div>
                            <div className="flex items-center max-md:w-full">
                                <PointsWithCheckInCard />
                            </div>
                        </div>
                        <Card className="w-full">
                            <CardContent className="bg-white py-[25px] sm:px-[44px] flex flex-col md:flex-row sm:items-center justify-between gap-[20px]">
                                {POSITIONS_BREAKDOWN_DATA.map(
                                    (position, positionIndex) => (
                                        <React.Fragment key={positionIndex}>
                                            <div className="data-block-1">
                                                {isLoadingPortfolioData && (
                                                    <Skeleton className="h-6 w-16 bg-gray-300 rounded-3" />
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    {!isLoadingPortfolioData &&
                                                        position.icon}
                                                    {!isLoadingPortfolioData && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <BodyText
                                                                level="body1"
                                                                weight="medium"
                                                                className="leading-none text-gray-800"
                                                            >
                                                                <DigitAnimatedNumber 
                                                                    value={position.data.replace(/[<$]/g, '')} 
                                                                    prefix="$" 
                                                                    hasLowestValuePrefix={position.data.includes('<')}
                                                                    digitClassName="font-medium"
                                                                />
                                                            </BodyText>
                                                            {position.valueTooltip && (
                                                                <InfoTooltip
                                                                    side="bottom"
                                                                    content={position.valueTooltip}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    <Label className="text-gray-600 capitalize">
                                                        Your {position.label}
                                                    </Label>
                                                </div>
                                            </div>
                                            <span className="hidden md:inline text-gray-400 [&:nth-child(6)]:hidden">
                                                |
                                            </span>
                                        </React.Fragment>
                                    )
                                )}
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
            <article className="h-full">
                <UserPositionsByPlatform
                    data={portfolioData}
                    isLoading={isLoadingPortfolioData}
                />
            </article>
        </section>
    )
}

function getStatDisplayValue(value: number) {
    const normalValue = scientificToDecimal(value)
    const VALUE = isLowestValue(Math.abs(normalValue))
        ? (normalValue < 0 ? '-' : '') + 0.01
        : abbreviateNumber(normalValue)
    const hasLowestValue = isLowestValue(Math.abs(normalValue))

    if (containsNegativeInteger(VALUE)) {
        return `${hasLowestValue ? '<' : ''} -$${abbreviateNumber(Number(convertNegativeToPositive(VALUE)))}`
    }
    return `${hasLowestValue ? '<' : ''} $${VALUE}`
}
