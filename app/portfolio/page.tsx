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
// import { useActiveAccount, useIsAutoConnecting } from 'thirdweb/react'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import PositionsProvider from '@/context/positions-provider'
import { useAccount } from 'wagmi'

export default function Portfolio() {
    // const activeAccount = useActiveAccount()
    // const walletAddress = activeAccount?.address
    const { address: walletAddress } = useAccount()
    // const isAutoConnecting = useIsAutoConnecting()

    const { isClient } = useIsClient()

    if (isClient) {
        return <PortfolioPageLoading />
    }

    if (!walletAddress && isClient) {
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

    if (walletAddress && isClient) {
        // const queryClient = new QueryClient()

        // await queryClient.prefetchQuery({
        //     queryKey: ['opportunities'],
        //     queryFn: () => useGetOpportunitiesData({ type: "lend" }),
        // })

        return (
            // <HydrationBoundary state={dehydrate(queryClient)}>
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
            // </HydrationBoundary>
        )
    }

    return <PortfolioPageLoading />
}

function PortfolioPageLoading() {
    return (
        <MainContainer>
            <div className="relative h-[500px] w-full rounded-6 overflow-hidden">
                <Skeleton className="z-[0] relative w-full h-full" />
                <LoaderCircle className="z-[1] absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin" />
            </div>
        </MainContainer>
    )
}
