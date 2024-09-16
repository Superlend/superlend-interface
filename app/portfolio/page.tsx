import { AreaChartStacked } from '@/components/charts/area-chart-stacked'
import { RadialChartStacked } from '@/components/charts/radial-chart-stacked'
import MainContainer from '@/components/MainContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import React from 'react'
import ImageWithBadge from '@/components/ImageWithBadge'
import ArrowRightIcon from '@/components/icons/arrow-right-icon'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import LendBorrowToggle from '@/components/LendBorrowToggle'
import SearchInput from '@/components/inputs/SearchInput'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/data/table/all-positions'
import { POSITIONS_AT_RISK_DATA, POSITIONS_BREAKDOWN_DATA } from '@/data/portfolio-page'

async function getAllPositionsDummyData(): Promise<any[]> {
    // Fetch data from your API here.
    return [
        {
            token: "wBTC",
            chain: "Polygon",
            platform: "Aave",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/aave.webp",
        },
        {
            token: "USDC",
            chain: "Op",
            platform: "Compound",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/usdc.webp",
            chain_image: "/images/chains/op.webp",
            platform_image: "/images/platforms/compound.webp",
        },
        {
            token: "wBTC",
            chain: "matic",
            platform: "Euler",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/euler.webp",
        },
        {
            token: "Eth",
            chain: "matic",
            platform: "Morpho",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/eth.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/morpho.webp",
        },
    ]
}

