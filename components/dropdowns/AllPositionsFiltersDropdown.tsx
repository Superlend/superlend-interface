'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { BodyText, Label } from '../ui/typography'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Check, ChevronDownIcon } from 'lucide-react'
import FilterIcon from '../icons/filter-icon'
import { AssetsDataContext } from '@/context/data-provider'
import ImageWithDefault from '../ImageWithDefault'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TToken } from '@/types'
import useDimensions from '@/hooks/useDimensions'
import { PLATFORM_OPTIONS, STABLECOINS_NAMES_LIST } from '@/constants'
import SearchInput from '../inputs/SearchInput'
import {
    PositionsContext,
    TPositionsContext,
    TPositionsFilters,
} from '@/context/positions-provider'
import { PlatformLogo } from '@/types/platform'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'

export default function AllPositionsFiltersDropdown() {
    const [isOpen, setIsOpen] = React.useState<boolean>(false)
    const { allChainsData, allTokensData } = useContext<any>(AssetsDataContext)
    const { filters, setFilters } = useContext<TPositionsContext>(PositionsContext)
    const [isStablecoinsSelected, setIsStablecoinsSelected] = useState(false)
    const { width: screenWidth } = useDimensions()
    const isDesktop = useMemo(() => screenWidth > 768, [screenWidth])
    const searchParams = useSearchParams()
    const updateSearchParams = useUpdateSearchParams()

    const tokenIdsParam = searchParams?.get('token_ids')?.split(',') || []
    const chainIdsParam = searchParams?.get('chain_ids')?.split(',') || []
    const platformIdsParam = searchParams?.get('protocol_ids')?.split(',') || []

    const hasActiveFilters =
        !!filters.token_ids?.length ||
        !!filters.chain_ids?.length ||
        !!filters.platform_ids?.length
    const activeFiltersTotalCount =
        (filters.token_ids?.length || 0) +
        (filters.chain_ids?.length || 0) +
        (filters.platform_ids?.length || 0)
    const getActiveFiltersCountByCategory = (
        filterName: keyof TPositionsFilters
    ) => filters[filterName]?.length ?? 0

    const allTokenOptions = Object.values(allTokensData)
        .flat(1)
        .reduce((acc: TToken[], current: any) => {
            if (
                !acc.some(
                    (item) =>
                        item.symbol.toLocaleUpperCase() ===
                        current.symbol.toLocaleUpperCase()
                )
            ) {
                acc.push(current)
            }
            return acc
        }, [])
        .map((token: TToken) => ({
            name: token.symbol,
            token_id: token.symbol,
            logo: token.logo,
        }))

    const allPlatformsData = [
        {
            logo: PlatformLogo.AAVE,
            name: 'AAVE',
            platform_id: 'AAVE',
        },
        {
            logo: PlatformLogo.COMPOUND,
            name: 'COMPOUND',
            platform_id: 'COMPOUND',
        },
        {
            logo: PlatformLogo.MORPHO,
            name: 'MORPHO VAULTS',
            platform_id: 'MORPHO_VAULTS',
            isVault: true,
        },
        {
            logo: PlatformLogo.MORPHO,
            name: 'MORPHO MARKETS',
            platform_id: 'MORPHO_MARKETS',
            isVault: false,
        },
        {
            logo: PlatformLogo.FLUID,
            name: 'FLUID',
            platform_id: 'FLUID',
        },
        {
            logo: PlatformLogo.SUPERLEND,
            name: 'SUPERLEND',
            platform_id: 'SUPERLEND',
        },
        {
            logo: PlatformLogo.EULER,
            name: 'EULER',
            platform_id: 'EULER',
        },
    ]

    const FILTER_CATEGORIES = [
        {
            label: 'Tokens',
            value: 'token',
        },
        {
            label: 'Chains',
            value: 'chain',
        },
        {
            label: 'Platforms',
            value: 'platform',
        },
    ]

    const FILTER_OPTIONS: any = {
        token: {
            type: 'token',
            options: allTokenOptions,
        },
        chain: {
            type: 'chain',
            options: allChainsData,
        },
        platform: {
            type: 'platform',
            options: allPlatformsData,
        },
    }

    const selectStablecoins = () => {
        if (!isStablecoinsSelected) {
            const searchedList: any[] = []
            STABLECOINS_NAMES_LIST.forEach((el) => {
                const findToken = allTokenOptions.find(
                    (item: any) => item?.token_id === el
                )

                if (findToken) {
                    searchedList.push(findToken.token_id)
                }
            })
            setFilters((state: any) => ({
                ...state,
                token_ids: searchedList,
            }))
            setIsStablecoinsSelected(true)
            return
        }
        setIsStablecoinsSelected(false)
        setFilters((state: any) => ({
            ...state,
            token_ids: state.token_ids.filter(
                (tokenId: string) => !STABLECOINS_NAMES_LIST.includes(tokenId)
            ),
        }))
    }

    function handleClearFilters() {
        setFilters({
            token_ids: [],
            chain_ids: [],
            platform_ids: [],
            protocol_identifier: [],
        })
        setIsStablecoinsSelected(false)
    }

    const handleSelection = (id: number | string | null, filterType: string) => {
        if (id === null) return;
        
        let currentIds: string[] = []
        switch (filterType) {
            case 'token':
                currentIds = filters.token_ids
                break
            case 'chain':
                currentIds = filters.chain_ids
                break
            case 'platform':
                currentIds = filters.platform_ids
                break
        }

        const newIds = currentIds.includes(id.toString())
            ? currentIds.filter((item) => item !== id.toString())
            : [...currentIds, id.toString()]

        switch (filterType) {
            case 'token':
                setFilters(prev => ({ ...prev, token_ids: newIds }))
                break
            case 'chain':
                setFilters(prev => ({ ...prev, chain_ids: newIds }))
                break
            case 'platform':
                setFilters(prev => ({ ...prev, platform_ids: newIds }))
                break
        }
    }

    const isSelected = (id: number | string, filterType: string) => {
        switch (filterType) {
            case 'token':
                return filters.token_ids.includes(id.toString())
            case 'chain':
                return filters.chain_ids.includes(id.toString())
            case 'platform':
                return filters.platform_ids.includes(id.toString())
            default:
                return false
        }
    }

    const filterCardHeaderProps = {
        handleClearFilters,
    }

    const filterCardContentProps = {
        FILTER_CATEGORIES,
        FILTER_OPTIONS,
        getActiveFiltersCountByCategory,
        isStablecoinsSelected,
        selectStablecoins,
    }

    if (isDesktop) {
        return (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="lg"
                        className="w-fit relative flex items-center gap-2 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl"
                    >
                        <FilterIcon
                            className={`hidden xs:inline-block ${hasActiveFilters ? 'fill-gray-600' : ''}`}
                            width={16}
                            height={16}
                        />
                        <span className="trigger-label">Filters</span>
                        <ChevronDownIcon
                            className={`hidden md:inline-block w-4 h-4 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                        <div
                            className={`${hasActiveFilters ? 'absolute block' : 'hidden'} -top-[10px] -right-[8px] flex items-center justify-center w-5 h-5 bg-red-500 rounded-full`}
                        >
                            <Label size="small" className="text-white">
                                {activeFiltersTotalCount}
                            </Label>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="bottom"
                    align="end"
                    className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden"
                >
                    <div className="filter-card flex flex-col md:min-w-[480px] max-w-[480px]">
                        <FilterCardHeader {...filterCardHeaderProps} />
                        <FilterCardContent {...filterCardContentProps} />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button
                    size="lg"
                    className="w-fit relative flex items-center gap-2 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl"
                >
                    <FilterIcon
                        className={`hidden xs:inline-block ${hasActiveFilters ? 'fill-gray-600' : ''}`}
                        width={16}
                        height={16}
                    />
                    <span className="trigger-label">Filters</span>
                    <ChevronDownIcon
                        className={`hidden md:inline-block w-4 h-4 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                    <div
                        className={`${hasActiveFilters ? 'absolute block' : 'hidden'} -top-[10px] -right-[8px] flex items-center justify-center w-5 h-5 bg-red-500 rounded-full`}
                    >
                        <Label size="small" className="text-white">
                            {activeFiltersTotalCount}
                        </Label>
                    </div>
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="filter-card flex flex-col">
                    <FilterCardHeader {...filterCardHeaderProps} />
                    <FilterCardContent {...filterCardContentProps} />
                </div>
                <DrawerFooter className="w-full">
                    <DrawerClose className="w-full">
                        <Button
                            size={'lg'}
                            variant="outline"
                            className="w-full"
                        >
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

// Child components =====================

function FilterCardHeader({ handleClearFilters }: any) {
    return (
        <div className="filter-card-header flex items-center justify-between gap-2 px-5 py-3">
            <BodyText level="body2" weight="bold" className="text-gray-700">
                Filters
            </BodyText>
            <Badge
                variant="blue"
                size="sm"
                className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                onClick={handleClearFilters}
            >
                Clear filters
            </Badge>
        </div>
    )
}

function FilterCardContent({
    FILTER_CATEGORIES,
    FILTER_OPTIONS,
    getActiveFiltersCountByCategory,
    selectStablecoins,
    isStablecoinsSelected,
}: any) {
    const [activeTab, setActiveTab] = useState(FILTER_CATEGORIES[0])
    const isActiveTab = (item: any) =>
        activeTab.value === item.value
            ? 'text-black bg-gray-300'
            : 'text-gray-500 hover:bg-gray-200'

    const filterOptionProps = {
        isStablecoinsSelected,
        selectStablecoins,
        filterOptionsByKeyword,
    }

    return (
        <div className="filter-card-content grid md:grid-cols-[120px_1fr] items-start md:gap-4 bg-white rounded-[16px] overflow-hidden">
            <div className="filter-categories flex md:flex-col gap-4 md:gap-2 bg-white py-2 px-4 md:p-[24px_0px_24px_24px]">
                {FILTER_CATEGORIES.map((item: any) => (
                    <motion.div
                        key={item.label}
                        className="relative md:w-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(item)}
                        onMouseEnter={() => setActiveTab(item)}
                    >
                        <Button
                            key={item.label}
                            size="md"
                            className={`md:w-full flex items-center gap-2 py-[8px] px-[8px] border-0 items-center justify-between overflow-hidden ${isActiveTab(item)}`}
                        >
                            <Label
                                size="small"
                                weight="medium"
                                className={`w-fit text-left self-start cursor-pointer`}
                            >
                                {item.label}
                            </Label>
                            {!!getActiveFiltersCountByCategory(
                                `${item.value.toLowerCase()}_ids`
                            ) && (
                                <Label
                                    size="small"
                                    weight="medium"
                                    className="w-fit text-right flex items-center justify-center bg-gray-300 text-gray-500 rounded-full px-1.5 cursor-pointer"
                                >
                                    {getActiveFiltersCountByCategory(
                                        `${item.value.toLowerCase()}_ids`
                                    )}
                                </Label>
                            )}
                        </Button>
                    </motion.div>
                ))}
            </div>
            <FilterOptions
                {...FILTER_OPTIONS[activeTab.value]}
                {...filterOptionProps}
            />
        </div>
    )
}

function FilterOptions({
    type,
    options,
    isStablecoinsSelected,
    selectStablecoins,
}: {
    type: string
    options: any[]
    isStablecoinsSelected: boolean
    selectStablecoins: any
}) {
    const { filters, setFilters } = useContext<any>(PositionsContext)
    const [searchKeyword, setSearchKeyword] = useState<string>('')

    useEffect(() => {
        setSearchKeyword('')
    }, [type])

    const isSelected = (id: number | string, filterType: string) => {
        return filters[`${filterType}_ids`]?.includes(id)
    }

    const handleSelection = (
        id: number | string | null,
        filterType: string
    ) => {
        if (id === null) {
            setFilters((state: any) => ({
                ...state,
                [`${filterType}_ids`]: [],
            }))
            return
        }

        if (isSelected(id, filterType)) {
            setFilters((state: any) => ({
                ...state,
                [`${filterType}_ids`]: state[`${filterType}_ids`].filter(
                    (selectedId: any) => selectedId !== id
                ),
            }))
            return
        }

        setFilters((state: any) => ({
            ...state,
            [`${filterType}_ids`]: [...state[`${filterType}_ids`], id],
        }))
    }

    return (
        <ScrollArea
            id="filter-options-section"
            className="h-[400px] sm:h-[250px] w-full pt-5"
        >
            <div className="search-container w-[85%] max-w-[400px] ml-[14px] mt-1">
                <SearchInput
                    placeholder={`Search ${type}`}
                    className="ring-1 ring-gray-300"
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    value={searchKeyword}
                    onClear={() => setSearchKeyword('')}
                />
            </div>
            {type === 'token' && (
                <Button
                    variant={
                        isStablecoinsSelected ? 'secondaryOutline' : 'outline'
                    }
                    className="m-4 mb-0 ml-3 flex items-center justify-center gap-1"
                    onClick={selectStablecoins}
                >
                    {isStablecoinsSelected && (
                        <Check className="w-4 h-4 text-secondary-500" />
                    )}
                    Select{isStablecoinsSelected ? 'ed' : ''} Stable Coins
                    <span
                        className={`${isStablecoinsSelected ? 'bg-secondary-300 text-white' : 'bg-gray-500 text-gray-100'} rounded-full px-1 ml-1`}
                    >
                        {STABLECOINS_NAMES_LIST.length}
                    </span>
                </Button>
            )}
            <div className="filter-options flex flex-wrap gap-4 md:gap-3 bg-white p-4 md:p-[24px_24px_24px_14px]">
                <Button
                    variant="outline"
                    size="sm"
                    className={`${filters[`${type}_ids`]?.length === 0 ? 'selected' : ''}`}
                    onClick={() => handleSelection(null, type)}
                >
                    All {type.charAt(0).toUpperCase() + type.slice(1)}s
                </Button>
                {filterOptionsByKeyword(searchKeyword, options).map(
                    (option: any, index: number) => (
                        <Button
                            onClick={() =>
                                handleSelection(option[`${type}_id`], type)
                            }
                            variant="outline"
                            size="sm"
                            key={`${option[`${type}_id`]}-${index}`}
                            className={`flex items-center gap-1 ${isSelected(option[`${type}_id`], type) ? 'selected' : ''}`}
                        >
                            <ImageWithDefault
                                src={option.logo}
                                alt={option.name}
                                width={18}
                                height={18}
                                className="max-w-[18px] max-h-[18px]"
                            />
                            {option.name}
                        </Button>
                    )
                )}
            </div>
        </ScrollArea>
    )
}

// Helper functions =====================

// Function to filter options by category type based on the search keyword
const filterOptionsByKeyword = (searchKeyword: string, options: any[]) => {
    if (!searchKeyword) return options // Return all options if no keyword
    return options.filter((option) =>
        option.name.toLowerCase().includes(searchKeyword.trim().toLowerCase())
    )
}
