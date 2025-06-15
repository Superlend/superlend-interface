'use client'

import MainContainer from '@/components/MainContainer'
import React from 'react'
import PageHeader from './page-header'
import AssetHistory from './asset-history'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { BodyText } from '@/components/ui/typography'
import PositionDetails from './position-details'
import PositionManagementProvider from '@/context/position-management-provider'
import TxProvider from '@/context/tx-provider'
import { AssetTxWidget } from './tx-widgets'
import PortfolioProvider from '@/context/portfolio-provider'
import { AppleFarmRewardsProvider } from '@/context/apple-farm-rewards-provider'
import { useSearchParams } from 'next/navigation'
import FlatTabs from '@/components/tabs/flat-tabs'

export default function PositionManagementPage() {
    const searchParams = useSearchParams()
    const positionTypeParam = searchParams?.get('position_type') || ''
    const isLoopPosition = positionTypeParam === 'loop'

    return (
        <PositionManagementProvider>
            <TxProvider>
                <MainContainer className="flex flex-col gap-[40px]">
                    <AppleFarmRewardsProvider>
                        <PageHeader />
                    </AppleFarmRewardsProvider>
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                        {!isLoopPosition &&
                            <div className="flex flex-col gap-[16px] order-last xl:order-first">
                                <PositionDetails />
                                <AssetHistory />
                            </div>
                        }
                        {isLoopPosition &&
                            <div className="flex flex-col gap-[16px] order-last xl:order-first">
                                
                            </div>
                        }
                        <div className="order-first xl:order-last">
                            <PortfolioProvider>
                                <AssetTxWidget />
                            </PortfolioProvider>
                        </div>
                        {/* <BlogCard /> */}
                    </div>
                </MainContainer>
            </TxProvider>
        </PositionManagementProvider>
    )
}

function BlogCard() {
    return (
        <div className="blog-card-wrapper">
            <Card className="group">
                <CardContent className="relative h-[262px] w-full p-0 overflow-hidden rounded-6 flex items-center justify-center">
                    <div className="absolute top-0 left-0 h-full w-full bg-primary bg-opacity-40 blur-md"></div>
                    <BodyText
                        level="body1"
                        weight="medium"
                        className="group-hover:scale-125 transition-all relative text-white font-bold text-[32px]"
                    >
                        Coming soon
                    </BodyText>
                </CardContent>
                <CardFooter className="py-[16px] blur-[2px]">
                    <div className="flex flex-col gap-[6px]">
                        <BodyText level="body1" weight="medium">
                            Introduction to Lending & Borrowing with Superlend
                        </BodyText>
                        <BodyText level="body2">
                            Understanding: What is Superlend, How does it work,
                            Key benefits of using Superlend and more.
                        </BodyText>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
