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
import { OpportunitiesContext } from '@/context/opportunities-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TToken } from '@/types'
import useDimensions from '@/hooks/useDimensions'
import { CHAIN_ID_MAPPER, STABLECOINS_NAMES_LIST } from '@/constants'
import SearchInput from '../inputs/SearchInput'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { PlatformLogo, ProtocolIdentifier } from '@/types/platform'
import { motion } from 'framer-motion'
import { Switch } from '../ui/switch'
import InfoTooltip from '../tooltips/InfoTooltip'
import TooltipText from '../tooltips/TooltipText'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useGetLoopPairs } from '@/hooks/useGetLoopPairs'

export default function DiscoverFiltersDropdown({ chain, positionType }: { chain?: string, positionType?: string }) {
    const searchParams = useSearchParams()
    const getFiltersFromURL = () => ({
        token_ids: searchParams?.get('token_ids')?.split(',') || [],
        chain_ids: searchParams?.get('chain_ids')?.split(',') || [],
        protocol_ids: searchParams?.get('protocol_ids')?.split(',') || [],
        show_correlated_pairs: searchParams?.get('show_correlated_pairs') === 'true',
    })
    const filters = getFiltersFromURL()
    const [isOpen, setIsOpen] = React.useState<boolean>(false)
    const { allChainsData, allTokensData } = useContext<any>(AssetsDataContext)
    const updateSearchParams = useUpdateSearchParams()
    const pathname = usePathname()
    const [isStablecoinsSelected, setIsStablecoinsSelected] = useState(
        STABLECOINS_NAMES_LIST.every((name) =>
            filters.token_ids.includes(name)
        ) || false
    )
    const [showCorrelatedPairs, setShowCorrelatedPairs] = useState(
        filters.show_correlated_pairs || false
    )
    const { width: screenWidth } = useDimensions()
    const isDesktop = useMemo(() => screenWidth > 768, [screenWidth])
    const positionTypeParam = positionType || searchParams?.get('position_type') || 'lend'
    
    // Get loop pairs data to determine available tokens dynamically
    const { pairs: loopPairs } = useGetLoopPairs()

    // Set initial chain_ids for etherlink and clear filters when switching
    // useEffect(() => {
    //     if (!isLoading) {
    //         if (!showAllMarkets && pathname === '/etherlink') {
    //             const currentChainIds = searchParams.get('chain_ids')?.split(',') || []
    //             if (currentChainIds.length === 0) {
    //                 updateSearchParams({
    //                     chain_ids: '42793'
    //                 })
    //             }
    //         }
    //     }
    // }, [pathname, searchParams, updateSearchParams, isLoading, showAllMarkets])

    const hasActiveFilters =
        !!filters.token_ids.length ||
        ((pathname === '/etherlink' || pathname === '/polygon') ? false : !!filters.chain_ids.length) ||
        !!filters.protocol_ids.length ||
        (positionTypeParam === 'loop' && filters.show_correlated_pairs)
    const activeFiltersTotalCount =
        filters.token_ids.length +
        ((pathname === '/etherlink' || pathname === '/polygon') ? 0 : filters.chain_ids.length) +
        filters.protocol_ids.length +
        (positionTypeParam === 'loop' && filters.show_correlated_pairs ? 1 : 0)
    const getActiveFiltersCountByCategory = (
        filterName: keyof typeof filters
    ) => {
        const filterValue = filters[filterName]
        return Array.isArray(filterValue) ? filterValue.length : 0
    }

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
            protocol_id: 'AAVE',
        },
        {
            logo: PlatformLogo.COMPOUND,
            name: 'COMPOUND',
            protocol_id: 'COMPOUND',
        },
        {
            logo: PlatformLogo.MORPHO,
            name: 'MORPHO VAULTS',
            protocol_id: 'MORPHO_VAULTS',
            isVault: true,
        },
        {
            logo: PlatformLogo.MORPHO,
            name: 'MORPHO MARKETS',
            protocol_id: 'MORPHO_MARKETS',
            isVault: false,
        },
        {
            logo: PlatformLogo.FLUID,
            name: 'FLUID',
            protocol_id: 'FLUID',
        },
        {
            logo: PlatformLogo.SUPERLEND,
            name: 'SUPERLEND',
            protocol_id: 'SUPERLEND',
        },
        {
            logo: PlatformLogo.EULER,
            name: 'EULER',
            protocol_id: 'EULER',
        },
    ]

    const FILTER_CATEGORIES = useMemo(() => {
        const categories = [
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
                value: 'protocol',
            },
        ]

        // Add Correlated Pairs category for loop position type
        if (positionTypeParam === 'loop') {
            categories.unshift({
                label: 'Special',
                value: 'correlated',
            })
        }

        // Remove Chain and Platforms filter categories when on etherlink route
        if (chain === 'etherlink' || chain === 'polygon') {
            return categories.filter(category => category.value !== 'chain')
        }

        return categories
    }, [chain, positionTypeParam])

    const loopAvailableTokens = useMemo(() => {
        if (positionTypeParam !== 'loop' || !loopPairs?.length) return []
        
        const tokenSet = new Set<string>()
        loopPairs.forEach((pair: any) => {
            tokenSet.add(pair.tokenSymbol)
            if (pair.borrowToken?.symbol) {
                tokenSet.add(pair.borrowToken.symbol)
            }
        })
        
        return Array.from(tokenSet)
    }, [positionTypeParam, loopPairs])

    const FILTER_OPTIONS: any = {
        token: {
            type: 'token',
            options: positionTypeParam === 'loop' && loopAvailableTokens.length > 0 
                ? allTokenOptions.filter((token: any) => loopAvailableTokens.includes(token.token_id))
                : allTokenOptions,
        },
        chain: {
            type: 'chain',
            options: allChainsData,
        },
        protocol: {
            type: 'protocol',
            options: allPlatformsData,
        },
        correlated: {
            type: 'correlated',
            options: [],
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
            updateSearchParams({ token_ids: searchedList.join(',') })
            setIsStablecoinsSelected(true)
            return
        }
        setIsStablecoinsSelected(false)
        const currentTokenIds = filters.token_ids.filter(
            (tokenId: string) => !STABLECOINS_NAMES_LIST.includes(tokenId)
        )
        updateSearchParams({
            token_ids: currentTokenIds.length
                ? currentTokenIds.join(',')
                : undefined,
        })
    }

    function handleClearFilters() {
        updateSearchParams({
            token_ids: undefined,
            chain_ids: undefined,
            protocol_ids: undefined,
            show_correlated_pairs: undefined,
        })
        setIsStablecoinsSelected(false)
        setShowCorrelatedPairs(false)
    }

    const handleCorrelatedPairsToggle = () => {
        const newValue = !showCorrelatedPairs
        setShowCorrelatedPairs(newValue)
        updateSearchParams({
            show_correlated_pairs: newValue ? 'true' : undefined,
        })
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
        showCorrelatedPairs,
        handleCorrelatedPairsToggle,
        positionTypeParam,
        loopAvailableTokens,
    }

    if (isDesktop) {
        return (
            <div className="flex items-center gap-4">
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
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center gap-4">
                <Drawer>
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
            </div>
        </>
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
    showCorrelatedPairs,
    handleCorrelatedPairsToggle,
    positionTypeParam,
    loopAvailableTokens,
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
        showCorrelatedPairs,
        handleCorrelatedPairsToggle,
        positionTypeParam,
        loopAvailableTokens,
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
    showCorrelatedPairs,
    handleCorrelatedPairsToggle,
    positionTypeParam,
}: {
    type: string
    options: any[]
    isStablecoinsSelected: boolean
    selectStablecoins: any
    showCorrelatedPairs: boolean
    handleCorrelatedPairsToggle: () => void
    positionTypeParam: string
}) {
    const { logEvent } = useAnalytics()
    const updateSearchParams = useUpdateSearchParams()
    const searchParams = useSearchParams()
    const tokenSymbolParam = searchParams?.get('token_ids')?.split(',') || []
    const chainIdParam = searchParams?.get('chain_ids')?.split(',') || []
    const protocolIdParam = searchParams?.get('protocol_ids')?.split(',') || []
    const [searchKeyword, setSearchKeyword] = useState('')
    const [isExcluded, setIsExcluded] = useState<boolean>(false)
    const isMorphoMarketsRisky = useMemo(
        () => type === 'protocol' && positionTypeParam === 'lend',
        [type, positionTypeParam]
    )

    // Define restrictions for loop position type
    const isLoopPosition = positionTypeParam === 'loop'

    // Function to check if an option should be disabled for loop positions
    const isOptionDisabledForLoop = (option: any) => {
        if (!isLoopPosition) return false
        
        if (type === 'chain') {
            return option.chain_id?.toString() !== '42793'
        }
        
        if (type === 'protocol') {
            return option.protocol_id !== 'SUPERLEND'
        }
        
        return false
    }

    useEffect(() => {
        setSearchKeyword('')
    }, [type])

    useEffect(() => {
        if (isExcluded) {
            const currentProtocolIds =
                searchParams?.get('protocol_ids')?.split(',') || []
            const filteredIds = currentProtocolIds.filter(
                (id) => id !== 'MORPHO_MARKETS'
            )

            if (
                currentProtocolIds.length !== filteredIds.length &&
                positionTypeParam === 'lend'
            ) {
                updateSearchParams({
                    protocol_ids: filteredIds.length
                        ? filteredIds.join(',')
                        : undefined,
                    exclude_risky_markets: isExcluded,
                })
                return
            }
        }

        updateSearchParams({
            exclude_risky_markets:
                positionTypeParam === 'lend' ? isExcluded : undefined,
        })
        localStorage.setItem(
            'exclude_risky_markets',
            isExcluded ? 'true' : 'false'
        )
    }, [isExcluded, positionTypeParam])

    const getFiltersFromURL = () => ({
        token_ids: searchParams?.get('token_ids')?.split(',') || [],
        chain_ids: searchParams?.get('chain_ids')?.split(',') || [],
        protocol_ids: searchParams?.get('protocol_ids')?.split(',') || [],
    })

    const filters = getFiltersFromURL()
    const isSelected = (id: number | string, filterType: string) => {
        const currentFilters =
            filters[`${filterType}_ids` as keyof typeof filters]
        return currentFilters.includes(id.toString())
    }

    // Modified handleSelection to prevent selection of disabled options
    const handleSelection = (
        id: number | string | null,
        filterType: string
    ) => {
        const currentFilters =
            filters[`${filterType}_ids` as keyof typeof filters]
        let newFilters: (string | number)[] | undefined

        if (id === null) {
            newFilters = []
        } else if (isSelected(id, filterType)) {
            newFilters = currentFilters.filter(
                (selectedId: string) => selectedId !== id.toString()
            )
        } else {
            newFilters = [...currentFilters, id.toString()]
        }

        updateSearchParams({
            [`${filterType}_ids`]: newFilters?.length
                ? newFilters.join(',')
                : undefined,
        })

        // const hasFilters = tokenSymbolParam.length > 0 || chainIdParam.length > 0 || protocolIdParam.length > 0
        const hasTokenIds = tokenSymbolParam.length > 0
        const hasChainIds = chainIdParam.length > 0
        const hasPlatformIds = protocolIdParam.length > 0
        logEvent('filter_selected', {
            token_symbols: hasTokenIds ? tokenSymbolParam.join(',') : null,
            chain_names: hasChainIds
                ? chainIdParam
                      ?.map(
                          (chain_id) =>
                              CHAIN_ID_MAPPER[Number(chain_id) as ChainId]
                      )
                      .join(',')
                : null,
            protocol_names: hasPlatformIds ? protocolIdParam.join(',') : null,
            action: positionTypeParam,
        })
    }

    return (
        <div className="md:pt-5">
            {type !== 'correlated' && (
                <div className="search-container w-[85%] max-w-[400px] ml-[14px] mt-1">
                    <SearchInput
                        placeholder={`Search ${type}`}
                        className="ring-1 ring-gray-300"
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        value={searchKeyword}
                        onClear={() => setSearchKeyword('')}
                    />
                </div>
            )}
            <ScrollArea
                id="filter-options-section"
                className="h-[300px] sm:h-[200px] w-full pt-2"
            >
                {type === 'correlated' && (
                    <div className="p-4">
                        <div className="flex flex-col gap-4">
                            <div className="text-sm text-gray-600 mb-2">
                                Filter loop strategies to show only correlated token pairs
                            </div>
                            <div className="flex items-center space-x-3">
                                <Switch
                                    id="show-correlated-pairs-dropdown"
                                    checked={showCorrelatedPairs}
                                    onCheckedChange={handleCorrelatedPairsToggle}
                                />
                                <Label htmlFor="show-correlated-pairs-dropdown" className="text-sm cursor-pointer">
                                    Show Only Correlated Pairs
                                </Label>
                            </div>
                            
                        </div>
                    </div>
                )}
                {type === 'token' && (
                    <Button
                        variant={
                            isStablecoinsSelected
                                ? 'secondaryOutline'
                                : 'outline'
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
                {type !== 'correlated' && (
                    <div className="filter-options flex flex-wrap gap-4 md:gap-3 bg-white p-4 md:p-[24px_24px_24px_14px]">
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className={`${filters[`${type}_ids` as keyof typeof filters]?.length === 0 ? 'selected' : ''}`}
                            onClick={() => handleSelection(null, type)}
                        >
                            All {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </Button>
                        {filterOptionsByKeyword(searchKeyword, options).map(
                            (option: any) => {
                                const isLoopDisabled = isOptionDisabledForLoop(option)
                                const isMorphoDisabled = isMorphoMarketsRisky &&
                                    option.protocol_id === 'MORPHO_MARKETS' &&
                                    isExcluded
                                const shouldDisable = isLoopDisabled || isMorphoDisabled
                                
                                return (
                                    <Button
                                        onClick={() =>
                                            !shouldDisable && handleSelection(option[`${type}_id`], type)
                                        }
                                        variant="outline"
                                        size="sm"
                                        key={option[`${type}_id`]}
                                        disabled={shouldDisable}
                                        className={`flex items-center gap-1 ${
                                            isSelected(option[`${type}_id`], type) ? 'selected' : ''
                                        } ${
                                            shouldDisable ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''
                                        }`}
                                        title={
                                            isLoopDisabled && isLoopPosition 
                                                ? `${option.name} is not available for loop positions. Only Etherlink chain and Superlend platform are supported.`
                                                : undefined
                                        }
                                    >
                                        <ImageWithDefault
                                            src={option.logo}
                                            alt={option.name}
                                            width={18}
                                            height={18}
                                            className={`max-w-[18px] max-h-[18px] ${shouldDisable ? 'grayscale' : ''}`}
                                        />
                                        {option.name}
                                    </Button>
                                )
                            }
                        )}
                    </div>
                )}
                {isMorphoMarketsRisky && (
                    <div className="group flex items-center space-x-2 pb-6 pl-5 cursor-pointer w-fit">
                        <Switch
                            id="exclude-morpho-markets"
                            checked={isExcluded}
                            onCheckedChange={setIsExcluded}
                        />
                        <InfoTooltip
                            label={
                                <Label htmlFor="exclude-morpho-markets">
                                    Exclude Risky Platforms
                                </Label>
                            }
                            content="Supplying to Morpho markets are risky. Excluding them."
                        />
                    </div>
                )}
                {positionTypeParam === 'loop' && type !== 'correlated' && (
                    <div className="group flex items-center space-x-2 pb-6 pl-5 cursor-pointer w-fit">
                        <Switch
                            id="show-correlated-pairs"
                            checked={showCorrelatedPairs}
                            onCheckedChange={handleCorrelatedPairsToggle}
                        />
                        <InfoTooltip
                            label={
                                <Label htmlFor="show-correlated-pairs">
                                    Show Correlated Pairs
                                </Label>
                            }
                            content="Show only correlated token pairs like USDC/USDT, mTBILL/mBASIS, WETH/WBTC"
                        />
                    </div>
                )}
            </ScrollArea>
        </div>
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
