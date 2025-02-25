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
}: {
    positionType: TPositionType
    opportunitiesData: any[]
    isLoadingOpportunitiesData: boolean
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

    useEffect(() => {
        setColumnVisibility(() => {
            return {
                deposits: positionType === 'lend',
                borrows: positionType === 'borrow',
                max_ltv: positionType === 'borrow',
            }
        })
    }, [positionType])

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
            apy_avg_7days: item.platform.apy.avg_7days,
            max_ltv: item.platform.max_ltv,
            deposits: `${Number(item.platform.liquidity) * Number(item.token.price_usd)}`,
            borrows: `${Number(item.platform.borrows) * Number(item.token.price_usd)}`,
            utilization: item.platform.utilization_rate,
            additional_rewards: item.platform.additional_rewards,
            rewards: item.platform.rewards,
            isVault: item.platform.isVault || false,
        }
    })

    const tableData = rawTableData

    function handleRowClick(rowData: TOpportunityTable) {
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
                    <LoadingSectionSkeleton className="h-[320px]" />
                )}
            </div>
        </section>
    )
}
