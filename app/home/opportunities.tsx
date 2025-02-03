'use client'

import React, {
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import { OpportunitiesDataTable } from '@/components/tables/opportunities-data-table'
import { columns } from '@/data/table/opportunities'
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { TOpportunityTable, TPositionType } from '@/types'
import { TChain } from '@/types/chain'
import { DataTable } from '@/components/ui/data-table'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import { OpportunitiesContext } from '@/context/opportunities-provider'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import useDimensions from '@/hooks/useDimensions'
import DiscoverFiltersDropdown from '@/components/dropdowns/DiscoverFiltersDropdown'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { motion } from 'framer-motion'
import { useDebounce } from '@/hooks/useDebounce'
import { PlatformType } from '@/types/platform'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[]
    columns: ColumnDef<TOpportunityTable>[]
}

const EXCLUDE_DEPRICATED_MORPHO_ASSET_BY_PROTOCOL = '0x3d819db807d8f8ca10dfef283a3cf37d5576a2abcec9cfb6874efd2df8f4b6ed'

export default function Opportunities({
    positionType,
    opportunitiesData,
    isLoadingOpportunitiesData,
}: {
    positionType: TPositionType
    opportunitiesData: any[]
    isLoadingOpportunitiesData: boolean
}) {
    const router = useRouter()
    // const updateSearchParams = useUpdateSearchParams()
    // const searchParams = useSearchParams()
    // const positionTypeParam = searchParams.get('position_type') || 'lend'
    // const tokenIdsParam = searchParams.get('token_ids')?.split(',') || []
    // const chainIdsParam = searchParams.get('chain_ids')?.split(',') || []
    // const platformIdsParam = searchParams.get('protocol_ids')?.split(',') || []
    // const keywordsParam = searchParams.get('keywords') || ''
    // const pageParam = searchParams.get('page')
    // const sortingParam = searchParams.get('sort')?.split(',') || []
    // const excludeRiskyMarketsFlag = typeof window !== 'undefined' && localStorage.getItem('exclude_risky_markets') === 'true'
    // const [keywords, setKeywords] = useState<string>(keywordsParam)
    // const debouncedKeywords = useDebounce(keywords, 300)
    // const [pagination, setPagination] = useState<PaginationState>({
    //     pageIndex: Number(pageParam) || 0,
    //     pageSize: 10,
    // })
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    })
    const [isTableLoading, setIsTableLoading] = useState(false)
    // const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
    //     useGetOpportunitiesData({
    //         type: positionTypeParam as TPositionType,
    //         chain_ids: chainIdsParam.map((id) => Number(id)),
    //         tokens: tokenIdsParam,
    //     })
    const { allChainsData } = useContext<any>(AssetsDataContext)

    // Add this ref at component level
    // const prevParamsRef = useRef(searchParams.toString())

    // const [sorting, setSorting] = useState<SortingState>(() => {
    //     if (sortingParam.length === 2) {
    //         return [{ id: sortingParam[0], desc: sortingParam[1] === 'desc' }]
    //     }
    //     return [{ id: 'apy_current', desc: positionTypeParam === 'lend' }]
    // })

    // useEffect(() => {
    //     const hasExcludeRiskyMarketsFlag = localStorage.getItem('exclude_risky_markets')
    //     if (!hasExcludeRiskyMarketsFlag) {
    //         localStorage.setItem('exclude_risky_markets', 'true')
    //         updateSearchParams({
    //             exclude_risky_markets: 'true',
    //         })
    //     }
    // }, [])

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionType === 'lend',
                borrows: positionType === 'borrow',
                max_ltv: positionType === 'borrow',
            }
        })
        // setSorting([{ id: 'apy_current', desc: positionTypeParam === 'lend' }])
    }, [positionType])

    // useEffect(() => {
    //     const params = {
    //         keywords: !!debouncedKeywords.trim().length
    //             ? debouncedKeywords
    //             : undefined,
    //     }
    //     updateSearchParams(params)
    // }, [debouncedKeywords])

    // Update pagination state when URL changes
    // useEffect(() => {
    //     const pageParam = searchParams.get('page')
    //     if (pageParam !== null) {
    //         const pageIndex = Math.max(0, parseInt(pageParam) - 1)
    //         setPagination((prev) => ({
    //             ...prev,
    //             pageIndex,
    //         }))
    //     } else {
    //         // Reset to first page if no page param
    //         setPagination((prev) => ({
    //             ...prev,
    //             pageIndex: 0,
    //         }))
    //     }
    // }, [searchParams])

    // Add this new effect to reset pagination when other search params change
    // useEffect(() => {
    //     // Create a new URLSearchParams object
    //     const currentParams = new URLSearchParams(searchParams.toString())
    //     const pageParam = currentParams.get('page')

    //     // Only reset page if filters have changed
    //     const hasFilterChanged = (
    //         prevParams: string,
    //         currentParams: URLSearchParams
    //     ) => {
    //         const filterParams = [
    //             'position_type',
    //             'token_ids',
    //             'chain_ids',
    //             'protocol_ids',
    //             'keywords',
    //             'sort',
    //         ]
    //         const prevFilters = new URLSearchParams(prevParams)

    //         return filterParams.some(
    //             (param) => prevFilters.get(param) !== currentParams.get(param)
    //         )
    //     }

    //     if (
    //         hasFilterChanged(prevParamsRef.current, currentParams) &&
    //         pageParam !== '1'
    //     ) {
    //         updateSearchParams({ page: '1' })
    //     }

    //     prevParamsRef.current = searchParams.toString()
    // }, [
    //     searchParams.get('position_type'),
    //     searchParams.get('token_ids'),
    //     searchParams.get('chain_ids'),
    //     searchParams.get('protocol_ids'),
    //     searchParams.get('keywords'),
    //     searchParams.get('sort'),
    // ])

    // useEffect(() => {
    //     const filteredIds = !!platformIdsParam.filter(
    //         (id) => id !== 'MORPHO_MARKETS'
    //     ).length
    //         ? platformIdsParam.filter((id) => id !== 'MORPHO_MARKETS')
    //         : undefined
    //     const unfilteredIds = !!platformIdsParam.length
    //         ? platformIdsParam
    //         : undefined

    //     if (sorting.length > 0) {
    //         const sortParam = `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
    //         updateSearchParams({ sort: sortParam })
    //     }
    //     updateSearchParams({
    //         // exclude_risky_markets:
    //         //     positionTypeParam === 'lend' ? 'true' : undefined,
    //         protocol_ids:
    //             positionTypeParam === 'lend' ? filteredIds : unfilteredIds,
    //     })
    // }, [sorting])

    // useEffect(() => {
    //     updateSearchParams({
    //         exclude_risky_markets:
    //             positionTypeParam === 'lend' ? excludeRiskyMarketsFlag : undefined,
    //     })
    // }, [excludeRiskyMarketsFlag])

    const rawTableData: TOpportunityTable[] = opportunitiesData.map((item) => {
        return {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: allChainsData?.filter(
                (chain: TChain) => chain.chain_id === Number(item.chain_id)
            )[0]?.logo,
            chain_id: item.chain_id,
            chainName:
                allChainsData.find(
                    (chain: any) =>
                        Number(chain.chain_id) === Number(item.chain_id)
                )?.name || '',
            protocol_identifier: item.platform.protocol_identifier,
            platformName: `${item.platform.platform_name.split('-')[0]}`,
            platformWithMarketName: `${item.platform.name}`,
            platformId: `${item.platform.platform_name}`,
            platformLogo: item.platform.logo,
            apy_current: item.platform.apy.current,
            max_ltv: item.platform.max_ltv,
            deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
            borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
            utilization: item.platform.utilization_rate,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
            isVault: item.platform.isVault || false,
        }
    })

    // function handleFilterTableRowsByPlatformIds(
    //     opportunity: TOpportunityTable
    // ) {
    //     const isVault = opportunity.isVault
    //     const isMorpho =
    //         opportunity.platformId.split('-')[0].toLowerCase() ===
    //         PlatformType.MORPHO
    //     const morphoSuffix = isVault ? 'VAULTS' : 'MARKETS'

    //     const compareWith = `${opportunity.platformId.split('-')[0]}${isMorpho ? `_${morphoSuffix}` : ''}`

    //     if (platformIdsParam.length > 0) {
    //         return platformIdsParam.includes(compareWith.trim())
    //     }
    //     return true
    // }

    const tableData = rawTableData

    // Calculate total number of pages
    // const totalPages = Math.ceil(tableData.length / 10)

    // Handle pagination changes
    // const handlePaginationChange = useCallback(
    //     (updatedPagination: PaginationState) => {
    //         const newPage = updatedPagination.pageIndex + 1
    //         const currentPage = Number(searchParams.get('page')) || 1

    //         // Only update if page actually changes and is within valid range
    //         if (
    //             newPage !== currentPage &&
    //             newPage >= 1 &&
    //             newPage <= totalPages
    //         ) {
    //             updateSearchParams({
    //                 page: newPage.toString(),
    //             })
    //         }
    //     },
    //     [updateSearchParams, searchParams, totalPages]
    // )

    // Handle exclude morpho markets by URL param flag
    // function handleExcludeMorphoMarketsForLendAssets(
    //     opportunity: TOpportunityTable
    // ) {
    //     const isVault = opportunity.isVault
    //     const isMorpho =
    //         opportunity.platformId.split('-')[0].toLowerCase() ===
    //         PlatformType.MORPHO

    //     return positionType === 'lend'
    //         ? !(isMorpho && !isVault)
    //         : true
    // }

    // function handleExcludeMorphoVaultsForBorrowAssets(
    //     opportunity: TOpportunityTable
    // ) {
    //     const isVault = opportunity.isVault
    //     const isMorpho =
    //         opportunity.platformId.split('-')[0].toLowerCase() ===
    //         PlatformType.MORPHO

    //     return positionType === 'borrow' ? !(isMorpho && isVault) : true
    // }

    // function handleFilterTableRows(opportunity: TOpportunityTable) {
    //     return positionType === 'borrow'
    //         ? handleExcludeMorphoVaultsForBorrowAssets(opportunity)
    //         : (handleExcludeMorphoMarketsForLendAssets(opportunity) &&
    //         opportunity.protocol_identifier !== EXCLUDE_DEPRICATED_MORPHO_ASSET_BY_PROTOCOL)
    // }

    function handleRowClick(rowData: TOpportunityTable) {
        const { tokenAddress, protocol_identifier, chain_id } = rowData
        const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
        router.push(url)
    }

    // const toggleOpportunityType = (positionType: TPositionType): void => {
    //     const filteredIds = !!platformIdsParam.filter(
    //         (id) => id !== 'MORPHO_MARKETS'
    //     ).length
    //         ? platformIdsParam.filter((id) => id !== 'MORPHO_MARKETS')
    //         : undefined
    //     const unfilteredIds = !!platformIdsParam.length
    //         ? platformIdsParam
    //         : undefined

    //     const params = {
    //         position_type: positionType,
    //         exclude_risky_markets: positionType === 'lend' ? excludeRiskyMarketsFlag : undefined,
    //         protocol_ids: positionType === 'lend' ? filteredIds : unfilteredIds,
    //     }
    //     updateSearchParams(params)
    // }

    // function handleKeywordChange(e: any) {
    //     setKeywords(e.target.value)
    //     // Trigger table UI loading for 1 second
    //     setIsTableLoading(true)
    //     setTimeout(() => {
    //         setIsTableLoading(false)
    //     }, 1000)
    // }

    // function handleClearSearch() {
    //     setKeywords('')
    // }

    return (
        <section
            id="opportunities-table"
            className="opportunities-table flex flex-col gap-[24px]"
        >
            <div className="opportunities-table">
                {!isLoadingOpportunitiesData && !isTableLoading && (
                    <OpportunitiesDataTable
                        columns={columns}
                        data={tableData}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                    />
                )}
                {(isLoadingOpportunitiesData || isTableLoading) && (
                    <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
                )}
            </div>
        </section>
    )
}