export default async function Portfolio() {
    const allPositionsDummyData = await getAllPositionsDummyData();

    return (
        <MainContainer>
            <section className="portfolio-page-header flex flex-col md:flex-row gap-[16px] items-start md:items-center justify-between mb-[24px] ">
                <div className="flex flex-col gap-[4px]">
                    <HeadingText level="h4">Your Portfolio</HeadingText>
                    <BodyText level='body1' className='text-gray-600'>Track all your lend and borrow positions from one place</BodyText>
                </div>
                <Button variant="primary" className='group uppercase py-[9px] px-[16px] flex items-center gap-[4px]'>
                    transaction history
                    <ArrowRightIcon width={16} height={16} weight='2' className='stroke-white group-hover:opacity-75 group-active:opacity-75' />
                </Button>
            </section>
            <div className="flex flex-col gap-[72px]">
                <section id='your-positions' className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_380px] gap-[16px] ">
                    <article>
                        <Card>
                            <div className="positions-net-worth-block px-[24px] md:px-[32px] pt-[28px] flex flex-col sm:flex-row sm:items-center gap-[29px] pb-[24px]">
                                <div className="shrink-0">
                                    <HeadingText level='h2'>$ 51,344</HeadingText>
                                    <BodyText level='body1' className='text-gray-600'>Your Positions Net worth</BodyText>
                                </div>
                                <Card className='w-full'>
                                    <CardContent className='bg-white py-[25px] sm:px-[44px] flex flex-col md:flex-row sm:items-center justify-between gap-[20px]'>
                                        {
                                            POSITIONS_BREAKDOWN_DATA.map((position, positionIndex) => (
                                                <>
                                                    <div key={position.id} className="data-block-1">
                                                        <BodyText level='body1' weight='medium'>$ {position.data}</BodyText>
                                                        <Label className="text-gray-600 text-success-500">Your {position.label}</Label>
                                                    </div>
                                                    <span className="hidden md:inline text-gray-500 [&:nth-child(6)]:hidden">|</span>
                                                </>
                                            ))
                                        }
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="bg-white rounded-t-6">
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
                            </div>
                        </Card>
                    </article>
                    <article>
                        <RadialChartStacked />
                    </article>
                </section>
                <section id='your-positions-at-risk'>
                    <div className="flex items-center gap-[12px] mb-[24px] ">
                        <HeadingText level='h3'>Your Positions at Risk</HeadingText>
                        <Image src="/icons/info-circle-icon.svg" alt="info" width={16} height={16} className='object-contain cursor-pointer' />
                    </div>
                    <Carousel className='md:[mask-image:linear-gradient(to_left,transparent,white_5%)]'>
                        <CarouselContent className='pl-0'>
                            {
                                [
                                    ...POSITIONS_AT_RISK_DATA,
                                    ...POSITIONS_AT_RISK_DATA,
                                    ...POSITIONS_AT_RISK_DATA,
                                    ...POSITIONS_AT_RISK_DATA,
                                    ...POSITIONS_AT_RISK_DATA,
                                    ...POSITIONS_AT_RISK_DATA,
                                ]
                                    .map((positions, index) => (
                                        <CarouselItem key={index} className='basis-[90%] min-[450px]:basis-[380px] md:basis-[380px]'>
                                            <Card className='w-full max-w-[380px]'>
                                                <CardContent className='bg-white rounded-b-6 py-[22px] px-[26px] divide-y divide-gray-400'>
                                                    <div className="flex items-center justify-between pb-[17px]">
                                                        <div className="lend-amount-block flex flex-col gap-[4px]">
                                                            <Label className='capitalize text-gray-600'>Lend amount</Label>
                                                            <div className="flex items-center gap-[4px]">
                                                                <Image width={16} height={16} alt="" src={positions.lendAmount.tokenImage} />
                                                                <BodyText level={'body2'} weight='medium'>$ {positions.lendAmount.amount}</BodyText>
                                                            </div>
                                                        </div>
                                                        <div className="borrow-amount-block flex flex-col gap-[4px]">
                                                            <Label className='capitalize text-gray-600'>Borrow amount</Label>
                                                            <div className="flex items-center justify-end gap-[4px]">
                                                                <BodyText level={'body2'} weight='medium'>$ {positions.borrowAmount.amount}</BodyText>
                                                                <Image width={16} height={16} alt="" src={positions.borrowAmount.tokenImage} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-[17px]">
                                                        <div className="position-on-block flex items-center gap-[8px]">
                                                            <ImageWithBadge
                                                                mainImg={positions.positionOn.platformImage}
                                                                badgeImg={positions.positionOn.chainImage}
                                                            />
                                                            <div className="flex flex-col">
                                                                <Label className='capitalize text-gray-600'>Position on</Label>
                                                                <BodyText level={'body2'} weight='medium' className='capitalize text-wrap break-words max-w-[10ch]'>{positions.positionOn.platform}</BodyText>
                                                            </div>
                                                        </div>
                                                        <div className="risk-factor-block flex flex-col items-end gap-[4px]">
                                                            <Label className='capitalize text-gray-600'>Risk factor</Label>
                                                            <Badge variant="destructive">{positions.riskFactor}</Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className='py-[16px] flex flex-col md:flex-row item-center justify-between gap-[5px] md:gap-[14px]'>
                                                    <BodyText level='body2' weight='medium' className='text-gray-600'>Recommended action</BodyText>
                                                    <span className="hidden md:block text-gray-500">|</span>
                                                    <Button variant="link" className='group uppercase flex items-center gap-[4px]'>
                                                        Add collateral
                                                        <ArrowRightIcon width={16} height={16} weight='2' className='stroke-secondary-500 group-hover:opacity-75 group-active:opacity-75' />
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </CarouselItem>
                                    ))
                            }
                        </CarouselContent>
                    </Carousel>
                </section>
                <section className="all-positions-container flex flex-col gap-[24px]">
                    <div className="all-positions-header flex items-end lg:items-center justify-between gap-[12px]">
                        <div className="all-positions-header-left w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                            <div className="flex items-center gap-[12px]">
                                <HeadingText level="h3">All positions</HeadingText>
                                <Image src="/icons/info-circle-icon.svg" alt="info" width={16} height={16} className='object-contain cursor-pointer' />
                            </div>
                            <div className="flex items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                                <div className="max-w-[150px] md:max-w-[250px]">
                                    <LendBorrowToggle />
                                </div>
                                <div className="max-w-[156px] w-full">
                                    <SearchInput />
                                </div>
                            </div>
                        </div>
                        <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                            <ChainSelectorDropdown />
                            <DiscoverFilterDropdown />
                        </div>
                    </div>
                    <div className="all-positions-content">
                        <DataTable columns={columns} data={allPositionsDummyData} />
                    </div>
                </section>
            </div>
        </MainContainer>
    )
}
