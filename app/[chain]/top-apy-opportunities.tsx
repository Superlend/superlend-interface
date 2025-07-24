'use client'

import React, {
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react'
import ToggleTab, { TTypeToMatch, getToggleTabContainerWidth, countVisibleTabs } from '@/components/ToggleTab'
import { HeadingText } from '@/components/ui/typography'
import { columns } from '@/data/table/top-apy-opportunities'
import { columns as columnsForLoops } from '@/data/table/loop-opportunities'
import SearchInput from '@/components/inputs/SearchInput'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { TOpportunityTable, TPositionType } from '@/types'
import { ChainId, TChain } from '@/types/chain'
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
import RainingPolygons from '@/components/animations/RainingPolygons'
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import { useGetLoopPairs } from '@/hooks/useGetLoopPairs'
import { RefreshCw } from 'lucide-react'
import DiscoverOpportunities from './discover-opportunities'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import RainingApples from '@/components/animations/RainingApples'

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

// Define correlated pairs for loop strategies
const CORRELATED_PAIRS = [
    // Stablecoins - highly correlated
    { pair1: 'USDC', pair2: 'USDT' },
    { pair1: 'USDT', pair2: 'USDC' },

    // RWA Tokens - both Midas tokens, correlated
    { pair1: 'mTBILL', pair2: 'USDT' },
    { pair1: 'USDT', pair2: 'mTBILL' },
    // RWA Tokens - both Midas tokens, correlated
    { pair1: 'mBASIS', pair2: 'USDT' },
    { pair1: 'USDT', pair2: 'mBASIS' },

    // RWA Tokens - both Midas tokens, correlated
    { pair1: 'mTBILL', pair2: 'USDC' },
    { pair1: 'USDC', pair2: 'mTBILL' },
    // RWA Tokens - both Midas tokens, correlated
    { pair1: 'mBASIS', pair2: 'USDC' },
    { pair1: 'USDC', pair2: 'mBASIS' },

    // Major Cryptos - both major crypto assets, somewhat correlated
    // { pair1: 'WETH', pair2: 'WBTC' },
    // { pair1: 'WBTC', pair2: 'WETH' },
]

// Utility function to format time difference
const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) {
        return `${days} day${days === 1 ? '' : 's'} ago`
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`
    } else if (minutes > 0) {
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`
    } else {
        return 'Just now'
    }
}

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
    const showCorrelatedPairsParam = searchParams?.get('show_correlated_pairs') === 'true'
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
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData, refetch, lastFetchTime, shouldAutoRefresh, isRefreshing } =
        useGetOpportunitiesData({
            type: isActiveTab('loop') ? 'lend' : positionTypeParam as TPositionType,
        })

    // Get loop pairs when position type is 'loop'
    const { pairs: loopPairs, isLoading: isLoadingLoopPairs } = useGetLoopPairs()
    const { allChainsData } = useContext<any>(AssetsDataContext)
    const [showRainingApples, setShowRainingApples] = useState(false)
    const [showRainingPolygons, setShowRainingPolygons] = useState(false)
    const { showAllMarkets, isLoading: isStateLoading } = useShowAllMarkets()
    const pathname = usePathname() || ''
    const IS_POLYGON_MARKET = pathname.includes('polygon')
    const {
        appleFarmRewardsAprs, 
        isLoading: isLoadingAppleFarmRewards, 
        hasAppleFarmRewards
    } = useAppleFarmRewards()

    function isActiveTab(tabId: 'lend' | 'borrow' | 'loop') {
        return positionTypeParam === tabId
    }

    // Add this ref at component level
    const prevParamsRef = useRef(searchParams?.toString() || '')

    const [sorting, setSorting] = useState<SortingState>(() => {
        if (sortingParam.length === 2) {
            return [{ id: sortingParam[0], desc: sortingParam[1] === 'desc' }]
        }
        return [{ id: isActiveTab('loop') ? 'maxAPY' : 'apy_current', desc: isActiveTab('lend') || isActiveTab('loop') }]
    })



    const handleManualRefresh = useCallback(() => {
        logEvent('data_refresh_clicked', {
            position_type: positionTypeParam,
            chain: chain,
        })
        refetch()
    }, [refetch, logEvent, positionTypeParam, chain])

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
                deposits: isActiveTab('lend'),
                borrows: isActiveTab('borrow'),
                collateral_exposure: isActiveTab('lend'),
                collateral_tokens: isActiveTab('borrow'),
                available_liquidity: isActiveTab('borrow') || isActiveTab('loop'),
                apy_avg_7days: isActiveTab('lend'),
            }
        })
        setSorting([{ id: isActiveTab('loop') ? 'maxAPY' : 'apy_current', desc: isActiveTab('lend') || isActiveTab('loop') }])
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
        let protocolIds = unfilteredIds
        if (isActiveTab('lend')) {
            protocolIds = filteredIds
        } else if (isActiveTab('borrow') || isActiveTab('loop')) {
            protocolIds = unfilteredIds
        }

        updateSearchParams({
            // exclude_risky_markets:
            //     positionTypeParam === 'lend' ? 'true' : undefined,
            protocol_ids: protocolIds,
        })
    }, [sorting])

    useEffect(() => {
        updateSearchParams({
            exclude_risky_markets:
                isActiveTab('lend')
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

    const rawTableData: TOpportunityTable[] = useMemo(() => {
        // For loop position type, use loop pairs instead of raw opportunities data
        if (isActiveTab('loop')) {
            return loopPairs
        }

        // For lend/borrow, use the existing transformation logic
        return opportunitiesData.map((item) => {
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
                apy_current: String(item.platform.apy.current),
                apy_avg_7days: String(item.platform.apy.avg_7days),
                max_ltv: item.platform.max_ltv,
                deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
                borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
                utilization: String(item.platform.utilization_rate),
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
    }, [
        positionTypeParam,
        loopPairs,
        opportunitiesData,
        allChainsData,
        appleFarmRewardsAprs, 
        hasAppleFarmRewards
    ])

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

    // useEffect(() => {
    //     // if (positionTypeParam === 'loop') {
    //     //     console.log('Rendered loop strategies:', tableData)
    //     //     console.log('Total strategies before filtering:', rawTableData.length)
    //     //     console.log('Total strategies after filtering:', tableData.length)
    //     //     console.log('Correlated pairs filter active:', showCorrelatedPairsParam)
    //     // }
    // }, [tableData, positionTypeParam, rawTableData.length, showCorrelatedPairsParam])

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

        // Check correlated pairs filter for loop position type only
        const matchesCorrelatedPairs = (() => {
            if (positionTypeParam !== 'loop' || !showCorrelatedPairsParam) {
                return true // No filtering if not loop or filter not active
            }

            const lendToken = opportunity.tokenSymbol
            const borrowToken = (opportunity as any).borrowToken?.symbol

            console.log('Checking correlation for:', {
                lendToken,
                borrowToken,
                pairId: (opportunity as any).pairId,
                showCorrelatedPairsParam
            })

            if (!borrowToken) {
                console.log('No borrow token found')
                return false
            }

            const isCorrelated = CORRELATED_PAIRS.some(pair =>
                (pair.pair1 === lendToken && pair.pair2 === borrowToken) ||
                (pair.pair1 === borrowToken && pair.pair2 === lendToken)
            )

            console.log('Is correlated:', isCorrelated)
            return isCorrelated
        })()

        // Base filters that apply to all position types
        const commonFilters = handleFilterTableRowsByPlatformIds(opportunity) &&
            matchesChainId &&
            matchesToken &&
            !EXCLUDEED_PROTOCOLS_LIST.includes(opportunity.protocol_identifier) &&
            !EXCLUDEED_TOKENS_LIST.includes(opportunity.tokenAddress)

        if (positionTypeParam === 'borrow') {
            return handleExcludeMorphoVaultsByPositionType(opportunity) && commonFilters
        } else if (positionTypeParam === 'lend') {
            return handleExcludeMorphoMarketsByParamFlag(opportunity) && commonFilters
        } else if (positionTypeParam === 'loop') {
            // For loop positions, apply morpho markets filter, chain filter, and correlated pairs filter
            const chainFilter = opportunity.chain_id === ChainId.Etherlink
            return handleExcludeMorphoMarketsByParamFlag(opportunity) && chainFilter && commonFilters && matchesCorrelatedPairs
        }

        // Default fallback (shouldn't reach here)
        return commonFilters
    }

    function handleRowClick(rowData: any) {
        if (positionTypeParam === 'loop') {
            // For loop pairs, use both lend and borrow token information
            const { tokenAddress, borrowToken, protocol_identifier, chain_id } = rowData
            const url = `/position-management?lend_token=${tokenAddress}&borrow_token=${borrowToken.address}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionTypeParam}`
            router.push(url)
            logEvent('money_market_selected', {
                action: positionTypeParam,
                token_symbol: `${rowData.tokenSymbol} → ${borrowToken.symbol}`,
                platform_name: rowData.platformName,
                chain_name: rowData.chainName,
                wallet_address: walletAddress,
            })
        } else {
            // For lend/borrow, use existing logic
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

        let protocolIds = unfilteredIds
        let excludeRiskyMarkets = undefined

        if (positionType === 'lend') {
            protocolIds = filteredIds
            excludeRiskyMarkets = excludeRiskyMarketsFlag
        } else if (positionType === 'borrow') {
            protocolIds = unfilteredIds
            excludeRiskyMarkets = undefined
        } else if (positionType === 'loop') {
            protocolIds = unfilteredIds
            excludeRiskyMarkets = undefined
        }

        const params = {
            position_type: positionType,
            exclude_risky_markets: excludeRiskyMarkets,
            protocol_ids: protocolIds,
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

    const filteredColumns = useMemo(() => {
        return positionTypeParam === 'loop' ? columnsForLoops : columns
    }, [positionTypeParam])

    if (isStateLoading || isLoadingOpportunitiesData) {
        return <LoadingSectionSkeleton className="h-[500px] md:h-[600px]" />
    }

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
                        <div className="flex items-center gap-[8px]">
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
                        <div className="flex items-center gap-[12px] lg:hidden">
                            {positionTypeParam === 'loop' && (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="correlated-pairs-mobile"
                                        checked={showCorrelatedPairsParam}
                                        onCheckedChange={(checked) => {
                                            updateSearchParams({
                                                show_correlated_pairs: checked ? 'true' : undefined,
                                            })
                                        }}
                                    />
                                    <InfoTooltip
                                        label={
                                            <Label htmlFor="correlated-pairs-mobile" className="text-sm cursor-pointer">
                                                Correlated Pairs
                                            </Label>
                                        }
                                        content="Show only token pairs with similar price movements: USDC/USDT (stablecoins), mTBILL/USDT etc."
                                    />
                                </div>
                            )}
                            <DiscoverFiltersDropdown chain={chain} positionType={positionTypeParam} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className={`w-full ${getToggleTabContainerWidth(countVisibleTabs({ tab1: true, tab2: true, tab3: true }))}`}>
                            <ToggleTab
                                type={
                                    positionTypeParam === 'lend'
                                        ? 'tab1'
                                        : positionTypeParam === 'borrow'
                                            ? 'tab2'
                                            : 'tab3'
                                }
                                handleToggle={(positionType: TTypeToMatch) => {
                                    toggleOpportunityType(
                                        positionType === 'tab1'
                                            ? 'lend'
                                            : positionType === 'tab2'
                                                ? 'borrow'
                                                : 'loop'
                                    )
                                }}
                                showTab={{
                                    tab1: true,
                                    tab2: true,
                                    tab3: !IS_POLYGON_MARKET,
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
                <div className="filter-dropdowns-container hidden lg:flex flex-col items-end gap-[8px]">
                    <div className="flex items-center gap-[12px]">
                        {positionTypeParam === 'loop' && (
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="correlated-pairs-desktop"
                                    checked={showCorrelatedPairsParam}
                                    onCheckedChange={(checked) => {
                                        updateSearchParams({
                                            show_correlated_pairs: checked ? 'true' : undefined,
                                        })
                                    }}
                                />
                                <InfoTooltip
                                    label={
                                        <Label htmlFor="correlated-pairs-desktop" className="text-sm cursor-pointer">
                                            Correlated Pairs
                                        </Label>
                                    }
                                    content="Show only token pairs with similar price movements: USDC/USDT (stablecoins), mTBILL/USDT etc."
                                />
                            </div>
                        )}
                        <DiscoverFiltersDropdown chain={chain} positionType={positionTypeParam} />
                    </div>
                </div>

            </div>

            {showAllMarkets && <DiscoverOpportunities chain={chain} positionType={positionTypeParam} />}

            <div className="top-apy-opportunities-content">
                {!isLoadingOpportunitiesData && !isLoadingLoopPairs && !isTableLoading && (
                    <DataTable
                        columns={filteredColumns}
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
                        onRefresh={handleManualRefresh}
                        lastRefreshTime={lastFetchTime || undefined}
                        isRefreshing={isRefreshing}
                    />
                )}
                {(isLoadingOpportunitiesData || isLoadingLoopPairs || isTableLoading) && (
                    <LoadingSectionSkeleton className="h-[500px] md:h-[600px]" />
                )}
            </div>
        </section>
    )
}
