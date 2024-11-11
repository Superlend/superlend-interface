"use client"

import React from 'react'
import {
    Card,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import MainContainer from '@/components/MainContainer'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type TProps = {
    image: string
    title: string
    description: string
    ctaText?: string
    ctaHref?: string
    ctaOnClick?: () => void;
    ctaButton?: React.ReactNode;
}

export default function InfoBannerWithCta({
    image,
    title,
    description,
    ctaText,
    ctaHref,
    ctaOnClick,
    ctaButton,
}: TProps) {
    const router = useRouter();

    function handleCtaClick() {
        if (!!ctaHref) {
            router.push(ctaHref)
            return
        }

        if (ctaOnClick) ctaOnClick();

        return;
    }

    return (
        <MainContainer>
            <Card className='p-0 max-w-[731px] mx-auto'>
                <CardHeader className='p-0 h-fit'>
                    <img src={image} alt="404 not found" width={731} height={345} className='object-cover' />
                </CardHeader>
                <CardFooter className='p-0 pt-[5px] pb-[32px] px-5 md:px-20 lg:px-[42px]'>
                    <div className="w-full flex items-center justify-between flex-wrap gap-[24px]">
                        <div className="max-w-[360px] w-full flex flex-col gap-[8px]">
                            <HeadingText level='h2' weight='semibold'>{title}</HeadingText>
                            <BodyText level='body2'>
                                {description}
                            </BodyText>
                        </div>
                        {!ctaButton &&
                            <Button onClick={handleCtaClick} variant={'primary'} size={'lg'} className='capitalize w-full min-[426px]:w-fit rounded-4'>
                                {ctaText}
                            </Button>
                        }
                        {ctaButton && (
                            <div className='w-full min-[426px]:w-fit'>
                                {ctaButton}
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </MainContainer>
    )
}