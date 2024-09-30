"use client";

import ArrowLeftIcon from '@/components/icons/arrow-left-icon';
import MainContainer from '@/components/MainContainer';
import { Button } from '@/components/ui/button';
import React, { useContext, useEffect, useState } from 'react';
import { BodyText, HeadingText, Label } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import ArrowRightIcon from '@/components/icons/arrow-right-icon';
import { Progress } from '@/components/ui/progress';
import { AreaChartStacked } from '@/components/charts/area-chart-stacked';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getTokenLogo } from '@/lib/utils';
import { Period } from '@/types/periodButtons';
import useGetPlatformHistoryData from '@/hooks/useGetPlatformHistoryData';
import { HISTORY_CHART_SELECT_OPTIONS } from '@/constants';
import { AssetsDataContext } from '@/context/data-provider';
import { TToken } from '@/types';

// const EthTokenIcon = "/images/tokens/eth.webp";
// const USDCTokenIcon = "/images/tokens/usdc.webp";
// const PolygonNetworkIcon = "/images/tokens/matic.webp";

export default function PositionManagementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || "";
    const platform_id = searchParams.get("platform_id") || "";
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth);
    const [selectedFilter, setSelectedFilter] = useState<any>(HISTORY_CHART_SELECT_OPTIONS[0]);
    const { allTokensData } = useContext(AssetsDataContext);

    const selectedTokenDetails: TToken | undefined = Object.values(allTokensData).flat(1).find((token: TToken) => token.address === tokenAddress);

    const { data: platformHistoryData, isLoading, isError } = useGetPlatformHistoryData({
        platform_id,
        token: tokenAddress,
        period: selectedRange
    })

    function handleRangeChange(value: Period) {
        setSelectedRange(value)
    }

    const tokenDetails = {
        address: tokenAddress,
        symbol: selectedTokenDetails?.symbol
    }

    const PageHeaderProps = {
        router,
        tokenDetails,
    }

    const PageBodyProps = {
        selectedRange,
        handleRangeChange,
        selectedFilter,
        setSelectedFilter,
        platformHistoryData,
    }

    return (
        <MainContainer className='flex flex-col gap-[45.5px]'>
            <PageHeader {...PageHeaderProps} />
            <PageBody {...PageBodyProps} />
        </MainContainer>
    )
}

function PageHeader({
    router,
    tokenDetails,
}: any) {
    return (
        <section className="header flex flex-col sm:flex-row items-start lg:items-center gap-[24px]">
            <Button className='py-[8px] px-[12px] rounded-3' onClick={() => router.back()}>
                <ArrowLeftIcon width={16} height={16} className='stroke-gray-800' />
            </Button>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[24px] w-full">
                <div className="flex flex-wrap md:items-center gap-[16px]">
                    <div className="flex items-center gap-[12px]">
                        <div className="flex items-center gap-[8px]">
                            <img src={getTokenLogo(tokenDetails?.symbol?.toLocaleLowerCase())} alt="Token logo" width={28} height={28} />
                            <HeadingText level='h4' className='uppercase'>{tokenDetails.symbol}</HeadingText>
                        </div>
                        {/* <BodyText level='body1' weight='medium' className='text-gray-500'>/</BodyText>
                        <div className="flex items-center gap-[8px]">
                            <img src={USDCTokenIcon} alt="Eth token" width={28} height={28} />
                            <HeadingText level='h4' className='uppercase'>USDC</HeadingText>
                        </div> */}
                    </div>
                    {/* <Badge size="md" className='border-0 flex items-center justify-between gap-[16px] pr-[4px] w-fit'>
                        <div className="flex items-center gap-1">
                            <img src={PolygonNetworkIcon} alt="Polygon network" width={16} height={16} className='object-contain' />
                            <Label weight='medium' className='leading-[0]'>Polygon Network</Label>
                        </div>
                        <Button className='flex items-center gap-[4px] hover:bg-secondary-100/15'>
                            <span className="uppercase text-secondary-500 font-medium">aave v3</span>
                            <ArrowRightIcon weight='3' className='stroke-secondary-500 -rotate-45' />
                        </Button>
                    </Badge> */}
                </div>
                <div className="header-right flex flex-col md:flex-row items-start md:items-center gap-[24px]">
                    <div className="flex items-center max-md:justify-between gap-[4px]">
                        <BodyText level='body1' className='text-gray-700 shrink-0'>
                            Suppply APY
                        </BodyText>
                        <Badge variant="green">
                            <BodyText level='body1' weight='medium'>12.24%</BodyText>
                        </Badge>
                    </div>
                    <span className="hidden md:inline-block text-gray">|</span>
                    <div className="flex items-center max-md:justify-between gap-[4px]">
                        <BodyText level='body1' className='text-gray-700 shrink-0'>
                            Borrow Rate
                        </BodyText>
                        <Badge variant="yellow">
                            <BodyText level='body1' weight='medium'>10.32%</BodyText>
                        </Badge>
                    </div>
                </div>
            </div>
        </section>
    )
}

