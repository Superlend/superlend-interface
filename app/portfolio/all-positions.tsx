'use client'

import AllPositionsFiltersDropdown from '@/components/dropdowns/AllPositionsFiltersDropdown'
import SearchInput from '@/components/inputs/SearchInput'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { DataTable } from '@/components/ui/all-positions-table'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { AssetsDataContext } from '@/context/data-provider'
import { PositionsContext } from '@/context/positions-provider'
import { columns, TPositionsTable } from '@/data/table/all-positions'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { calculateScientificNotation } from '@/lib/utils'
import { TPositionType } from '@/types'
import { PlatformType } from '@/types/platform'
import { SortingState } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export default function AllPositions() {
    const router = useRouter()
    const { logEvent } = useAnalytics()
    const { filters, positionType, setPositionType } =
        useContext(PositionsContext)
    const { address: walletAddress } = useAccount()
    const [searchKeywords, setSearchKeywords] = useState<string>('')
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'apy', desc: positionType === 'lend' },
    ])
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    })
    const { allChainsData } = useContext(AssetsDataContext)

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
    })

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionType === 'lend',
                borrows: positionType === 'borrow',
            }
        })
    }, [positionType])

    useEffect(() => {
        setSorting([{ id: 'apy', desc: positionType === 'lend' }])
    }, [positionType])

    const POSITIONS = portfolioData?.platforms
        ?.flatMap((platform) => {
            return platform.positions.map((position) => {
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
        .flat(portfolioData?.platforms.length)
        .filter((position) => position.type === positionType)

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
        }
    })

    const filteredTableData = rawTableData.filter((position) => {
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

    const tableData = filteredTableData

    function handleRowClick(rowData: any) {
        const { tokenAddress, protocol_identifier, chain_id } = rowData
        const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
        router.push(url)
        logEvent('portfolio_asset_clicked', {
            action: positionType,
            token_symbol: rowData.tokenSymbol,
            platform_name: rowData.platformName,
            chain_name: rowData.chainName,
            wallet_address: walletAddress,
        })
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
                        <div className="w-full sm:max-w-[350px]">
                            <ToggleTab
                                type={positionType === "lend" ? "tab1" : "tab2"}
                                handleToggle={(positionType: TTypeToMatch) => {
                                    toggleOpportunityType(positionType === "tab1" ? "lend" : "borrow")
                                }}
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
                    <DataTable
                        columns={columns}
                        data={tableData}
                        filters={searchKeywords}
                        setFilters={setSearchKeywords}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        sorting={sorting}
                        setSorting={setSorting}
                        noDataMessage={'No positions'}
                    />
                )}
                {isLoadingPortfolioData && (
                    <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
                )}
            </div>
        </section>
    )
}
