'use client'

import React, {
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import { HeadingText } from '@/components/ui/typography'
import { columns } from '@/data/table/top-apy-opportunities'
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { TOpportunityTable, TPositionType } from '@/types'
import { TChain } from '@/types/chain'
import { DataTable } from '@/components/ui/data-table'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import DiscoverFiltersDropdown from '@/components/dropdowns/DiscoverFiltersDropdown'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { useDebounce } from '@/hooks/useDebounce'
import { PlatformType } from '@/types/platform'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import useIsClient from '@/hooks/useIsClient'
import RainingApples from '@/components/animations/RainingApples'
import RainingPolygons from '@/components/animations/RainingPolygons'
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[]
    columns: ColumnDef<TOpportunityTable>[]
    chain: string
}

const EXCLUDEED_TOKENS_LIST = [
    '0x89c31867c878e4268c65de3cdf8ea201310c5851',
]

const EXCLUDEED_PROTOCOLS_LIST = [
    '0x3d819db807d8f8ca10dfef283a3cf37d5576a2abcec9cfb6874efd2df8f4b6ed',
    '0xe75f6fff3eec59db6ac1df4fcccf63b72cc053f78e3156b9eb78d12f5ac47367',
]

export default function TopApyOpportunities({ chain }: { chain: string }) {
    const isClient = useIsClient()
    const router = useRouter()
    const { logEvent } = useAnalytics()
    const { walletAddress } = useWalletConnection()
    const updateSearchParams = useUpdateSearchParams()
    const searchParams = useSearchParams()
    const positionTypeParam = searchParams?.get('position_type') || 'lend'
    const tokenIdsParam = searchParams?.get('token_ids')?.split(',') || []
    const chainIdsParam = searchParams?.get('chain_ids')?.split(',') || []
    const platformIdsParam = searchParams?.get('protocol_ids')?.split(',') || []
    const keywordsParam = searchParams?.get('keywords') || ''
    const pageParam = searchParams?.get('page') || '0'
    const sortingParam = searchParams?.get('sort')?.split(',') || []
    const excludeRiskyMarketsFlag =
        isClient && typeof window !== 'undefined' &&
        localStorage.getItem('exclude_risky_markets') === 'true'
    const [keywords, setKeywords] = useState<string>(keywordsParam)
    const debouncedKeywords = useDebounce(keywords, 300)
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: Number(pageParam) || 0,
        pageSize: 10,
    })
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    })
    const [isTableLoading, setIsTableLoading] = useState(false)
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionTypeParam as TPositionType,
        })
    const { allChainsData } = useContext<any>(AssetsDataContext)
    const [showRainingApples, setShowRainingApples] = useState(false)
    const [showRainingPolygons, setShowRainingPolygons] = useState(false)
    const { showAllMarkets, isLoading: isStateLoading } = useShowAllMarkets()
    const pathname = usePathname() || ''
    const { appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards, hasAppleFarmRewards } = useAppleFarmRewards()

    // Add this ref at component level
    const prevParamsRef = useRef(searchParams?.toString() || '')

    const [sorting, setSorting] = useState<SortingState>(() => {
        if (sortingParam.length === 2) {
            return [{ id: sortingParam[0], desc: sortingParam[1] === 'desc' }]
        }
        return [{ id: 'apy_current', desc: positionTypeParam === 'lend' }]
    })

    // useEffect(() => {
    //     const hasFilters = tokenIdsParam.length > 0 || chainIdsParam.length > 0 || platformIdsParam.length > 0
    //     const hasTokenIds = tokenIdsParam.length > 0
    //     const hasChainIds = chainIdsParam.length > 0
    //     const hasPlatformIds = platformIdsParam.length > 0
    //     if (hasFilters) {
    //         logEvent('filter_selected', {
    //             token_symbols: hasTokenIds ? tokenIdsParam.join(',') : null,
    //             chain_names: hasChainIds ? chainIdsParam?.map((chain_id) => CHAIN_ID_MAPPER[Number(chain_id) as ChainId]).join(',') : null,
    //             protocol_names: hasPlatformIds ? platformIdsParam.join(',') : null,
    //             action: positionTypeParam,
    //         })
    //     }
    // }, [tokenIdsParam, chainIdsParam, platformIdsParam])

    useEffect(() => {
        const hasExcludeRiskyMarketsFlag = localStorage.getItem(
            'exclude_risky_markets'
        )
        if (!hasExcludeRiskyMarketsFlag) {
            localStorage.setItem('exclude_risky_markets', 'true')
            updateSearchParams({
                exclude_risky_markets: 'true',
            })
        }
    }, [])

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionTypeParam === 'lend',
                borrows: positionTypeParam === 'borrow',
                collateral_exposure: positionTypeParam === 'lend',
                collateral_tokens: positionTypeParam === 'borrow',
                available_liquidity: positionTypeParam === 'borrow',
                apy_avg_7days: positionTypeParam === 'lend',
            }
        })
        setSorting([{ id: 'apy_current', desc: positionTypeParam === 'lend' }])
    }, [positionTypeParam])

    useEffect(() => {
        const params = {
            keywords: !!debouncedKeywords.trim().length
                ? debouncedKeywords
                : undefined,
        }
        updateSearchParams(params)
    }, [debouncedKeywords])

    // Update pagination state when URL changes
    useEffect(() => {
        const pageParam = searchParams?.get('page')
        if (pageParam !== null && pageParam !== undefined) {
            const pageIndex = Math.max(0, parseInt(pageParam) - 1)
            setPagination((prev) => ({
                ...prev,
                pageIndex,
            }))
        } else {
            setPagination((prev) => ({
                ...prev,
                pageIndex: 0,
            }))
        }
    }, [searchParams])

    // Add this new effect to reset pagination when other search params change
    useEffect(() => {
        // Create a new URLSearchParams object
        const currentParams = new URLSearchParams(searchParams?.toString() || '')
        const pageParam = currentParams.get('page')

        // Only reset page if filters have changed
        const hasFilterChanged = (
            prevParams: string,
            currentParams: URLSearchParams
        ) => {
            const filterParams = [
                'position_type',
                'token_ids',
                'chain_ids',
                'protocol_ids',
                'keywords',
                'sort',
            ]
            const prevFilters = new URLSearchParams(prevParams)

            return filterParams.some(
                (param) => prevFilters.get(param) !== currentParams.get(param)
            )
        }

        if (
            hasFilterChanged(prevParamsRef.current, currentParams) &&
            pageParam !== '1'
        ) {
            updateSearchParams({ page: '1' })
        }

        prevParamsRef.current = searchParams?.toString() || ''
    }, [
        searchParams?.get('position_type'),
        searchParams?.get('token_ids'),
        searchParams?.get('chain_ids'),
        searchParams?.get('protocol_ids'),
        searchParams?.get('keywords'),
        searchParams?.get('sort'),
    ])

    useEffect(() => {
        const filteredIds = !!platformIdsParam.filter(
            (id) => id !== 'MORPHO_MARKETS'
        ).length
            ? platformIdsParam.filter((id) => id !== 'MORPHO_MARKETS')
            : undefined
        const unfilteredIds = !!platformIdsParam.length
            ? platformIdsParam
            : undefined

        if (sorting.length > 0) {
            const sortParam = `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
            updateSearchParams({ sort: sortParam })
        }
        updateSearchParams({
            // exclude_risky_markets:
            //     positionTypeParam === 'lend' ? 'true' : undefined,
            protocol_ids:
                positionTypeParam === 'lend' ? filteredIds : unfilteredIds,
        })
    }, [sorting])

    useEffect(() => {
        updateSearchParams({
            exclude_risky_markets:
                positionTypeParam === 'lend'
                    ? excludeRiskyMarketsFlag
                    : undefined,
        })
    }, [excludeRiskyMarketsFlag])

    useEffect(() => {
        const hasShownAnimation = sessionStorage.getItem('has_shown_apple_animation');
        if (!hasShownAnimation && chainIdsParam.includes('42793')) {
            setShowRainingApples(true);
            sessionStorage.setItem('has_shown_apple_animation', 'true');

            const timer = setTimeout(() => {
                setShowRainingApples(false);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const hasShownPolygonAnimation = sessionStorage.getItem('has_shown_polygon_animation');
        if (!hasShownPolygonAnimation && chainIdsParam.includes('137')) {
            setShowRainingPolygons(true);
            sessionStorage.setItem('has_shown_polygon_animation', 'true');

            const timer = setTimeout(() => {
                setShowRainingPolygons(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [chainIdsParam]);

    useEffect(() => {
        if ((pathname === '/etherlink' || pathname.endsWith('/etherlink')) && chainIdsParam.length === 0) {
            updateSearchParams({ chain_ids: '42793' });
        }
        if ((pathname === '/polygon' || pathname.endsWith('/polygon')) && chainIdsParam.length === 0) {
            updateSearchParams({ chain_ids: '137' });
        }
    }, [pathname, chainIdsParam.length, updateSearchParams]);

    const rawTableData: TOpportunityTable[] = opportunitiesData.map((item) => {
        const platformName = item.platform.platform_name?.split('-')[0]?.toLowerCase()
        const isAaveV3 = PlatformType.AAVE.includes(platformName)
        const isCompound = PlatformType.COMPOUND.includes(platformName)
        const isMorpho = PlatformType.MORPHO.includes(platformName)
        const isFluid = PlatformType.FLUID.includes(platformName)
        const isSuperlend = PlatformType.SUPERLEND.includes(platformName)
        const isEuler = PlatformType.EULER.includes(platformName)

        const liquidityInUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
        const borrowsInUSD = Number(item.platform.borrows) * Number(item.token.price_usd)

        let availableLiquidity = 0;
        if (isAaveV3 || isSuperlend || isEuler) {
            availableLiquidity = liquidityInUSD - borrowsInUSD
        } else if (isCompound) {
            availableLiquidity = liquidityInUSD - borrowsInUSD
        } else if (isMorpho) {
            availableLiquidity = liquidityInUSD - Number(item.platform.borrows)
        } else if (isFluid) {
            availableLiquidity = (Number(item.platform.liquidity) * Number(item.platform.collateral_token_price)) - borrowsInUSD
        }

        const tokenHasAppleFarmRewards = hasAppleFarmRewards(item.token.address) && positionTypeParam === 'lend'

        // REWARDS DEBUG: Log rewards data for first few items
        if (process.env.NODE_ENV === 'development' && item.token.symbol && opportunitiesData.indexOf(item) < 5) {
            console.log(`🔍 TABLE REWARDS DEBUG [${item.token.symbol}]:`)
            console.log('  - additional_rewards:', item.platform.additional_rewards)
            console.log('  - rewards array:', item.platform.rewards)
            console.log('  - rewards length:', item.platform.rewards?.length)
            if (item.platform.rewards && item.platform.rewards.length > 0) {
                console.log('  - first reward:', item.platform.rewards[0])
                console.log('  - first reward asset:', item.platform.rewards[0]?.asset)
                console.log('  - first reward supply_apy:', item.platform.rewards[0]?.supply_apy)
            }
        }

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
            apy_avg_7days: item.platform.apy.avg_7days,
            max_ltv: item.platform.max_ltv,
            deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
            borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
            utilization: item.platform.utilization_rate,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
            isVault: item.platform.isVault || false,
            collateral_exposure: item.platform.collateral_exposure,
            collateral_tokens: item.platform.collateral_tokens,
            available_liquidity: availableLiquidity,
            apple_farm_apr: appleFarmRewardsAprs[item.token.address] ?? 0,
            has_apple_farm_rewards: tokenHasAppleFarmRewards,
        }
    })

    function handleFilterTableRowsByPlatformIds(
        opportunity: TOpportunityTable
    ) {
        const isVault = opportunity.isVault
        const isMorpho =
            opportunity.platformId?.split('-')[0]?.toLowerCase() ===
            PlatformType.MORPHO
        const morphoSuffix = isVault ? 'VAULTS' : 'MARKETS'

        const compareWith = `${opportunity.platformId.split('-')[0]}${isMorpho ? `_${morphoSuffix}` : ''}`

        if (platformIdsParam.length > 0) {
            return platformIdsParam.includes(compareWith.trim())
        }
        return true
    }

    const tableData = rawTableData.filter(handleFilterTableRows)

    // Calculate total number of pages
    const totalPages = Math.ceil(tableData.length / 10)

    // Handle pagination changes
    const handlePaginationChange = useCallback(
        (updatedPagination: PaginationState) => {
            const newPage = updatedPagination.pageIndex + 1
            const currentPage = Number(searchParams?.get('page')) || 1

            // Only update if page actually changes and is within valid range
            if (
                newPage !== currentPage &&
                newPage >= 1 &&
                newPage <= totalPages
            ) {
                updateSearchParams({
                    page: newPage.toString(),
                })
            }
        },
        [updateSearchParams, searchParams, totalPages]
    )

    // Handle exclude morpho markets by URL param flag
    function handleExcludeMorphoMarketsByParamFlag(
        opportunity: TOpportunityTable
    ) {
        const isVault = opportunity.isVault
        const isMorpho =
            opportunity.platformId?.split('-')[0]?.toLowerCase() ===
            PlatformType.MORPHO

        return excludeRiskyMarketsFlag ? !(isMorpho && !isVault) : true
    }

    function handleExcludeMorphoVaultsByPositionType(
        opportunity: TOpportunityTable
    ) {
        const isVault = opportunity.isVault
        const isMorpho =
            opportunity.platformId?.split('-')[0]?.toLowerCase() ===
            PlatformType.MORPHO

        return positionTypeParam === 'borrow' ? !(isMorpho && isVault) : true
    }

    function handleFilterTableRows(opportunity: TOpportunityTable) {
        const matchesChainId = chainIdsParam.length === 0 || chainIdsParam.includes(opportunity.chain_id.toString())
        const matchesToken = tokenIdsParam.length === 0 || tokenIdsParam.includes(opportunity.tokenSymbol)

        return positionTypeParam === 'borrow'
            ? handleExcludeMorphoVaultsByPositionType(opportunity) &&
            handleFilterTableRowsByPlatformIds(opportunity) &&
            matchesChainId &&
            matchesToken &&
            !EXCLUDEED_PROTOCOLS_LIST.includes(opportunity.protocol_identifier) &&
            !EXCLUDEED_TOKENS_LIST.includes(opportunity.tokenAddress)
            : handleExcludeMorphoMarketsByParamFlag(opportunity) &&
            handleFilterTableRowsByPlatformIds(opportunity) &&
            matchesChainId &&
            matchesToken &&
            !EXCLUDEED_PROTOCOLS_LIST.includes(opportunity.protocol_identifier) &&
            !EXCLUDEED_TOKENS_LIST.includes(opportunity.tokenAddress)
    }

    function handleRowClick(rowData: any) {
        const { tokenAddress, protocol_identifier, chain_id } = rowData
        const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionTypeParam}`
        router.push(url)
        logEvent('money_market_selected', {
            action: positionTypeParam,
            token_symbol: rowData.tokenSymbol,
            platform_name: rowData.platformName,
            chain_name: rowData.chainName,
            wallet_address: walletAddress,
        })
    }

    const toggleOpportunityType = (positionType: TPositionType): void => {
        const filteredIds = !!platformIdsParam.filter(
            (id) => id !== 'MORPHO_MARKETS'
        ).length
            ? platformIdsParam.filter((id) => id !== 'MORPHO_MARKETS')
            : undefined
        const unfilteredIds = !!platformIdsParam.length
            ? platformIdsParam
            : undefined

        const params = {
            position_type: positionType,
            exclude_risky_markets:
                positionType === 'lend' ? excludeRiskyMarketsFlag : undefined,
            protocol_ids: positionType === 'lend' ? filteredIds : unfilteredIds,
        }
        updateSearchParams(params)
    }

    function handleKeywordChange(e: any) {
        setKeywords(e.target.value)
        // Trigger table UI loading for 1 second
        setIsTableLoading(true)
        setTimeout(() => {
            setIsTableLoading(false)
        }, 1000)
    }

    function handleClearSearch() {
        setKeywords('')
    }

    // Don't render anything while loading
    // if (isStateLoading || isLoadingOpportunitiesData) {
    //     return <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
    // }

    return (
        <section
            id="top-apy-opportunities"
            className="top-apy-opportunities-container flex flex-col gap-[24px] px-5"
        >
            {showRainingApples && <RainingApples />}
            {showRainingPolygons && <RainingPolygons />}
            <div className="top-apy-opportunities-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="top-apy-opportunities-header-left shrink-0 w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center justify-between gap-[12px] max-lg:w-full">
                        <div className="flex items-center gap-[12px]">
                            <HeadingText
                                level="h3"
                                weight="medium"
                                className="text-gray-800"
                            >
                                Top Money Markets
                            </HeadingText>
                            <InfoTooltip content="List of assets from different lending protocols across various chains, offering good APYs" />
                        </div>
                        {/* Filter button for Tablet and below screens */}
                        <div className="block lg:hidden">
                            <DiscoverFiltersDropdown chain={chain} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className="w-full sm:max-w-[350px]">
                            <ToggleTab
                                type={
                                    positionTypeParam === 'lend'
                                        ? 'tab1'
                                        : 'tab2'
                                }
                                handleToggle={(positionType: TTypeToMatch) => {
                                    toggleOpportunityType(
                                        positionType === 'tab1'
                                            ? 'lend'
                                            : 'borrow'
                                    )
                                }}
                            />
                        </div>
                        <div className="sm:max-w-[156px] w-full">
                            <SearchInput
                                onChange={handleKeywordChange}
                                onClear={handleClearSearch}
                                value={keywords}
                                placeholder="Search"
                            />
                        </div>
                    </div>
                </div>
                {/* Filter buttons for Desktop and above screens */}
                <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                    {/* <ChainSelectorDropdown /> */}
                    <DiscoverFiltersDropdown chain={chain} />
                </div>
            </div>
            <div className="top-apy-opportunities-content">
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
                    <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
                )}
            </div>
        </section>
    )
}
