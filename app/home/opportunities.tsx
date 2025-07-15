'use client'

import React, {
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from 'react'
import ToggleTab from '@/components/ToggleTab'
import { HeadingText } from '@/components/ui/typography'
import { OpportunitiesDataTable } from '@/components/tables/opportunities-data-table'
import { columns } from '@/data/table/opportunities'
import { columns as columnsForLoops } from '@/data/table/loop-opportunities'
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
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import { useGetLoopPairsFromAPI } from '@/hooks/useGetLoopPairsFromAPI'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunityTable[]
    columns: ColumnDef<TOpportunityTable>[]
}

const EXCLUDE_DEPRICATED_MORPHO_ASSET_BY_PROTOCOL =
    '0x3d819db807d8f8ca10dfef283a3cf37d5576a2abcec9cfb6874efd2df8f4b6ed'

export default function Opportunities({
    positionType,
    opportunitiesData,
    isLoadingOpportunitiesData,
    filters = '',
    selectedToken = null,
}: {
    positionType: TPositionType
    opportunitiesData: any[]
    isLoadingOpportunitiesData: boolean
    filters?: string
    selectedToken?: any
}) {
    const router = useRouter()
    const { logEvent } = useAnalytics()
    const [columnVisibility, setColumnVisibility] = useState({
        deposits: true,
        borrows: false,
    })
    const [isTableLoading, setIsTableLoading] = useState(false)
    const { allChainsData } = useContext<any>(AssetsDataContext)
    const { walletAddress } = useWalletConnection()
    const { appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards, hasAppleFarmRewards } = useAppleFarmRewards()
    
    // Get loop pairs when position type is 'loop'
    const { pairs: loopPairs, isLoading: isLoadingLoopPairs } = useGetLoopPairsFromAPI()

    useEffect(() => {
        setColumnVisibility(() => {
            if (positionType === 'loop') {
                return {
                    deposits: false,
                    borrows: false,
                    max_ltv: false,
                    collateral_exposure: false,
                    available_liquidity: true,
                    apy_avg_7days: false,
                }
            }
            return {
                deposits: positionType === 'lend',
                borrows: positionType === 'borrow',
                max_ltv: positionType === 'borrow',
                collateral_exposure: positionType === 'lend',
                available_liquidity: positionType === 'borrow',
                apy_avg_7days: positionType === 'lend',
            }
        })
    }, [positionType])

    const rawTableData: TOpportunityTable[] = useMemo(() => {
        // For loop position type, use loop pairs instead of raw opportunities data
        if (positionType === 'loop') {
            // If a token is selected, filter loop pairs to only show strategies that include the selected token
            if (selectedToken) {
                return loopPairs.filter((pair: any) => {
                    const selectedTokenAddress = selectedToken.address.toLowerCase()
                    const lendTokenAddress = pair.tokenAddress.toLowerCase()
                    const borrowTokenAddress = pair.borrowToken?.address.toLowerCase()
                    
                    // Show pair if selected token is either the lend token or borrow token
                    return lendTokenAddress === selectedTokenAddress || borrowTokenAddress === selectedTokenAddress
                })
            }
            return loopPairs
        }

        // For lend/borrow, use the existing transformation logic
        return opportunitiesData.map((item) => {
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
                available_liquidity: item.platform.available_liquidity,
                apple_farm_apr: appleFarmRewardsAprs[item.token.address] ?? 0,
                has_apple_farm_rewards: hasAppleFarmRewards(item.token.address) && positionType === 'lend',
            }
        })
    }, [positionType, loopPairs, opportunitiesData, allChainsData, appleFarmRewardsAprs, hasAppleFarmRewards, selectedToken])

    // Filter table data based on search filters
    const tableData = useMemo(() => {
        if (!filters.trim()) return rawTableData

        const searchTerm = filters.toLowerCase()
        
        return rawTableData.filter(item => {
            // For loop pairs, search in both lend token and borrow token
            if (positionType === 'loop' && 'borrowToken' in item) {
                const loopItem = item as any // Type assertion for loop pair
                return (
                    item.tokenSymbol.toLowerCase().includes(searchTerm) ||
                    item.tokenName.toLowerCase().includes(searchTerm) ||
                    loopItem.borrowToken.symbol.toLowerCase().includes(searchTerm) ||
                    loopItem.borrowToken.name.toLowerCase().includes(searchTerm) ||
                    item.platformName.toLowerCase().includes(searchTerm)
                )
            }
            
            // For lend/borrow, search in token and platform
            return (
                item.tokenSymbol.toLowerCase().includes(searchTerm) ||
                item.tokenName.toLowerCase().includes(searchTerm) ||
                item.platformName.toLowerCase().includes(searchTerm)
            )
        })
    }, [rawTableData, filters, positionType])

    function handleRowClick(rowData: TOpportunityTable) {
        if (positionType === 'loop') {
            // For loop pairs, use both lend and borrow token information
            const { tokenAddress, borrowToken, protocol_identifier, chain_id } = rowData as any
            const url = `/position-management?lend_token=${tokenAddress}&borrow_token=${borrowToken.address}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
            router.push(url)
            logEvent('opportunity_selected', {
                token_symbol: `${rowData.tokenSymbol} → ${borrowToken.symbol}`,
                chain_name: rowData.chainName,
                platform_name: rowData.platformName,
                apy: (rowData as any).maxAPY,
                action: positionType,
                wallet_address: walletAddress,
            })
        } else {
            // For lend/borrow, use existing logic
            const { tokenAddress, protocol_identifier, chain_id } = rowData
            const url = `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
            router.push(url)
            logEvent('opportunity_selected', {
                token_symbol: rowData.tokenSymbol,
                chain_name: rowData.chainName,
                platform_name: rowData.platformName,
                apy: rowData.apy_current,
                action: positionType,
                wallet_address: walletAddress,
            })
        }
    }

    // Choose the appropriate columns based on position type
    const filteredColumns = useMemo(() => {
        return positionType === 'loop' ? columnsForLoops : columns
    }, [positionType])

    return (
        <section
            id="opportunities-table"
            className="opportunities-table flex flex-col gap-[24px]"
        >
            <div className="opportunities-table">
                {!isLoadingOpportunitiesData && !isLoadingLoopPairs && !isTableLoading && (
                    <OpportunitiesDataTable
                        columns={filteredColumns}
                        data={tableData}
                        handleRowClick={handleRowClick}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                    />
                )}
                {((isLoadingOpportunitiesData && positionType !== 'loop') || (isLoadingLoopPairs && positionType === 'loop') || isTableLoading) && (
                    <LoadingSectionSkeleton className="h-[320px]" />
                )}
            </div>
        </section>
    )
}
