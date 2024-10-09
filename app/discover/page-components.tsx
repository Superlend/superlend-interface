import React from 'react'
import MainContainer from '@/components/MainContainer'
import TopOpportunitiesOnWalletTokens from './top-opportunities-on-wallet-tokens'
import TrendingLendTokens from './trending-lend-tokens'
import TopApyOpportunities from './top-apy-opportunities'
import OpportunitiesProvider from '@/context/opportunities-provider'

export default async function DiscoverPageComponents() {

    return (
        <MainContainer className='flex flex-col gap-[72px] px-0'>
            <OpportunitiesProvider>
                <TopApyOpportunities />
            </OpportunitiesProvider>
            {/* <TopOpportunitiesOnWalletTokens /> */}
            {/* <TrendingLendTokens /> */}
        </MainContainer>
    )
}