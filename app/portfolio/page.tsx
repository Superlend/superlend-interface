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

export default function Portfolio() {
    const { address: walletAddress, isConnecting, isDisconnected } = useAccount();
    const { open: openAuthModal, close: closeAuthModal } = useAppKit();

    function handleConnectWallet() {
        openAuthModal();
    }

    if (isConnecting) null

    if ((!walletAddress || isDisconnected) && !isConnecting) {
        return (
            <InfoBannerWithCta
                image={'/images/connect-wallet-banner.webp'}
                title={'Connect Wallet'}
                description={'Connect your web3 wallet to be able to view your portfolio and take required actions'}
                ctaText={'Connect wallet'}
                ctaOnClick={handleConnectWallet}
            />
        )
    }

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
            <div className="flex flex-col gap-[72px]">
                <PortfolioOverview />
                <YourPositionsAtRisk />
                {/* <AllPositions /> */}
            </div>
        </MainContainer>
    )
}
