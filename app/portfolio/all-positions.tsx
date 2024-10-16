"use client";

import { DataTable } from '@/components/ui/data-table';
import { HeadingText } from '@/components/ui/typography'
import useGetPortfolioData from '@/hooks/useGetPortfolioData';
import React from 'react'
import { useAccount } from 'wagmi';

export default function AllPositions() {
    const { address: walletAddress, isConnecting, isDisconnected } = useAccount();
    const address = "0xBbde906d77465aBc098E8c9453Eb80f3a5F794e9";
    const {
        data,
        isLoading,
        isError
    } = useGetPortfolioData({
        user_address: address,
    });

    const dataWithPositions = data.platforms.filter(platform => platform.positions.length > 0);

    return (
        <section id='all-positions' className="all-positions-container flex flex-col gap-[24px] px-5">
            <div className="all-positions-header flex items-end lg:items-center justify-between gap-[12px]">
                <div className="all-positions-header-left w-full lg:w-auto flex flex-col lg:flex-row items-start lg:items-center gap-[20px] lg:gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                        <HeadingText level="h3">All positions</HeadingText>
                        {/* <InfoTooltip /> */}
                    </div>
                    <div className="flex items-center max-lg:justify-between gap-[12px] w-full lg:w-auto">
                        <div className="max-w-[150px] md:max-w-[250px]">
                            {/* <LendBorrowToggle /> */}
                        </div>
                        {/* <div className="max-w-[156px] w-full">
                                    <SearchInput />
                                </div> */}
                    </div>
                </div>
                {/* <div className="filter-dropdowns-container hidden lg:flex items-center gap-[12px]">
                            <ChainSelectorDropdown />
                            <DiscoverFilterDropdown />
                        </div> */}
            </div>
            {/* <div className="all-positions-content">
                <DataTable columns={columns} data={allPositionsDummyData} />
            </div> */}
        </section>
    )
}
