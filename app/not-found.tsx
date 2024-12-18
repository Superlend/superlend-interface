import React from 'react'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import MainContainer from '@/components/MainContainer'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
    return (
        <MainContainer>
            <Card className="p-0 max-w-[731px] mx-auto">
                <CardHeader className="p-0 h-fit">
                    <img
                        src="/images/404-not-found.webp"
                        alt="404 not found"
                        width={731}
                        height={345}
                        className="object-cover"
                    />
                </CardHeader>
                <CardFooter className="p-0 pt-[5px] pb-[32px] px-5 md:px-20 lg:px-[42px]">
                    <div className="w-full flex items-center justify-between flex-wrap gap-[24px]">
                        <div className="max-w-[360px] w-full flex flex-col gap-[8px]">
                            <HeadingText level="h2" weight="semibold">
                                This content does not exist
                            </HeadingText>
                            <BodyText level="body2">
                                Uh oh, we can&apos;t seem to find the page
                                you&apos;re looking for. Try going back to the
                                previous page or go to home page to explore
                                other options.
                            </BodyText>
                        </div>
                        <Button
                            variant={'primary'}
                            size={'sm'}
                            className="uppercase w-full min-[426px]:w-fit p-0"
                        >
                            <Link
                                href={'/'}
                                className="w-full h-full py-[13px] px-[21px]"
                            >
                                Go to home
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </MainContainer>
    )
}
