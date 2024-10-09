import MainContainer from '@/components/MainContainer';
import React from 'react';
import PageHeader from './page-header';
import AssetHistory from './asset-history';

export default function PositionManagementPage() {
    return (
        <MainContainer className='flex flex-col gap-[45.5px]'>
            <PageHeader />
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                <div className='flex flex-col gap-[16px]'>
                    <AssetHistory />
                </div>
            </div>
        </MainContainer>
    )
}
