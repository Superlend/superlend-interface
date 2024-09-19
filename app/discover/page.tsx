import React from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { BodyText, HeadingText } from '@/components/ui/typography'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { DataTable } from '@/components/ui/data-table'
import { columns as topApyOpportunitiesCols, TOpportunity } from '@/data/table/top-apy-opportunities';
import SearchInput from '@/components/inputs/SearchInput'
import MainContainer from '@/components/MainContainer'
import InfoTooltip from '@/components/tooltips'
import { RAW_TABLE_DATA } from '@/data/table'
import { columns as trendingLendTokensCols, TTrendingLendTokens } from '@/data/table/trending-lend-tokens'
import { ColumnDef } from '@tanstack/react-table'
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

import { Badge } from '@/components/ui/badge'
import LineGraphBg from '@/components/backgrounds/line-graph'


type TTopApyOpportunitiesTableProps = {
    tableData: TOpportunity[];
    columns: ColumnDef<TTrendingLendTokens>[];
}

type TTrendingLendTokensTableProps = {
    tableData: TTrendingLendTokens[];
    columns: ColumnDef<TTrendingLendTokens>[];
}

async function getTopApyOpportunitiesDummyData(): Promise<TOpportunity[]> {
    // Fetch data from your API here.
    return RAW_TABLE_DATA;
}

async function getTrendingLendTokensDummyData(): Promise<TTrendingLendTokens[]> {
    // Fetch data from your API here.
    return RAW_TABLE_DATA;
}

export default async function Discover() {
    const opportunitiesDummyData = await getTopApyOpportunitiesDummyData();
    const trendingLendTokensDummyData = await getTrendingLendTokensDummyData();

    return (
        <MainContainer className='flex flex-col gap-[72px] px-0'>
            <TopApyOpportunitiesTable tableData={opportunitiesDummyData} columns={topApyOpportunitiesCols} />
            <TopOpportunitiesOnWalletTokens />
            <TrendingLendTokensTable tableData={trendingLendTokensDummyData} columns={trendingLendTokensCols} />
        </MainContainer>
    )
}

function TopApyOpportunitiesTable({ tableData, columns }: TTopApyOpportunitiesTableProps) {
    return (
        <section id='top-apy-opportunities' className="top-apy-opportunities-container flex flex-col gap-[24px] px-5">
            <div className="top-apy-opportunities-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="top-apy-opportunities-header-left shrink-0 w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                        <HeadingText level="h3">Top APY Opportunities</HeadingText>
                        <InfoTooltip />
                    </div>
                    <div className="flex items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className="max-w-[150px] lg:max-w-[250px]">
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
            <div className="top-apy-opportunities-content">
                <DataTable columns={columns} data={tableData} />
            </div>
        </section>
    )
}

function TopOpportunitiesOnWalletTokens() {
    return (
        <section id='top-oppotunities-on-your-wallet-tokens' className="top-oppotunities-on-your-wallet-tokens flex flex-col gap-[24px]">
            <div className="section-header flex items-center gap-[12px] px-5">
                <HeadingText level="h3" className='max-[375px]:max-w-[20ch]'>Top Opportunities on your wallet tokens</HeadingText>
                <InfoTooltip />
            </div>
            <div className="section-content">
                <Carousel>
                    <CarouselContent className='pl-3 sm:pl-5 min-[375px]:mr-5 select-none cursor-grabbing'>
                        {
                            Array.from({ length: 3 }).map((item, index) => (
                                <CarouselItem key={index} className='basis-[330px] min-[375px]:basis-[380px]'>
                                    <Card className='w-full max-w-[330px] min-[375px]:max-w-[380px]'>
                                        <CardContent className='relative bg-white pt-[40px] pb-[21px] pl-[28px] pr-[40px] rounded-b-5'>
                                            <LineGraphBg className='object-cover absolute inset-0 size-full' />
                                            <HeadingText level={'h2'} weight='semibold' className='text-success-text mb-[48px]'>16.48% APY</HeadingText>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-[4px]">
                                                    <BodyText level='body1' weight='medium' className='text-gray-500'>on</BodyText>
                                                    <img src="/images/tokens/usdc.webp" alt="USDC" width={20} height={20} />
                                                    <BodyText level='body1' weight='medium' className='text-gray-800'>USDC</BodyText>
                                                </div>
                                                <div className="flex items-center gap-[8px]">
                                                    <img src="/images/platforms/compound.webp" alt="USDC" width={20} height={20} />
                                                    <BodyText level='body1' weight='medium' className='text-gray-800 capitalize'>compound</BodyText>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className='py-[16px] flex items-center justify-between px-[28px]'>
                                            <BodyText level='body2' weight='medium' className='text-gray-700 capitalize'>Wallet bal: 1,487</BodyText>
                                            <span className="text-gray-500">|</span>
                                            <Badge variant={'blue'}>Ethereum network</Badge>
                                        </CardFooter>
                                    </Card>
                                </CarouselItem>
                            ))
                        }
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    )
}

function TrendingLendTokensTable({ tableData, columns }: TTrendingLendTokensTableProps) {
    return (
        <section id='trending-lend-tokens' className="trending-lend-tokens-container flex flex-col gap-[24px] px-5">
            <div className="trending-lend-tokens-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="trending-lend-tokens-header-left flex-1 flex flex-col min-[500px]:flex-row items-start lg:items-center max-lg:justify-between gap-[20px] lg:gap-[12px]">
                    <div className="flex shrink-0 items-center gap-[12px]">
                        <HeadingText level="h3">Trending Lend Tokens</HeadingText>
                        <InfoTooltip />
                    </div>
                    <div className="md:max-w-[200px] w-full">
                        <SearchInput />
                    </div>
                </div>
                <div className="filter-dropdowns-container hidden lg:flex flex-1 items-center justify-end gap-[12px]">
                    <ChainSelectorDropdown />
                    <DiscoverFilterDropdown />
                </div>
            </div>
            <div className="trending-lend-tokens-content">
                <DataTable columns={columns} data={tableData} />
            </div>
        </section>
    )
}