function PageBody({
    selectedRange,
    handleRangeChange,
    selectedFilter,
    setSelectedFilter,
    platformHistoryData
}: any) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[16px]">
            <div className='flex flex-col gap-[16px]'>
                {/* <section className="bg-white bg-opacity-40 pt-[32px] pb-[16px] px-[16px] rounded-6">
                    <div className="px-[16px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-[12px]">
                            <div className="flex items-center gap-[8px]">
                                <BodyText level='body2'>
                                    Liquidation Risk
                                </BodyText>
                                <Badge variant="green">
                                    low risk
                                </Badge>
                            </div>
                            <div className="flex items-center gap-[16px]">
                                <BodyText level='body2'>
                                    Liquidation price
                                </BodyText>
                                <div className="flex items-center gap-[6px]">
                                    <img src={USDCTokenIcon} alt="USDC token" width={16} height={16} />
                                    <BodyText level='body1' weight='medium'>48,428</BodyText>
                                </div>
                            </div>
                        </div>
                        <div className="progress-bar mb-[20px]">
                            <Progress value={20} />
                        </div>
                    </div>
                    <div className="bg-white rounded-4 py-[32px] px-[22px] md:px-[44px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                                <BodyText level='body2'>Your Collateral</BodyText>
                                <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                    <div className="flex items-center gap-[6px]">
                                        <img src={EthTokenIcon} alt="Eth token" width={24} height={24} />
                                        <HeadingText level='h3'>08.97</HeadingText>
                                    </div>
                                    <Button variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                        withdraw
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                                <BodyText level='body2'>Your Borrowing</BodyText>
                                <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                    <div className="flex items-center gap-[6px]">
                                        <img src={USDCTokenIcon} alt="Eth token" width={24} height={24} />
                                        <HeadingText level='h3'>32,781</HeadingText>
                                    </div>
                                    <Button variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                        repay
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section> */}
                <section className="bg-white bg-opacity-40 rounded-6">
                    <AreaChartStacked
                        selectedRange={selectedRange}
                        handleRangeChange={handleRangeChange}
                        selectedFilter={selectedFilter}
                        handleFilterChange={setSelectedFilter}
                        chartData={platformHistoryData.processMap}
                    />
                    <div className="py-[36px] px-[30px] md:px-[55px] flex flex-col md:flex-row md:items-center justify-between gap-10">
                        {
                            APY_CHART_DATA.map((block, blockIndex) => (
                                <div key={blockIndex} className="block-1 flex flex-col md:gap-[12px]">
                                    <BodyText level='body1' className='text-gray-600'>{block.label}</BodyText>
                                    <HeadingText level='h3' className={`${blockIndex === 0 ? "text-[#0EA739]" : ""}`}>{block.value}</HeadingText>
                                </div>
                            ))
                        }
                    </div>
                </section>
            </div>
        </div>
    )
}

const APY_CHART_DATA = [
    {
        label: "Net APY",
        value: "1.92%"
    },
    {
        label: "Loan to value",
        value: "78%"
    },
    {
        label: "Available Liquidity",
        value: "$ 387.21k"
    },
    {
        label: "Loan Threshold",
        value: "76%"
    },
]
