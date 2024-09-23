import React from 'react'
import MainContainer from '@/components/MainContainer'
import TopApyOpportunities from './top-apy-opportunities'
import TopOpportunitiesOnWalletTokens from './top-opportunities-on-wallet-tokens'
import TrendingLendTokens from './trending-lend-tokens'

export default async function DiscoverPageComponents() {

    return (
        <MainContainer className='flex flex-col gap-[72px] px-0'>
            <TopApyOpportunities />
            {/* <TopOpportunitiesOnWalletTokens /> */}
            {/* <TrendingLendTokens /> */}
        </MainContainer>
    )
}