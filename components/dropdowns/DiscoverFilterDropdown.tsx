"use client";

import React, { useContext, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BodyText, Label } from '../ui/typography';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronDownIcon } from 'lucide-react';
import FilterIcon from '../icons/filter-icon';
import { AssetsDataContext } from '@/context/data-provider';
import ImageWithDefault from '../ImageWithDefault';
import { OpportunitiesContext } from '@/context/opportunities-provider';
import { getPlatformLogo, getTokenLogo } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area"
import { TToken } from '@/types';

const allPlatformsData = [
    {
        logo: getPlatformLogo("AAVE"),
        name: "AAVE",
        platform_id: "AAVE"
    },
    {
        logo: getPlatformLogo("COMPOUND"),
        name: "COMPOUND",
        platform_id: "COMPOUND"
    },
]

export default function DiscoverFilterDropdown() {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const { filters, setFilters } = useContext<any>(OpportunitiesContext);
    const { allChainsData, allTokensData } = useContext<any>(AssetsDataContext);

    const hasActiveFilters = !!filters.token_ids.length || !!filters.chain_ids.length || !!filters.platform_ids.length
    const activeFiltersTotalCount = filters.token_ids.length || filters.chain_ids.length + filters.platform_ids.length;
    const getActiveFiltersCountByCategory = (filterName: string) => (filters[filterName]?.length);

    const FILTER_CATEGORIES = [
        {
            label: "Tokens",
            value: "token",
        },
        {
            label: "Chains",
            value: "chain",
        },
        {
            label: "Platforms",
            value: "platform",
        },
    ]

    const FILTER_OPTIONS: any = {
        token: {
            type: "token",
            options: Object.values(allTokensData).flat(1)
                .reduce((acc: TToken[], current: any) => {
                    if (!acc.some((item) => item.symbol === current.symbol)) {
                        acc.push(current)
                    }
                    return acc
                }, [])
                .map((token: TToken) => ({
                    name: token.symbol,
                    token_id: token.symbol,
                    logo: getTokenLogo(token.symbol)
                }))
        },
        chain: {
            type: "chain",
            options: allChainsData
        },
        platform: {
            type: "platform",
            options: allPlatformsData
        },
    };

    function handleClearFilters() {
        setFilters({
            token_ids: [],
            chain_ids: [],
            platform_ids: [],
        });
    }

    const filterCardHeaderProps = {
        handleClearFilters
    }

    const filterCardContentProps = {
        FILTER_CATEGORIES,
        FILTER_OPTIONS,
        getActiveFiltersCountByCategory
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="w-fit relative flex items-center gap-2 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl">
                    <FilterIcon className={`${hasActiveFilters ? "fill-gray-600" : ""}`} width={16} height={16} />
                    Filters
                    <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    <div className={`${hasActiveFilters ? "absolute block" : "hidden"} -top-[6px] -right-[6px] flex items-center justify-center w-4 h-4 bg-red-500 rounded-full`}>
                        <Label size='small' className='text-white'>{activeFiltersTotalCount}</Label>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="p-0 rounded-[16px] border-none bg-white bg-opacity-40">
                <div className="filter-card flex flex-col md:min-w-[480px] max-w-[480px]">
                    <FilterCardHeader {...filterCardHeaderProps} />
                    <FilterCardContent {...filterCardContentProps} />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}

function FilterCardHeader({
    handleClearFilters
}: any) {
    return (
        <div className="filter-card-header flex items-center justify-between gap-2 px-5 py-3">
            <BodyText level="body2" weight="bold" className="text-gray-700">Filters</BodyText>
            <Badge
                variant="blue"
                size="sm"
                className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'
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
    getActiveFiltersCountByCategory
}: any) {
    const [activeTab, setActiveTab] = useState(FILTER_CATEGORIES[0]);
    const isActiveTab = (item: any) => activeTab.value === item.value ? "text-black bg-gray-300" : "text-gray-500 hover:bg-gray-200";

    return (
        <div className="filter-card-content grid grid-cols-[120px_1fr] items-start gap-4 bg-white rounded-[16px]">
            <div className="filter-categories flex flex-col gap-2 bg-white p-[24px_0px_24px_24px]">
                {
                    FILTER_CATEGORIES.map((item: any) => (
                        <Button
                            onClick={() => setActiveTab(item)}
                            key={item.label}
                            size="md"
                            className={`py-[8px] px-[8px] border-0 items-center justify-between  ${isActiveTab(item)}`}>
                            <Label size='small' weight='medium' className={`w-fit text-left self-start`}>
                                {item.label}
                            </Label>
                            {!!getActiveFiltersCountByCategory(`${item.value.toLowerCase()}_ids`) &&
                                <Label size='small' weight='medium' className="w-fit text-right flex items-center justify-center bg-gray-300 text-gray-500 rounded-full px-1.5">
                                    {getActiveFiltersCountByCategory(`${item.value.toLowerCase()}_ids`)}
                                </Label>
                            }
                        </Button>
                    ))
                }
            </div>
            <FilterOptions {...FILTER_OPTIONS[activeTab.value]} />
        </div>
    )
}

// New reusable FilterOptions component
function FilterOptions({ type, options }: { type: string; options: any[] }) {
    const { filters, setFilters } = useContext<any>(OpportunitiesContext);

    const isSelected = (id: number | string, filterType: string) => {
        return filters[`${filterType}_ids`]?.includes(id);
    };

    const handleSelection = (id: number | string | null, filterType: string) => {
        if (id === null) {
            setFilters((state: any) => ({
                ...state,
                [`${filterType}_ids`]: []
            }));
            return;
        }

        if (isSelected(id, filterType)) {
            setFilters((state: any) => ({
                ...state,
                [`${filterType}_ids`]: state[`${filterType}_ids`].filter((selectedId: any) => selectedId !== id)
            }));
            return;
        }

        setFilters((state: any) => ({
            ...state,
            [`${filterType}_ids`]: [...state[`${filterType}_ids`], id]
        }));
    };

    return (
        <ScrollArea className="h-[200px] w-full">
            <div className="filter-options flex flex-wrap gap-3 bg-white p-[24px_24px_24px_14px]">
                <Button
                    variant="outline"
                    size="sm"
                    className={`${filters[`${type}_ids`]?.length === 0 ? "selected" : ""}`}
                    onClick={() => handleSelection(null, type)}>
                    All {type.charAt(0).toUpperCase() + type.slice(1)}s
                </Button>
                {
                    options.map((option: any) => (
                        <Button
                            onClick={() => handleSelection(option[`${type}_id`], type)}
                            variant="outline"
                            size="sm"
                            key={option[`${type}_id`]}
                            className={`flex items-center gap-1 ${isSelected(option[`${type}_id`], type) ? "selected" : ""}`}>
                            <ImageWithDefault src={option.logo} alt={option.name} width={18} height={18} />
                            {option.name}
                        </Button>
                    ))
                }
            </div>
        </ScrollArea>
    );
}
