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
import LendAndBorrowAssets from './lend-and-borrow'
import PositionManagementProvider from '@/context/position-management-provider'
import LendBorrowTxProvider from '@/context/lend-borrow-tx-provider'

export default function PositionManagementPage() {
    return (
        <PositionManagementProvider>
            <LendBorrowTxProvider>
                <MainContainer className="flex flex-col gap-[40px]">
                    <PageHeader />
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                        <div className="flex flex-col gap-[16px]">
                            <PositionDetails />
                            <AssetHistory />
                        </div>
                        <LendAndBorrowAssets />
                        {/* <BlogCard /> */}
                    </div>
                </MainContainer>
            </LendBorrowTxProvider>
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
