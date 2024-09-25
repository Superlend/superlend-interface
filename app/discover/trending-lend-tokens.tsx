import React from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { DataTable } from '@/components/ui/data-table'
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips'
import { columns, TTrendingLendTokens } from '@/data/table/trending-lend-tokens'
import { ColumnDef } from '@tanstack/react-table'

type TTrendingLendTokensProps = {
    tableData: TTrendingLendTokens[];
    columns: ColumnDef<TTrendingLendTokens>[];
}

export default function TrendingLendTokens() {
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
            {/* <div className="trending-lend-tokens-content">
                <DataTable columns={columns} data={[]} />
            </div> */}
        </section>
    )
}