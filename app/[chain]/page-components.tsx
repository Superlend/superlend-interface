import React from 'react'
import MainContainer from '@/components/MainContainer'
import TopOpportunitiesOnWalletTokens from './top-opportunities-on-wallet-tokens'
import TrendingLendTokens from './trending-lend-tokens'
import TopApyOpportunities from './top-apy-opportunities'
import OpportunitiesProvider from '@/context/opportunities-provider'
import DiscoverOpportunities from './discover-opportunities'
import AppleFarmBanner from './apple-farm-banner'

interface DiscoverPageComponentsProps {
    chain: string;
}

export default async function DiscoverPageComponents({ chain }: DiscoverPageComponentsProps) {
    // Show Apple Farm Banner only for etherlink
    const showAppleFarmBanner = chain === 'etherlink'

    return (
        <MainContainer className="flex flex-col gap-[72px] px-0">
            {/* Chain-specific banner */}
            {showAppleFarmBanner && (
                <div className="px-5">
                    <AppleFarmBanner />
                </div>
            )}

            {/* Common components for all chains */}
            <DiscoverOpportunities chain={chain} />
            <OpportunitiesProvider>
                <TopApyOpportunities chain={chain} />
            </OpportunitiesProvider>

            {/* 
                Future chain-specific components or behaviors can be added here
                Example:
                {chain === 'someChain' && <ChainSpecificComponent />}
            */}

            {/* Currently disabled components */}
            {/* <TopOpportunitiesOnWalletTokens /> */}
            {/* <TrendingLendTokens /> */}
        </MainContainer>
    )
} 