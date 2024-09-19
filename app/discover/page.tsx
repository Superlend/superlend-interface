import React from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
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
        <MainContainer className='flex flex-col gap-[72px]'>
            <TopApyOpportunitiesTable tableData={opportunitiesDummyData} columns={topApyOpportunitiesCols} />
            <TrendingLendTokensTable tableData={trendingLendTokensDummyData} columns={trendingLendTokensCols} />
        </MainContainer>
    )
}

function TopApyOpportunitiesTable({ tableData, columns }: TTopApyOpportunitiesTableProps) {
    return (
        <section className="top-apy-opportunities-container flex flex-col gap-[24px]">
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

function TrendingLendTokensTable({ tableData, columns }: TTrendingLendTokensTableProps) {
    return (
        <section className="top-apy-opportunities-container flex flex-col gap-[24px]">
            <div className="top-apy-opportunities-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="top-apy-opportunities-header-left flex-1 flex flex-col min-[500px]:flex-row items-start lg:items-center max-lg:justify-between gap-[20px] lg:gap-[12px]">
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
            <div className="top-apy-opportunities-content">
                <DataTable columns={columns} data={tableData} />
            </div>
        </section>
    )
}
