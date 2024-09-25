"use client"

import React, { MouseEventHandler, Suspense, useContext, useState } from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { columns } from '@/data/table/top-apy-opportunities';
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import TopApyOpportunitiesTable from './table'
import { TChain, TOpportunity, TOpportunityTable, TOpportunityType, TToken } from '@/types'
import { DataTable } from '@/components/ui/data-table'
import { useQuery } from '@tanstack/react-query'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[];
    columns: ColumnDef<TOpportunityTable>[];
}

export default function TopApyOpportunities() {
    const [opportunityType, setOpportunityType] = useState<TOpportunityType>("lend");
    const [searchKeywords, setSearchKeywords] = useState<string>("");
    const { data, isLoading } = useGetOpportunitiesData({ type: opportunityType })
    const { allChainsData } = useContext<any>(AssetsDataContext)

    const tableData = data.map((item) => {
        return {
            tokenSymbol: item.token.symbol,
            tokenLogo: item.token.logo,
            chainLogo: allChainsData?.filter((chain: TChain) => chain.chain_id === Number(item.chain_id))[0]?.logo,
            platformName: item.platform.platform_name,
            platformLogo: item.platform.logo,
            apy_current: item.platform.apy.current,
            max_ltv: item.platform.max_ltv,
            deposits: item.platform.liquidity,
            utilization: item.platform.utilization_rate,
        }
    })

    const toggleOpportunityType = (opportunityType: TOpportunityType): void => {
        setOpportunityType(opportunityType);
    };

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
                            <LendBorrowToggle type={opportunityType} handleToggle={toggleOpportunityType} />
                        </div>
                        <div className="max-w-[156px] w-full">
                            <SearchInput onChange={e => setSearchKeywords(e.target.value)} value={searchKeywords} />
                        </div>
                    </div>
                </div>
                {/* <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                    <ChainSelectorDropdown />
                    <DiscoverFilterDropdown />
                </div> */}
            </div>
            <div className="top-apy-opportunities-content">
                {!isLoading &&
                    <DataTable
                        columns={columns}
                        data={tableData}
                        filters={searchKeywords}
                        setFilters={setSearchKeywords}
                    />}
                {isLoading && (
                    <LoadingSectionSkeleton />
                )}
            </div>
        </section>
    )
}