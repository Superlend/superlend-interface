"use client"

import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'

const EthTokenIcon = '/images/tokens/eth.webp';
const USDCTokenIcon = '/images/tokens/usdc.webp';

export default function PositionDetails() {
    const searchParams = useSearchParams();
    // const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || 0;
    const protocol_identifier = searchParams.get("protocol_identifier") || "";
    const { address: walletAddress, isConnecting, isDisconnected } = useAccount();

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData
    } = useGetPortfolioData({
        user_address: walletAddress,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    });

    return (
        <motion.section
            className="bg-white bg-opacity-40 pt-[32px] pb-[16px] px-[16px] rounded-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
            <div className="px-[16px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-[12px]">
                    <div className="flex items-center gap-[8px]">
                        <BodyText level='body2'>
                            Liquidation Risk
                        </BodyText>
                        <Badge variant="green">
                            low risk
                        </Badge>
                    </div>
                    <div className="flex items-center gap-[16px]">
                        <BodyText level='body2'>
                            Liquidation price
                        </BodyText>
                        <div className="flex items-center gap-[6px]">
                            <ImageWithDefault src={USDCTokenIcon} alt="USDC token" width={16} height={16} />
                            <BodyText level='body1' weight='medium'>48,428</BodyText>
                        </div>
                    </div>
                </div>
                <div className="progress-bar mb-[20px]">
                    <Progress value={20} />
                </div>
            </div>
            <div className="bg-white rounded-4 py-[32px] px-[22px] md:px-[44px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                        <BodyText level='body2'>Your Collateral</BodyText>
                        <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                            <div className="flex items-center gap-[6px]">
                                <ImageWithDefault src={EthTokenIcon} alt="Eth token" width={24} height={24} />
                                <HeadingText level='h3'>$08.97</HeadingText>
                            </div>
                            <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                withdraw
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                        <BodyText level='body2'>Your Borrowing</BodyText>
                        <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                            <div className="flex items-center gap-[6px]">
                                <ImageWithDefault src={USDCTokenIcon} alt="Eth token" width={24} height={24} />
                                <HeadingText level='h3'>$32,781</HeadingText>
                            </div>
                            <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                repay
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    )
}
