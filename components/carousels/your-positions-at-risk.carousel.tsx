"use client"
import React from 'react'
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import { POSITIONS_AT_RISK_DATA } from '@/data/portfolio-page'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BodyText, Label } from '@/components/ui/typography'
import ArrowRightIcon from '@/components/icons/arrow-right-icon'
import Image from "next/image"
import ImageWithBadge from '../ImageWithBadge'
import { useRouter } from 'next/navigation'

export default function YourPositionsAtRiskCarousel() {
    const router = useRouter();
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)

    React.useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        <Carousel setApi={setApi} className='md:[mask-image:linear-gradient(to_left,transparent,white_5%)]'>
            <CarouselContent className='pl-5 cursor-grabbing'>
                {
                    [
                        ...POSITIONS_AT_RISK_DATA,
                        ...POSITIONS_AT_RISK_DATA,
                        ...POSITIONS_AT_RISK_DATA,
                        ...POSITIONS_AT_RISK_DATA,
                        ...POSITIONS_AT_RISK_DATA,
                        ...POSITIONS_AT_RISK_DATA,
                    ]
                        .map((positions, index) => (
                            <CarouselItem key={index} className='basis-[90%] min-[450px]:basis-[380px] md:basis-[380px]'>
                                <Card className='w-full max-w-[380px] select-none'>
                                    <CardContent className='bg-white rounded-b-6 py-[22px] px-[26px] divide-y divide-gray-400'>
                                        <div className="flex items-center justify-between pb-[17px]">
                                            <div className="lend-amount-block flex flex-col gap-[4px]">
                                                <Label className='capitalize text-gray-600'>Lend amount</Label>
                                                <div className="flex items-center gap-[4px]">
                                                    <Image width={16} height={16} alt="" src={positions.lendAmount.tokenImage} />
                                                    <BodyText level={'body2'} weight='medium'>$ {positions.lendAmount.amount}</BodyText>
                                                </div>
                                            </div>
                                            <div className="borrow-amount-block flex flex-col gap-[4px]">
                                                <Label className='capitalize text-gray-600'>Borrow amount</Label>
                                                <div className="flex items-center justify-end gap-[4px]">
                                                    <BodyText level={'body2'} weight='medium'>$ {positions.borrowAmount.amount}</BodyText>
                                                    <Image width={16} height={16} alt="" src={positions.borrowAmount.tokenImage} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-[17px]">
                                            <div className="position-on-block flex items-center gap-[8px]">
                                                <ImageWithBadge
                                                    mainImg={positions.positionOn.platformImage}
                                                    badgeImg={positions.positionOn.chainImage}
                                                />
                                                <div className="flex flex-col">
                                                    <Label className='capitalize text-gray-600'>Position on</Label>
                                                    <BodyText level={'body2'} weight='medium' className='capitalize text-wrap break-words max-w-[10ch]'>{positions.positionOn.platform}</BodyText>
                                                </div>
                                            </div>
                                            <div className="risk-factor-block flex flex-col items-end gap-[4px]">
                                                <Label className='capitalize text-gray-600'>Risk factor</Label>
                                                <Badge variant="destructive">{positions.riskFactor}</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className='py-[16px] flex flex-col md:flex-row item-center justify-between gap-[5px] md:gap-[14px]'>
                                        <BodyText level='body2' weight='medium' className='text-gray-600'>Recommended action</BodyText>
                                        <span className="hidden md:block text-gray-500">|</span>
                                        <Button variant="link" className='group uppercase flex items-center gap-[4px]' onClick={() => router.push("position-management")}>
                                            Add collateral
                                            <ArrowRightIcon width={16} height={16} weight='2' className='stroke-secondary-500 group-hover:opacity-75 group-active:opacity-75' />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </CarouselItem>
                        ))
                }
            </CarouselContent>
        </Carousel>
    )
}
