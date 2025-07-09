'use client'

import AllPositionsFiltersDropdown from '@/components/dropdowns/AllPositionsFiltersDropdown'
import SearchInput from '@/components/inputs/SearchInput'
import ToggleTab, { TTypeToMatch, getToggleTabContainerWidth, countVisibleTabs } from '@/components/ToggleTab'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { DataTable } from '@/components/ui/all-positions-table'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { AssetsDataContext } from '@/context/data-provider'
import { PositionsContext } from '@/context/positions-provider'
import { columns, loopColumns, TPositionsTable, TLoopPositionsTable } from '@/data/table/all-positions'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { calculateScientificNotation } from '@/lib/utils'
import { TPositionType } from '@/types'
import { PlatformType } from '@/types/platform'
import { SortingState } from '@tanstack/react-table'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { useDebounce } from '@/hooks/useDebounce'
import { PortfolioContext } from '@/context/portfolio-provider'

export default function AllPositions() {
    const router = useRouter()
    const updateSearchParams = useUpdateSearchParams()
    const searchParams = useSearchParams()
    const positionTypeParam = searchParams?.get('position_type') || 'all'
    const tokenIdsParam = searchParams?.get('token_ids')?.split(',') || []
    const chainIdsParam = searchParams?.get('chain_ids')?.split(',') || []
    const platformIdsParam = searchParams?.get('protocol_ids')?.split(',') || []
    const keywordsParam = searchParams?.get('keywords') || ''
    const sortingParam = searchParams?.get('sort')?.split(',') || []

    const { logEvent } = useAnalytics()
    const { filters, positionType, setPositionType } = useContext(PositionsContext)
    const { address: walletAddress } = useAccount()
    const [searchKeywords, setSearchKeywords] = useState<string>('')
    const debouncedKeywords = useDebounce(searchKeywords, 300)
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'apy', desc: positionTypeParam === 'lend' || positionTypeParam === 'all' },
    ])
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
        positionType: false,
    })
    const { allChainsData } = useContext(AssetsDataContext)
    const { portfolioData, isLoadingPortfolioData, isErrorPortfolioData } =
    useContext(PortfolioContext)

    useEffect(() => {
        setColumnVisibility(() => {
            if (positionTypeParam === 'all') {
                return {
                    deposits: true,
                    borrows: false,
                    positionType: true,
                }
            }
            return {
                deposits: positionTypeParam === 'lend',
                borrows: positionTypeParam === 'borrow',
                positionType: false,
            }
        })
        setSorting([{ id: 'apy', desc: positionTypeParam === 'lend' || positionTypeParam === 'all' }])
    }, [positionTypeParam])

    useEffect(() => {
        const params = {
            keywords: !!debouncedKeywords.trim().length ? debouncedKeywords : undefined,
        }
        updateSearchParams(params)
    }, [debouncedKeywords])

    useEffect(() => {
        if (sorting.length > 0) {
            const sortParam = `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
            updateSearchParams({ sort: sortParam })
        }
    }, [sorting])

    // Filter platforms for loop positions
    const isLoopPlatform = (platform: any) => {
        return platform.name.toLowerCase().includes('looped') || 
               platform.platform_name.toLowerCase().includes('loop')
    }

    // Filter regular positions (non-loop)
    const isRegularPlatform = (platform: any) => {
        return !isLoopPlatform(platform)
    }

    // Get regular positions
    const REGULAR_POSITIONS = portfolioData?.platforms
        ?.filter(isRegularPlatform)
        ?.flatMap((platform) => {
            return platform.positions
            .filter((position) => !(platform.protocol_type === 'euler' && !position.protocol_identifier))
            .map((position) => {
                const chainDetails = allChainsData.find(
                    (chain) =>
                        Number(chain.chain_id) === Number(platform.chain_id)
                )
                return {
                    ...position,
                    platform: {
                        ...platform,
                        positions: null,
                    },
                    chain: {
                        chain_id: platform.chain_id ?? '',
                        logo: chainDetails?.logo ?? '',
                        chain_name: chainDetails?.name ?? '',
                    },
                }
            })
        })
        .flat(portfolioData?.platforms.filter(isRegularPlatform).length)
        .filter((position) => positionTypeParam === 'all' || position.type === positionTypeParam)

    // Get loop positions
    const LOOP_POSITIONS: TLoopPositionsTable[] = portfolioData?.platforms
        ?.filter(isLoopPlatform)
        ?.reduce((acc: TLoopPositionsTable[], platform) => {
            const chainDetails = allChainsData.find(
                (chain) => Number(chain.chain_id) === Number(platform.chain_id)
            )
            
            // Find lend and borrow positions within this platform
            const lendPosition = platform.positions.find(pos => pos.type === 'lend')
            const borrowPosition = platform.positions.find(pos => pos.type === 'borrow')
            
            if (!lendPosition || !borrowPosition) return acc
            
            const lendAmount = lendPosition.amount * lendPosition.token.price_usd
            const borrowAmount = borrowPosition.amount * borrowPosition.token.price_usd
            
            // Calculate leverage: lendAmount / (lendAmount - borrowAmount)
            // If borrowAmount >= lendAmount, set leverage to a high value (100x)
            const leverage = lendAmount > borrowAmount 
                ? lendAmount / (lendAmount - borrowAmount)
                : 100
            
            const loopPosition: TLoopPositionsTable = {
                platform_id: platform.platform_name,
                protocol_identifier: platform.protocol_identifier,
                platformName: platform.name, // Use the descriptive name instead of platform_name
                platformLogo: platform.logo,
                chainName: chainDetails?.name ?? '',
                chainLogo: chainDetails?.logo ?? '',
                chain_id: platform.chain_id,
                core_contract: (platform as any).core_contract || '',
                lendTokenAddress: lendPosition.token.address,
                lendTokenSymbol: lendPosition.token.symbol,
                lendTokenName: lendPosition.token.name,
                lendTokenLogo: lendPosition.token.logo,
                lendAmount: lendAmount,
                lendApy: lendPosition.apy,
                borrowTokenAddress: borrowPosition.token.address,
                borrowTokenSymbol: borrowPosition.token.symbol,
                borrowTokenName: borrowPosition.token.name,
                borrowTokenLogo: borrowPosition.token.logo,
                borrowAmount: borrowAmount,
                borrowApy: borrowPosition.apy,
                leverage: leverage,
                netApy: platform.net_apy,
                pnl: platform.pnl,
                healthFactor: platform.health_factor,
                totalLiquidity: platform.total_liquidity,
                totalBorrow: platform.total_borrow,
            }
            
            acc.push(loopPosition)
            return acc
        }, []) || []

    const rawTableData: TPositionsTable[] = REGULAR_POSITIONS?.map((item) => {
        return {
            tokenAddress: item.token.address,
            tokenSymbol: item.token.symbol,
            tokenName: item.token.name,
            tokenLogo: item.token.logo,
            chainLogo: item.chain.logo,
            chain_id: item.chain.chain_id,
            chainName: item.chain.chain_name,
            platform_id: item.platform.platform_name,
            platformName: `${item.platform.platform_name.split('-')[0]}`,
            platformWithMarketName: item.platform.name,
            protocol_identifier: item.platform.protocol_identifier,
            platformLogo: item.platform.logo,
            apy: item.apy,
            deposits: calculateScientificNotation(
                item.amount.toString(),
                item.token.price_usd.toString(),
                'multiply'
            ).toFixed(10),
            borrows: calculateScientificNotation(
                item.amount.toString(),
                item.token.price_usd.toString(),
                'multiply'
            ).toFixed(10),
            earnings:
                (item.amount - item.initial_amount) * item.token.price_usd,
            isVault: item.platform.isVault || false,
            positionType: item.type,
        }
    })

    const filteredTableData = rawTableData?.filter((position) => {
        const isVault = position.isVault
        const isMorpho =
            position.platformName.toLowerCase() === PlatformType.MORPHO
        const morphoSuffix = isVault ? 'VAULTS' : 'MARKETS'

        const formattedPlatformName = `${position.platformName}${isMorpho ? `_${morphoSuffix}` : ''}`

        const matchesTokenFilter =
            filters.token_ids.length === 0 ||
            filters.token_ids.includes(position.tokenSymbol)
        const matchesPlatformFilter =
            filters.platform_ids.length === 0 ||
            filters.platform_ids.includes(formattedPlatformName)
        const matchesChainFilter =
            filters.chain_ids.length === 0 ||
            filters.chain_ids
                .map((chain) => chain.toString())
                .includes(position.chain_id.toString())
        return matchesTokenFilter && matchesPlatformFilter && matchesChainFilter
    })

    const filteredLoopTableData = LOOP_POSITIONS?.filter((position) => {
        const matchesTokenFilter =
            filters.token_ids.length === 0 ||
            filters.token_ids.includes(position.lendTokenSymbol) ||
            filters.token_ids.includes(position.borrowTokenSymbol)
        const matchesPlatformFilter =
            filters.platform_ids.length === 0 ||
            filters.platform_ids.includes(position.platformName)
        const matchesChainFilter =
            filters.chain_ids.length === 0 ||
            filters.chain_ids
                .map((chain) => chain.toString())
                .includes(position.chain_id.toString())
        return matchesTokenFilter && matchesPlatformFilter && matchesChainFilter
    })

    function handleRowClick(rowData: any) {
        if (positionTypeParam === 'loop') {
            // For loop positions, navigate to loop position management
            const { lendTokenAddress, borrowTokenAddress, protocol_identifier, chain_id, core_contract } = rowData
            const url = `/position-management?lend_token=${lendTokenAddress}&borrow_token=${borrowTokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&core_contract=${core_contract}&position_type=loop`
            router.push(url)
            logEvent('portfolio_loop_position_clicked', {
                lend_token_symbol: rowData.lendTokenSymbol,
                borrow_token_symbol: rowData.borrowTokenSymbol,
                platform_name: rowData.platformName,
                chain_name: rowData.chainName,
                wallet_address: walletAddress,
            })
        } else {
            // For regular positions
            const { tokenAddress, protocol_identifier, chain_id } = rowData
            const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionTypeParam}`
            router.push(url)
            logEvent('portfolio_asset_clicked', {
                action: positionTypeParam,
                token_symbol: rowData.tokenSymbol,
                platform_name: rowData.platformName,
                chain_name: rowData.chainName,
                wallet_address: walletAddress,
            })
        }
    }

    const toggleOpportunityType = (positionType: TPositionType): void => {
        setPositionType(positionType)
    }

    function handleKeywordChange(e: any) {
        setSearchKeywords(e.target.value)
    }

    function handleClearSearch() {
        setSearchKeywords('')
    }

    // Check if we have loop positions to show the loop tab
    const hasLoopPositions = (LOOP_POSITIONS?.length || 0) > 0

    // Calculate dynamic container width based on visible tabs
    const showTabConfig = {
        tab1: true,
        tab2: true,
        tab3: true,
        tab4: hasLoopPositions,
    }
    const visibleTabsCount = countVisibleTabs(showTabConfig)
    const containerWidth = getToggleTabContainerWidth(visibleTabsCount)

    return (
        <section
            id="all-positions"
            className="all-positions-container flex flex-col gap-[24px] px-5"
        >
            <div className="all-positions-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="all-positions-header-left w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center justify-between gap-[12px] max-lg:w-full">
                        <div className="flex items-center gap-[12px]">
                            <HeadingText
                                level="h3"
                                weight="medium"
                                className="capitalize text-gray-800"
                            >
                                All positions
                            </HeadingText>
                            <InfoTooltip
                                content={
                                    <div className="flex flex-col gap-[4px]">
                                        <BodyText level="body3">
                                            Track all your lending and borrowing
                                            positions in one place.
                                        </BodyText>
                                    </div>
                                }
                            />
                        </div>
                        {/* Filter button for Tablet and below screens */}
                        <div className="block lg:hidden">
                            <AllPositionsFiltersDropdown />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className={`w-full ${containerWidth}`}>
                            <ToggleTab
                                type={positionType === 'all' ? 'tab1' : positionType === 'lend' ? 'tab2' : positionType === 'borrow' ? 'tab3' : 'tab4'}
                                handleToggle={(positionType: TTypeToMatch) => {
                                    toggleOpportunityType(
                                        positionType === 'tab1'
                                            ? 'all'
                                            : positionType === 'tab2'
                                            ? 'lend'
                                            : positionType === 'tab3'
                                            ? 'borrow'
                                            : 'loop'
                                    )
                                }}
                                title={{
                                    tab1: 'All',
                                    tab2: 'Earn',
                                    tab3: 'Borrow',
                                    tab4: 'Loop',
                                }}
                                showTab={showTabConfig}
                            />
                        </div>
                        <div className="sm:max-w-[156px] w-full">
                            <SearchInput
                                onChange={handleKeywordChange}
                                onClear={handleClearSearch}
                                value={searchKeywords}
                            />
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
                {!isLoadingPortfolioData && (
                    <>
                        {positionTypeParam === 'loop' ? (
                            <DataTable
                                columns={loopColumns}
                                data={filteredLoopTableData}
                                filters={searchKeywords}
                                setFilters={setSearchKeywords}
                                handleRowClick={handleRowClick}
                                columnVisibility={{}}
                                setColumnVisibility={setColumnVisibility}
                                sorting={sorting}
                                setSorting={setSorting}
                                noDataMessage="No loop positions"
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredTableData}
                                filters={searchKeywords}
                                setFilters={setSearchKeywords}
                                handleRowClick={handleRowClick}
                                columnVisibility={columnVisibility}
                                setColumnVisibility={setColumnVisibility}
                                sorting={sorting}
                                setSorting={setSorting}
                                noDataMessage="No positions"
                            />
                        )}
                    </>
                )}
                {isLoadingPortfolioData && (
                    <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
                )}
            </div>
        </section>
    )
}
