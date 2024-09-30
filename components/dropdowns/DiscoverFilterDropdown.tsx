"use client";

import React, { useContext } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BodyText } from '../ui/typography';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronDownIcon } from 'lucide-react';
import FilterIcon from '../icons/filter-icon';
import { AssetsDataContext } from '@/context/data-provider';
import ImageWithDefault from '../ImageWithDefault';

type TProps = {
    filterByChains: number[];
    setFilterByChains: React.Dispatch<React.SetStateAction<number[]>>;
}

const FILTER_CATEGORIES = [
    {
        label: "Chains",
        value: "chains",
    },
]

export default function DiscoverFilterDropdown({
    filterByChains,
    setFilterByChains
}: TProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    function handleClearFilters() {
        setFilterByChains([]);
    }

    const filterCardContentProps = {
        filterByChains,
        setFilterByChains
    }

    const filterCardHeaderProps = {
        handleClearFilters
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="w-fit relative flex items-center gap-2 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl">
                    <FilterIcon className={`${!!filterByChains.length ? "fill-gray-600" : ""}`} width={16} height={16} />
                    Filters
                    <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    <div className={`${!!filterByChains.length ? "absolute block" : "hidden"} -top-[2px] right-[-2px] w-2.5 h-2.5 bg-red-500 rounded-full`}></div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="p-0 rounded-[16px] border-none">
                <FilterCard>
                    <FilterCardHeader {...filterCardHeaderProps} />
                    <FilterCardContent {...filterCardContentProps} />
                </FilterCard>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}

function FilterCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col bg-[rgba(255, 255, 255, 0.4)] backdrop-blur-[500px] md:min-w-[480px] max-w-[480px]">
            {children}
        </div>
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
    filterByChains,
    setFilterByChains
}: any) {
    const { allChainsData } = useContext(AssetsDataContext);

    const isChainSelected = (chainId: number) => {
        return filterByChains.includes(chainId);
    };

    function handleChainSelection(chainId: number | null) {
        if (chainId === null) {
            setFilterByChains([]);
            return;
        }

        if (isChainSelected(chainId)) {
            setFilterByChains((state: any) => state.filter((selectedChainId: any) => selectedChainId !== chainId));
            return;
        }

        setFilterByChains((state: any) => ([...state, chainId]));
    }

    return (
        <div className="filter-card-content grid grid-cols-[120px_1fr] items-start gap-4 bg-white p-[24px] rounded-[16px]">
            <div className="filter-categories flex flex-col gap-2 bg-white">
                {
                    FILTER_CATEGORIES.map(item => (
                        <Button key={item.label} size="md" className="py-[8px] px-[15px] first:bg-gray-300 first:text-black text-gray-500 hover:bg-gray-200 border-0">
                            <span className="w-full text-left">
                                {item.label}
                            </span>
                        </Button>
                    ))
                }
            </div>
            <div className="filter-options flex flex-wrap gap-3 bg-white">
                <Button
                    variant="outline"
                    size="sm"
                    className={`${filterByChains.length === 0 ? "selected" : ""}`}
                    onClick={() => handleChainSelection(null)}>
                    All chains
                </Button>
                {
                    allChainsData
                        .map((chain: any) => (
                            <Button
                                onClick={() => handleChainSelection(chain.chain_id)}
                                variant="outline"
                                size="sm"
                                key={chain.chain_id}
                                className={`flex items-center gap-1 ${isChainSelected(chain.chain_id) ? "selected" : ""}`}>
                                <ImageWithDefault src={chain.logo} alt={chain.name} width={18} height={18} />
                                {chain.name}
                            </Button>
                        ))
                }
            </div>
        </div>
    )
}
