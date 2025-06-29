'use client'

import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPositionType } from '@/types'
import { TChain } from '@/types/chain'
import { TPortfolio } from '@/types/queries/portfolio'
import {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react'
import { AssetsDataContext } from './data-provider'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'

export type TPositionsFilters = {
    token_ids: string[]
    chain_ids: string[]
    platform_ids: string[]
    protocol_identifier?: string[]
}

export type TPositionsContext = {
    filters: TPositionsFilters
    setFilters: Dispatch<SetStateAction<TPositionsFilters>>
    positionType: TPositionType
    setPositionType: Dispatch<SetStateAction<TPositionType>>
    portfolioData: TPortfolio
    isLoadingPortfolioData: boolean
    isErrorPortfolioData: boolean
}

const filtersInit = {
    token_ids: [],
    chain_ids: [],
    platform_ids: [],
    protocol_identifier: [],
}

const positionTypeInit: TPositionType = 'all'

const PortfolioDataInit = {
    platforms: [],
    total_borrowed: 0,
    total_supplied: 0,
}

export const PositionsContext = createContext<TPositionsContext>({
    filters: filtersInit,
    setFilters: () => {},
    positionType: positionTypeInit,
    setPositionType: () => {},
    portfolioData: PortfolioDataInit,
    isLoadingPortfolioData: false,
    isErrorPortfolioData: false,
})

export default function PositionsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const searchParams = useSearchParams()
    const updateSearchParams = useUpdateSearchParams()
    const positionTypeParam = searchParams?.get('position_type') || 'all'
    const tokenIdsParam = searchParams?.get('token_ids')?.split(',').filter(Boolean) || []
    const chainIdsParam = searchParams?.get('chain_ids')?.split(',').filter(Boolean) || []
    const platformIdsParam = searchParams?.get('protocol_ids')?.split(',').filter(Boolean) || []

    const [positionType, setPositionType] = useState<TPositionType>(positionTypeParam as TPositionType)
    const [filters, setFilters] = useState<TPositionsFilters>({
        token_ids: tokenIdsParam,
        chain_ids: chainIdsParam,
        platform_ids: platformIdsParam,
        protocol_identifier: [],
    })

    // Update URL when filters change
    useEffect(() => {
        updateSearchParams({
            token_ids: filters.token_ids.length ? filters.token_ids.join(',') : undefined,
            chain_ids: filters.chain_ids.length ? filters.chain_ids.join(',') : undefined,
            protocol_ids: filters.platform_ids.length ? filters.platform_ids.join(',') : undefined,
        })
    }, [filters])

    // Update URL when position type changes
    useEffect(() => {
        updateSearchParams({
            position_type: positionType,
        })
    }, [positionType])

    // Initialize from URL params only once on mount
    useEffect(() => {
        setFilters({
            token_ids: tokenIdsParam,
            chain_ids: chainIdsParam,
            platform_ids: platformIdsParam,
            protocol_identifier: [],
        })
        setPositionType(positionTypeParam as TPositionType)
    }, []) // Empty dependency array means this runs only once on mount

    const [isLoadingPortfolioData, setIsLoadingPortfolioData] =
        useState<boolean>(false)
    const [isErrorPortfolioData, setIsErrorPortfolioData] =
        useState<boolean>(false)
    const [portfolioData, setPortfolioData] =
        useState<TPortfolio>(PortfolioDataInit)
    const { allChainsData } = useContext(AssetsDataContext)
    const { address: walletAddress } = useAccount()
    const chainsIds = allChainsData.map((chain: TChain) => chain.chain_id)

    // get portfolio data for subset of chains (3 chains)
    const {
        data: portfolioData1,
        isLoading: isLoadingPortfolioData1,
        isError: isErrorPortfolioData1,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(0, 3).map(String),
    })

    // get portfolio data for subset of chains (3 chains)
    const {
        data: portfolioData2,
        isLoading: isLoadingPortfolioData2,
        isError: isErrorPortfolioData2,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(3, 6).map(String),
    })

    // get portfolio data for subset of chains (4 chains)
    const {
        data: portfolioData3,
        isLoading: isLoadingPortfolioData3,
        isError: isErrorPortfolioData3,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(6, 10).map(String),
    })

    // combine all portfolio data loading states
    useEffect(() => {
        setIsLoadingPortfolioData(
            isLoadingPortfolioData1 &&
                isLoadingPortfolioData2 &&
                isLoadingPortfolioData3
        )
    }, [
        isLoadingPortfolioData1,
        isLoadingPortfolioData2,
        isLoadingPortfolioData3,
    ])

    // combine all portfolio data error states
    useEffect(() => {
        setIsErrorPortfolioData(
            isErrorPortfolioData1 ||
                isErrorPortfolioData2 ||
                isErrorPortfolioData3
        )
    }, [isErrorPortfolioData1, isErrorPortfolioData2, isErrorPortfolioData3])

    // combine all portfolio data subsets
    useEffect(() => {
        setPortfolioData((prev: TPortfolio) => ({
            ...prev,
            ...portfolioData1,
        }))
    }, [portfolioData1])

    useEffect(() => {
        setPortfolioData((prev: TPortfolio) => ({
            ...prev,
            ...portfolioData2,
        }))
    }, [portfolioData2])

    useEffect(() => {
        setPortfolioData((prev: TPortfolio) => ({
            ...prev,
            ...portfolioData3,
        }))
    }, [portfolioData3])

    return (
        <PositionsContext.Provider
            value={{
                filters,
                setFilters,
                positionType,
                setPositionType,
                portfolioData,
                isLoadingPortfolioData,
                isErrorPortfolioData,
            }}
        >
            {children}
        </PositionsContext.Provider>
    )
}

export const usePositionsContext = () => useContext(PositionsContext)
