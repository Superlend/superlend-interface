"use client";

import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BodyText } from '../ui/typography';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { allChains } from '@/data/all-chains';
import Image from 'next/image';
import { IChain } from '@/types/chain';
import FilterIcon from '../icons/filter-icon';

export default function DiscoverFilterDropdown() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="w-fit flex items-center gap-2 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl">
                    <FilterIcon width={16} height={16} />
                    Filters
                    <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="p-0 rounded-[16px] border-none">
                <FilterCard>
                    <FilterCardHeader />
                    <FilterCardContent />
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

function FilterCardHeader() {
    return (
        <div className="flex items-center justify-between gap-2 px-5 py-3">
            <BodyText level="body2" weight="bold" className="text-gray-700">Filters</BodyText>
            <Badge variant="blue" size="sm" className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'>Clear filters</Badge>
        </div>
    )
}

function FilterCardContent() {
    return (
        <div className="grid grid-cols-[120px_1fr] items-start gap-4 bg-white p-[24px] rounded-[16px]">
            <FilterCategories />
            <FilterSelectors />
        </div>
    )
}

function FilterCategories() {
    return (
        <div className="flex flex-col gap-2 bg-white">
            {
                FILTER_CATEGORIES.map(item => (
                    <Button size="md" className="py-[8px] px-[15px] first:bg-gray-300 first:text-black text-gray-500 hover:bg-gray-200 border-0">
                        <span className="w-full text-left">
                            {item.label}
                        </span>
                    </Button>
                ))
            }
        </div>
    )
}

function FilterSelectors() {
    return (
        <div className="flex flex-wrap gap-3 bg-white">
            <Button variant="outline" size="sm">All tokens</Button>
            {
                allChains.filter((chain) => chain.id !== 0).map((chain: IChain) => (
                    <Button variant="outline" size="sm" key={chain.id} className='flex items-center gap-1'>
                        <img src={chain.image} alt={chain.name} width={24} height={24} />
                        {chain.name}
                    </Button>
                ))
            }
        </div>
    )
}

const FILTER_CATEGORIES = [
    {
        label: "Collateral token"
    },
    {
        label: "Debt token"
    },
    {
        label: "Protocol"
    },
    {
        label: "Network"
    },
    {
        label: "Liquidity"
    },
    {
        label: "Deposits"
    },
]
