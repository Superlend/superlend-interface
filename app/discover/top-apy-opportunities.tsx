"use client"

import React, { useContext, useEffect, useState } from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { columns } from '@/data/table/top-apy-opportunities';
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { TChain, TOpportunityTable, TPositionType, TToken } from '@/types'
import { DataTable } from '@/components/ui/data-table'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import { OpportunitiesContext } from '@/context/opportunities-provider'
import { useRouter } from 'next/navigation'
// import useDimensions from '@/hooks/useDimensions'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[];
    columns: ColumnDef<TOpportunityTable>[];
}

export default function TopApyOpportunities() {
    // const { width: screenWidth } = useDimensions();
    const { filters, positionType, setPositionType } = useContext<any>(OpportunitiesContext);
    const [searchKeywords, setSearchKeywords] = useState<string>("");
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    });
    const router = useRouter();
    const {
        data: opportunitiesData,
        isLoading: isLoadingOpportunitiesData
    } = useGetOpportunitiesData({
        type: positionType,
        chain_ids: filters.chain_ids,
        tokens: filters.token_ids
    });
    const { allChainsData } = useContext<any>(AssetsDataContext);

    useEffect(() => {
        setColumnVisibility(() => {
            if (positionType === "lend") {
                return {
                    deposits: true,
                    borrows: false,
                }
            }

            return {
                deposits: false,
                borrows: true,
            }
        })
    }, [positionType])

    const rawTableData: TOpportunityTable[] = opportunitiesData.map((item) => {
        return {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: allChainsData?.filter((chain: TChain) => chain.chain_id === Number(item.chain_id))[0]?.logo,
            chain_id: item.chain_id,
            chainName: allChainsData.find((chain: any) => Number(chain.chain_id) === Number(item.chain_id))?.name || "",
            platform_id: item.platform.platform_name,
            platformName: `${item.platform.platform_name.split("-")[0]}`,
            platformLogo: item.platform.logo,
            apy_current: item.platform.apy.current,
            max_ltv: item.platform.max_ltv,
            deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
            borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
            utilization: item.platform.utilization_rate,
        }
    });

    const filteredTableData = rawTableData.filter((opportunity) => {
        return filters.platform_ids.includes(opportunity.platformName)
    });

    const tableData = filters.platform_ids.length > 0 ? filteredTableData : rawTableData;

    function handleRowClick(rowData: any) {
        const { tokenAddress, platform_id, chain_id } = rowData;
        const url = `/position-management?token=${tokenAddress}&platform_id=${platform_id}&chain_id=${chain_id}`
        router.push(url);
    }

    const toggleOpportunityType = (positionType: TPositionType): void => {
        setPositionType(positionType);
    };

    function handleKeywordChange(e: any) {
        setSearchKeywords(e.target.value)
    }

    function handleClearSearch() {
        setSearchKeywords("");
    }

    return (
        <section id='top-apy-opportunities' className="top-apy-opportunities-container flex flex-col gap-[24px] px-5">
            <div className="top-apy-opportunities-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="top-apy-opportunities-header-left shrink-0 w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center justify-between gap-[12px] max-lg:w-full">
                        <div className="flex items-center gap-[12px]">
                            <HeadingText level="h3" weight='semibold'>Top Money Markets</HeadingText>
                            <InfoTooltip content="List of assets from different lending protocols across various chains, offering good APYs" />
                        </div>
                        {/* Filter button for Tablet and below screens */}
                        <div className="block lg:hidden">
                            <DiscoverFilterDropdown />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className="w-full sm:max-w-[150px] lg:max-w-[250px]">
                            <LendBorrowToggle type={positionType} handleToggle={toggleOpportunityType} />
                        </div>
                        <div className="sm:max-w-[156px] w-full">
                            <SearchInput onChange={handleKeywordChange} onClear={handleClearSearch} value={searchKeywords} />
                        </div>
                    </div>
                </div>
                {/* Filter buttons for Desktop and above screens */}
                <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                    {/* <ChainSelectorDropdown /> */}
                    <DiscoverFilterDropdown />
                </div>
            </div>
            <div className="top-apy-opportunities-content">
                {!isLoadingOpportunitiesData &&
                    <DataTable
                        columns={columns}
                        data={tableData}
                        filters={searchKeywords}
                        setFilters={setSearchKeywords}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                    />}
                {isLoadingOpportunitiesData && (
                    <LoadingSectionSkeleton />
                )}
            </div>
        </section>
    )
}