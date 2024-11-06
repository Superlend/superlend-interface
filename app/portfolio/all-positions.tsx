"use client";

import AllPositionsFiltersDropdown from '@/components/dropdowns/AllPositionsFiltersDropdown';
import SearchInput from '@/components/inputs/SearchInput';
import LendBorrowToggle from '@/components/LendBorrowToggle';
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection';
import InfoTooltip from '@/components/tooltips/InfoTooltip';
import { DataTable } from '@/components/ui/all-positions-table';
import { HeadingText } from '@/components/ui/typography'
import { AssetsDataContext } from '@/context/data-provider';
import { PositionsContext } from '@/context/positions-provider';
import { columns, TPositionsTable } from '@/data/table/all-positions';
import useDimensions from '@/hooks/useDimensions';
import useGetPortfolioData from '@/hooks/useGetPortfolioData';
import { calculateScientificNotation } from '@/lib/utils';
import { TChain, TPositionType } from '@/types';
import { SortingState } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react'
import { useAccount } from 'wagmi';

type TProps = {
    walletAddress: `0x${string}` | undefined
}
export default function AllPositions({
    walletAddress
}: TProps) {
    const router = useRouter();
    const { width: screenWidth } = useDimensions();
    const { filters, positionType, setPositionType } = useContext(PositionsContext);
    const [searchKeywords, setSearchKeywords] = useState<string>("");
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'apy', desc: positionType === "lend" },
    ]);
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    });
    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData
    } = useGetPortfolioData({
        user_address: walletAddress,
        position_type: positionType,
        chain_id: filters.chain_ids,
        platform_id: filters.platform_ids,
    });
    const { allChainsData } = useContext(AssetsDataContext);

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionType === "lend",
                borrows: positionType === "borrow",
            }
        })
    }, [positionType])

    useEffect(() => {
        setSorting([{ id: 'apy', desc: positionType === "lend" }])
    }, [positionType])

    const POSITIONS = portfolioData?.platforms?.flatMap(platform => {
        return platform.positions.map(position => {
            const chainDetails = allChainsData.find(chain => Number(chain.chain_id) === Number(platform.chain_id));
            return {
                ...position,
                platform: {
                    ...platform,
                    positions: null
                },
                chain: {
                    chain_id: platform.chain_id ?? "",
                    logo: chainDetails?.logo ?? "",
                    chain_name: chainDetails?.name ?? ""
                }
            }
        })
    }).flat(portfolioData?.platforms.length);

    const rawTableData: TPositionsTable[] = POSITIONS?.map((item) => {

        return {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: item.chain.logo,
            chain_id: item.chain.chain_id,
            chainName: item.chain.chain_name,
            platform_id: item.platform.platform_name,
            platformName: `${item.platform.platform_name.split("-")[0]}`,
            platformLogo: item.platform.logo,
            apy: item.platform.net_apy,
            deposits: calculateScientificNotation(item.amount.toString(), item.token.price_usd.toString(), "multiply").toFixed(10),
            borrows: calculateScientificNotation(item.amount.toString(), item.token.price_usd.toString(), "multiply").toFixed(10),
            earnings: item.platform.pnl,
        }
    });

    const filteredTableData = rawTableData.filter((position) => {
        return filters.token_ids.includes(position.tokenSymbol)
    });

    const tableData = filters.token_ids.length > 0 ? filteredTableData : rawTableData;

    function handleRowClick(rowData: any) {
        if (screenWidth < 768) return;

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
        <section id='all-positions' className="all-positions-container flex flex-col gap-[24px] px-5">
            <div className="all-positions-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="all-positions-header-left w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                        <HeadingText level="h3" weight='semibold'>All positions</HeadingText>
                        <InfoTooltip />
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
                    <AllPositionsFiltersDropdown />
                </div>
            </div>
            <div className="all-positions-content">
                {!isLoadingPortfolioData &&
                    <DataTable
                        columns={columns}
                        data={tableData}
                        filters={searchKeywords}
                        setFilters={setSearchKeywords}
                        // handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        sorting={sorting}
                        setSorting={setSorting}
                        noDataMessage={"No positions"}
                    // pagination={undefined}
                    // setPagination={undefined}
                    />}
                {isLoadingPortfolioData && (
                    <LoadingSectionSkeleton />
                )}
            </div>
        </section>
    )
}
