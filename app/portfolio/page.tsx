'use client'

import MainContainer from '@/components/MainContainer'
import { BodyText, HeadingText } from '@/components/ui/typography'
import React from 'react'
import PortfolioOverview from './portfolio-overview'
import InfoBannerWithCta from '@/components/InfoBannerWithCta'
import { Skeleton } from '@/components/ui/skeleton'
import YourPositionsAtRisk from './your-positions-at-risk'
import AllPositions from './all-positions'
import { LoaderCircle } from 'lucide-react'
import useIsClient from '@/hooks/useIsClient'
import PortfolioProvider from '@/context/portfolio-provider'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import PositionsProvider from '@/context/positions-provider'
import { useAccount } from 'wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import Loading from './loading'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'

export default function Portfolio() {
    const { isConnectingWallet, isWalletConnected } = useWalletConnection()
    const { isClient } = useIsClient()

    if (!isClient || isConnectingWallet || (isClient && isConnectingWallet)) {
        return (
            <MainContainer>
                <LoadingSectionSkeleton className="h-[500px] w-full" />
            </MainContainer>
        )
    }

    if (isClient && !isConnectingWallet && !isWalletConnected) {
        return (
            <div className="py-16">
                <InfoBannerWithCta
                    image={'/images/connect-wallet-banner.webp'}
                    title={'Connect Wallet'}
                    description={
                        'Connect your wallet to view and manage your portfolio.'
                    }
                    // ctaText={'Connect wallet'}
                    // ctaOnClick={handleConnectWallet}
                    ctaButton={<ConnectWalletButton />}
                />
            </div>
        )
    }

    return (
        <PortfolioProvider>
            <MainContainer className="px-0">
                <section
                    id="your-portfolio"
                    className="portfolio-page-header flex flex-col md:flex-row gap-[16px] items-start md:items-center justify-between mb-[24px] px-5"
                >
                    <div className="flex flex-col gap-[4px]">
                        <HeadingText
                            level="h4"
                            weight="medium"
                            className="text-gray-800"
                        >
                            Your Portfolio
                        </HeadingText>
                        <BodyText level="body1" className="text-gray-600">
                            Track all your lending and borrowing positions
                            in one place.
                        </BodyText>
                    </div>
                    {/* <Button variant="primary" className='group uppercase py-[9px] px-[16px] flex items-center gap-[4px]'>
                        transaction history
                        <ArrowRightIcon width={16} height={16} weight='2' className='stroke-white group-hover:opacity-75 group-active:opacity-75' />
                    </Button> */}
                </section>
                <section>
                    <div className="flex flex-col gap-[72px]">
                        <PortfolioOverview />
                        <YourPositionsAtRisk />
                        <PositionsProvider>
                            <AllPositions />
                        </PositionsProvider>
                        {/* <TopLowRiskPositions /> */}
                    </div>
                    {/* <Button variant="primary" className='group uppercase py-[9px] px-[16px] flex items-center gap-[4px]'>
                    transaction history
                    <ArrowRightIcon width={16} height={16} weight='2' className='stroke-white group-hover:opacity-75 group-active:opacity-75' />
                </Button> */}
                </section>
            </MainContainer>
        </PortfolioProvider>
    )
}
