"use client"

import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { columns } from '@/data/table/top-apy-opportunities';
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { TChain, TOpportunityTable, TPositionType, TToken } from '@/types'
import { DataTable } from '@/components/ui/data-table'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import { OpportunitiesContext } from '@/context/opportunities-provider'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import useDimensions from '@/hooks/useDimensions'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { motion } from 'framer-motion'
import { useDebounce } from '@/hooks/useDebounce';

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[];
    columns: ColumnDef<TOpportunityTable>[];
}

export default function TopApyOpportunities() {
    const router = useRouter();
    const updateSearchParams = useUpdateSearchParams();
    const searchParams = useSearchParams();
    const positionTypeParam = searchParams.get("position_type") || "lend";
    const tokenIdsParam = searchParams.get('token_ids')?.split(',') || [];
    const chainIdsParam = searchParams.get('chain_ids')?.split(',') || [];
    const platformIdsParam = searchParams.get('protocol_ids')?.split(',') || [];
    const keywordsParam = searchParams.get("keywords") || "";
    const pageParam = searchParams.get('page');
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'apy_current', desc: positionTypeParam === "lend" },
    ]);
    const [keywords, setKeywords] = useState<string>(keywordsParam);
    const debouncedKeywords = useDebounce(keywords, 300);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: Number(pageParam) || 0,
        pageSize: 10,
    });
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    });
    const [isTableLoading, setIsTableLoading] = useState(false);
    const {
        data: opportunitiesData,
        isLoading: isLoadingOpportunitiesData
    } = useGetOpportunitiesData({
        type: positionTypeParam as TPositionType,
        chain_ids: chainIdsParam.map(id => Number(id)),
        tokens: tokenIdsParam
    });
    const { allChainsData } = useContext<any>(AssetsDataContext);

    // Add this ref at component level
    const prevParamsRef = useRef(searchParams.toString());

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionTypeParam === "lend",
                borrows: positionTypeParam === "borrow",
            }
        })
        setSorting([{ id: 'apy_current', desc: positionTypeParam === "lend" }])
    }, [positionTypeParam])

    useEffect(() => {
        const params = { keywords: !!debouncedKeywords.trim().length ? debouncedKeywords : undefined }
        updateSearchParams(params)
    }, [debouncedKeywords])

    // Update pagination state when URL changes
    useEffect(() => {
        const pageParam = searchParams.get('page');
        if (pageParam !== null) {
            const pageIndex = Math.max(0, parseInt(pageParam) - 1);
            setPagination(prev => ({
                ...prev,
                pageIndex
            }));
        } else {
            // Reset to first page if no page param
            setPagination(prev => ({
                ...prev,
                pageIndex: 0
            }));
        }
    }, [searchParams]);

    // Add this new effect to reset pagination when other search params change
    useEffect(() => {
        // Create a new URLSearchParams object
        const currentParams = new URLSearchParams(searchParams.toString());
        const pageParam = currentParams.get('page');

        // Only reset page if filters have changed
        const hasFilterChanged = (prevParams: string, currentParams: URLSearchParams) => {
            const filterParams = ['position_type', 'token_ids', 'chain_ids', 'protocol_ids', 'keywords'];
            const prevFilters = new URLSearchParams(prevParams);

            return filterParams.some(param =>
                prevFilters.get(param) !== currentParams.get(param)
            );
        };

        if (hasFilterChanged(prevParamsRef.current, currentParams) && pageParam !== '1') {
            updateSearchParams({ page: '1' });
        }

        prevParamsRef.current = searchParams.toString();
    }, [
        searchParams.get('position_type'),
        searchParams.get('token_ids'),
        searchParams.get('chain_ids'),
        searchParams.get('protocol_ids'),
        searchParams.get('keywords')
    ]);

    const rawTableData: TOpportunityTable[] = opportunitiesData.map((item) => {
        return {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: allChainsData?.filter((chain: TChain) => chain.chain_id === Number(item.chain_id))[0]?.logo,
            chain_id: item.chain_id,
            chainName: allChainsData.find((chain: any) => Number(chain.chain_id) === Number(item.chain_id))?.name || "",
            protocol_identifier: item.platform.protocol_identifier,
            platformName: `${item.platform.name}`,
            platformId: `${item.platform.platform_name}`,
            platformLogo: item.platform.logo,
            apy_current: item.platform.apy.current,
            max_ltv: item.platform.max_ltv,
            deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
            borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
            utilization: item.platform.utilization_rate,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
        }
    });

    const filteredTableDataByPlatformIds = rawTableData.filter((opportunity) => {
        return platformIdsParam.includes(opportunity.platformId.split("-")[0])
    });

    const tableData = platformIdsParam.length > 0 ? filteredTableDataByPlatformIds : rawTableData;

    // Calculate total number of pages
    const totalPages = Math.ceil(tableData.length / 10);

    // Handle pagination changes
    const handlePaginationChange = useCallback((updatedPagination: PaginationState) => {
        const newPage = updatedPagination.pageIndex + 1;
        const currentPage = Number(searchParams.get('page')) || 1;

        // Only update if page actually changes and is within valid range
        if (newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
            updateSearchParams({
                page: newPage.toString()
            });
        }
    }, [updateSearchParams, searchParams, totalPages]);

    function handleRowClick(rowData: any) {
        const { tokenAddress, protocol_identifier, chain_id } = rowData;
        const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}`
        router.push(url);
    }

    const toggleOpportunityType = (positionType: TPositionType): void => {
        const params = { position_type: positionType }
        updateSearchParams(params)
    };

    function handleKeywordChange(e: any) {
        setKeywords(e.target.value)
        // Trigger table UI loading for 1 second
        setIsTableLoading(true);
        setTimeout(() => {
            setIsTableLoading(false);
        }, 1000);
    }

    function handleClearSearch() {
        setKeywords("")
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
                            <LendBorrowToggle type={positionTypeParam as TPositionType} handleToggle={toggleOpportunityType} />
                        </div>
                        <div className="sm:max-w-[156px] w-full">
                            <SearchInput onChange={handleKeywordChange} onClear={handleClearSearch} value={keywords} />
                        </div>
                    </div>
                </div>
                {/* Filter buttons for Desktop and above screens */}
                <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                    {/* <ChainSelectorDropdown /> */}
                    <DiscoverFilterDropdown />
                </div>
            </div>
            <motion.div
                className="top-apy-opportunities-content will-change-transform"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
                {!isLoadingOpportunitiesData && !isTableLoading && (
                    <DataTable
                        columns={columns}
                        data={tableData}
                        filters={keywords}
                        setFilters={handleKeywordChange}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        sorting={sorting}
                        setSorting={setSorting}
                        pagination={pagination}
                        setPagination={handlePaginationChange}
                        totalPages={Math.ceil(tableData.length / 10)}
                    />
                )}
                {(isLoadingOpportunitiesData || isTableLoading) && (
                    <LoadingSectionSkeleton />
                )}
            </motion.div>
        </section>
    )
}
