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
import TxProvider from '@/context/tx-provider'
import LendAndBorrowAssetsMorpho from './lend-and-borrow-morpho'

export default function PositionManagementPage() {
    return (
        <PositionManagementProvider>
            <TxProvider>
                <MainContainer className="flex flex-col gap-[40px]">
                    <PageHeader />
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                        <div className="flex flex-col gap-[16px]">
                            <PositionDetails />
                            <AssetHistory />
                        </div>
                        <LendAndBorrowAssets />
                        <LendAndBorrowAssetsMorpho />
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
