"use client"

import MainContainer from '@/components/MainContainer'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import React from 'react'
import PortfolioOverview from './portfolio-overview'
import { useAccount } from 'wagmi'
import InfoBannerWithCta from '@/components/InfoBannerWithCta'
import { useAppKit } from '@reown/appkit/react'
import { Skeleton } from '@/components/ui/skeleton'
import YourPositionsAtRisk from './your-positions-at-risk'
import AllPositions from './all-positions'
import { LoaderCircle } from 'lucide-react'
import useIsClient from '@/hooks/useIsClient'
import PositionsProvider from '@/context/positions-provider'
import TopLowRiskPositions from './top-low-risk-positions'

export default function Portfolio() {
    const { address: walletAddress, isConnecting, isDisconnected } = useAccount();
    const { open: openAuthModal, close: closeAuthModal } = useAppKit();
    const { isClient } = useIsClient();

    function handleConnectWallet() {
        openAuthModal();
    }

    if (isConnecting) {
        return <PortfolioPageLoading />
    }

    if ((!walletAddress || isDisconnected) && !isConnecting) {
        return (
            <div className="py-16">
                <InfoBannerWithCta
                    image={'/images/connect-wallet-banner.webp'}
                    title={'Connect Wallet'}
                    description={'Connect your web3 wallet to be able to view your portfolio and take required actions'}
                    ctaText={'Connect wallet'}
                    ctaOnClick={handleConnectWallet}
                />
            </div>
        )
    }

    if (!!walletAddress && walletAddress.length > 0 && isClient) {
        return (
            <MainContainer className='px-0'>
                <section id='your-portfolio' className="portfolio-page-header flex flex-col md:flex-row gap-[16px] items-start md:items-center justify-between mb-[24px] px-5">
                    <div className="flex flex-col gap-[4px]">
                        <HeadingText level="h4">Your Portfolio</HeadingText>
                        <BodyText level='body1' className='text-gray-600'>Track all your lend and borrow positions from one place</BodyText>
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
                        <TopLowRiskPositions />
                    </div>
                    {/* <Button variant="primary" className='group uppercase py-[9px] px-[16px] flex items-center gap-[4px]'>
                    transaction history
                    <ArrowRightIcon width={16} height={16} weight='2' className='stroke-white group-hover:opacity-75 group-active:opacity-75' />
                </Button> */}
                </section>
            </MainContainer >
        )
    }

    return <PortfolioPageLoading />
}

function PortfolioPageLoading() {
    return (
        <MainContainer>
            <div className="relative h-[500px] w-full rounded-6 overflow-hidden">
                <Skeleton className='z-[0] relative w-full h-full' />
                <LoaderCircle className='z-[1] absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin' />
            </div>
        </MainContainer>
    )
}
