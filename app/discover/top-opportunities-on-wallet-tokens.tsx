import React from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from '@/components/ui/badge'
import LineGraphBg from '@/components/backgrounds/line-graph'

export default function TopOpportunitiesOnWalletTokens() {
    return (
        <section id='top-oppotunities-on-your-wallet-tokens' className="top-oppotunities-on-your-wallet-tokens flex flex-col gap-[24px]">
            <div className="section-header flex items-center gap-[12px] px-5">
                <HeadingText level="h3" className='max-[375px]:max-w-[20ch]'>Top Opportunities on your wallet tokens</HeadingText>
                <InfoTooltip />
            </div>
            <div className="section-content">
                <Carousel>
                    <CarouselContent className='pl-3 sm:pl-5 min-[375px]:mr-5 select-none cursor-grabbing'>
                        {
                            Array.from({ length: 3 }).map((item, index) => (
                                <CarouselItem key={index} className='basis-[330px] min-[375px]:basis-[380px]'>
                                    <Card className='w-full max-w-[330px] min-[375px]:max-w-[380px]'>
                                        <CardContent className='relative bg-white overflow-hidden pt-[40px] pb-[21px] pl-[28px] pr-[40px] rounded-b-5'>
                                            <LineGraphBg className='object-cover absolute inset-0 size-full' />
                                            <HeadingText level={'h2'} weight='semibold' className='text-success-text mb-[48px]'>16.48% APY</HeadingText>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-[4px]">
                                                    <BodyText level='body1' weight='medium' className='text-gray-500'>on</BodyText>
                                                    <img src="/images/tokens/usdc.webp" alt="USDC" width={20} height={20} />
                                                    <BodyText level='body1' weight='medium' className='text-gray-800'>USDC</BodyText>
                                                </div>
                                                <div className="flex items-center gap-[8px]">
                                                    <img src="/images/platforms/compound.webp" alt="USDC" width={20} height={20} />
                                                    <BodyText level='body1' weight='medium' className='text-gray-800 capitalize'>compound</BodyText>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className='py-[16px] flex items-center justify-between px-[28px]'>
                                            <BodyText level='body2' weight='medium' className='text-gray-700 capitalize'>Wallet bal: 1,487</BodyText>
                                            <span className="text-gray-500">|</span>
                                            <Badge variant={'blue'}>Ethereum network</Badge>
                                        </CardFooter>
                                    </Card>
                                </CarouselItem>
                            ))
                        }
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    )
}