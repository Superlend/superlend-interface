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

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[];
    columns: ColumnDef<TOpportunityTable>[];
}

export default function TopApyOpportunities() {
    const updateSearchParams = useUpdateSearchParams();
    const searchParams = useSearchParams();
    const positionTypeParam = searchParams.get("position_type") || "lend";
    const tokenIdsParam = searchParams.get('token_ids')?.split(',') || [];
    const chainIdsParam = searchParams.get('chain_ids')?.split(',') || [];
    const platformIdsParam = searchParams.get('platform_ids')?.split(',') || [];
    const keywordsParam = searchParams.get("keywords") || "";
    const { width: screenWidth } = useDimensions();
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'apy_current', desc: positionTypeParam === "lend" },
    ]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    });
    const router = useRouter();
    const pathname = usePathname();
    const {
        data: opportunitiesData,
        isLoading: isLoadingOpportunitiesData
    } = useGetOpportunitiesData({
        type: positionTypeParam as TPositionType,
        chain_ids: chainIdsParam.map(id => Number(id)),
        tokens: tokenIdsParam
    });
    const { allChainsData } = useContext<any>(AssetsDataContext);
    // const initialState = {
    //     sorting: [
    //         {
    //             id: "apy_current",
    //             desc: true
    //         }
    //     ]
    // }

    const lastParamString = useRef('');
    const isInitialMount = useRef(true);

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionTypeParam === "lend",
                borrows: positionTypeParam === "borrow",
            }
        })
    }, [positionTypeParam])

    useEffect(() => {
        setSorting([{ id: 'apy_current', desc: positionTypeParam === "lend" }])
    }, [positionTypeParam])

    const updatePageInUrl = useCallback((newPage: number) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("page", newPage.toString());
        router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    const resetPageOnParamChange = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            pageIndex: 0
        }));
        updatePageInUrl(1);
    }, [updatePageInUrl]);

    useEffect(() => {
        const currentParams = new URLSearchParams(searchParams.toString());
        const currentPage = currentParams.get('page');
        currentParams.delete('page'); // Remove page from comparison
        
        const paramString = currentParams.toString();
        
        if (isInitialMount.current) {
            // On initial mount, set the page from URL if it exists
            if (currentPage) {
                const pageIndex = Math.max(0, parseInt(currentPage) - 1);
                setPagination(prev => ({ ...prev, pageIndex }));
            }
            isInitialMount.current = false;
        } else {
            // Only reset page if other params changed (not including page)
            if (paramString !== lastParamString.current) {
                resetPageOnParamChange();
            } else if (currentPage) {
                // If only page changed, update pagination state
                const pageIndex = Math.max(0, parseInt(currentPage) - 1);
                setPagination(prev => ({ ...prev, pageIndex }));
            }
        }
        
        lastParamString.current = paramString;
    }, [searchParams, resetPageOnParamChange]);

    const handlePaginationChange = useCallback((updatedPagination: PaginationState) => {
        const newPageIndex = updatedPagination.pageIndex;
        setPagination(prev => ({
            ...prev,
            pageIndex: newPageIndex
        }));
        updatePageInUrl(newPageIndex + 1);
    }, [updatePageInUrl]);

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
        return platformIdsParam.includes(opportunity.platformName)
    });

    const tableData = platformIdsParam.length > 0 ? filteredTableData : rawTableData;

    const paginatedData = useMemo(() => {
        const startIndex = pagination.pageIndex * pagination.pageSize;
        return tableData.slice(startIndex, startIndex + pagination.pageSize);
    }, [tableData, pagination.pageIndex, pagination.pageSize]);

    function handleRowClick(rowData: any) {
        if (screenWidth < 768) return;

        const { tokenAddress, platform_id, chain_id } = rowData;
        const url = `/position-management?token=${tokenAddress}&platform_id=${platform_id}&chain_id=${chain_id}`
        router.push(url);
    }

    const toggleOpportunityType = (positionType: TPositionType): void => {
        const params = { position_type: positionType }
        updateSearchParams(params)
    };

    function handleKeywordChange(e: any) {
        const params = { keywords: !!e.target.value.trim().length ? e.target.value : undefined, page: undefined }
        updateSearchParams(params)
    }

    function handleClearSearch() {
        const params = { keywords: undefined, page: undefined }
        updateSearchParams(params)
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
                            <SearchInput onChange={handleKeywordChange} onClear={handleClearSearch} value={keywordsParam} />
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
                        data={paginatedData}
                        totalRows={tableData.length}
                        filters={keywordsParam}
                        setFilters={handleKeywordChange}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        // initialState={initialState}
                        sorting={sorting}
                        setSorting={setSorting}
                        pagination={pagination}
                        setPagination={handlePaginationChange}
                    />}
                {isLoadingOpportunitiesData && (
                    <LoadingSectionSkeleton />
                )}
            </div>
        </section>
    )
}
