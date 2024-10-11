import { HeadingText } from '@/components/ui/typography'
import React from 'react'

export default function AllPositions() {
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
