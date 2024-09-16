import LendBorrowToggle from '@/components/LendBorrowToggle'
import { HeadingText } from '@/components/ui/typography'
import React from 'react'
import Image from 'next/image'
import ChainSelectorDropdown from '@/components/dropdowns/ChainSelectorDropdown'
import DiscoverFilterDropdown from '@/components/dropdowns/DiscoverFilterDropdown'
import { DataTable } from '@/components/ui/data-table'
import { columns, TOpportunity } from '@/data//table/top-apy-opportunities';
import SearchInput from '@/components/inputs/SearchInput'
import MainContainer from '@/components/MainContainer'

async function getTopApyOpportunitiesDummyData(): Promise<TOpportunity[]> {
    // Fetch data from your API here.
    return [
        {
            token: "wBTC",
            chain: "Polygon",
            platform: "Aave",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/aave.webp",
        },
        {
            token: "USDC",
            chain: "Op",
            platform: "Compound",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/usdc.webp",
            chain_image: "/images/chains/op.webp",
            platform_image: "/images/platforms/compound.webp",
        },
        {
            token: "wBTC",
            chain: "matic",
            platform: "Euler",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/euler.webp",
        },
        {
            token: "Eth",
            chain: "matic",
            platform: "Morpho",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/eth.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/morpho.webp",
        },
    ]
}

export default async function Discover() {
    const opportunitiesDummyData = await getTopApyOpportunitiesDummyData();

    return (
        <MainContainer>
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
        </MainContainer>
    )
}   
