import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import React from 'react'
import Image from 'next/image'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/data/top-apy-opportunities';
import { getTopApyOpportunitiesDummyData } from '@/app/discover/top-apy-opportunities/page';
import SearchInput from '@/components/inputs/SearchInput'

export default async function Discover() {

    return (
        <main className='max-w-[1200px] mx-auto'>
            <TopApyOpportunities />
        </main>
    )
}

async function TopApyOpportunities() {
    const opportunitiesDummyData = await getTopApyOpportunitiesDummyData();

    return (
        <div className="top-apy-opportunities-container flex flex-col gap-[24px]">
            <div className="top-apy-opportunities-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="top-apy-opportunities-header-left w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                        <HeadingText level="h3">Top APY Opportunities</HeadingText>
                        <Image src="/icons/info-circle-icon.svg" alt="info" width={16} height={16} className='object-contain cursor-pointer' />
                    </div>
                    <div className="flex items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className="max-w-[150px] md:max-w-[250px]">
                            <LendBorrowToggle />
                        </div>
                        <div className="max-w-[156px] w-full">
                            <SearchInput />
                        </div>
                    </div>
                </div>
                <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                    <ChainSelectorDropdown />
                    <DiscoverFilterDropdown />
                </div>
            </div>
            <div className="top-apy-opportunities-content">
                <DataTable columns={columns} data={opportunitiesDummyData} />
            </div>
        </div>
    )
}   
