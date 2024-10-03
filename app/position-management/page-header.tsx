"use client";

import ArrowLeftIcon from '@/components/icons/arrow-left-icon';
import { Button } from '@/components/ui/button';
import React, { useContext } from 'react';
import { BodyText, HeadingText, Label } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { abbreviateNumber, getTokenLogo } from '@/lib/utils';
import ImageWithDefault from '@/components/ImageWithDefault';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import useGetPlatformData from '@/hooks/useGetPlatformData';
import { TToken } from '@/types';
import { AssetsDataContext } from '@/context/data-provider';

export default function PageHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || "";
    const platform_id = searchParams.get("platform_id") || "";
    const { allTokensData } = useContext(AssetsDataContext);

    // const selectedTokenDetails: TToken | undefined = Object.values(allTokensData).flat(1).find((token: TToken) => token.address === tokenAddress);

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData
    } = useGetPlatformData({
        platform_id,
        chain_id: Number(chain_id),
    });

    const tokenDetails = {
        address: tokenAddress,
        // symbol: selectedTokenDetails?.symbol
        symbol: platformData.assets.filter((asset: any) => asset.token.address ===  tokenAddress)[0]?.token?.symbol || ""
    }

    const [pageHeaderStats] = platformData?.assets
        ?.filter((asset: any) => asset.token.address === tokenAddress)
        .map(item => ({
            supply_apy: abbreviateNumber(item.supply_apy),
            borrow_rate: abbreviateNumber(item.variable_borrow_apy)
        }))

    return (
        <section className="header flex flex-col sm:flex-row items-start lg:items-center gap-[24px]">
            <Button className='py-[8px] px-[12px] rounded-3' onClick={() => router.back()}>
                <ArrowLeftIcon width={16} height={16} className='stroke-gray-800' />
            </Button>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[24px] w-full">
                <div className="flex flex-wrap md:items-center gap-[16px]">
                    <div className="flex items-center gap-[12px]">
                        <div className="flex items-center gap-[8px]">
                            {
                                isLoadingPlatformData && (
                                    <>
                                        <Skeleton className='w-[28px] h-[28px] rounded-full' />
                                        <Skeleton className='w-[60px] h-[28px] rounded-4' />
                                    </>
                                )
                            }
                            {tokenDetails?.symbol && !isLoadingPlatformData &&
                                <>
                                    <ImageWithDefault
                                        src={getTokenLogo(tokenDetails?.symbol?.toLowerCase())}
                                        alt="Token logo"
                                        width={28}
                                        height={28}
                                    />
                                    <HeadingText level='h4' className='uppercase'>{tokenDetails.symbol}</HeadingText>
                                </>
                            }
                        </div>
                        {/* <BodyText level='body1' weight='medium' className='text-gray-500'>/</BodyText>
                        <div className="flex items-center gap-[8px]">
                            <img src={USDCTokenIcon} alt="Eth token" width={28} height={28} />
                            <HeadingText level='h4' className='uppercase'>USDC</HeadingText>
                        </div> */}
                    </div>
                    {/* <Badge size="md" className='border-0 flex items-center justify-between gap-[16px] pr-[4px] w-fit'>
                        <div className="flex items-center gap-1">
                            <img src={PolygonNetworkIcon} alt="Polygon network" width={16} height={16} className='object-contain' />
                            <Label weight='medium' className='leading-[0]'>Polygon Network</Label>
                        </div>
                        <Button className='flex items-center gap-[4px] hover:bg-secondary-100/15'>
                            <span className="uppercase text-secondary-500 font-medium">aave v3</span>
                            <ArrowRightIcon weight='3' className='stroke-secondary-500 -rotate-45' />
                        </Button>
                    </Badge> */}
                </div>
                <div className="header-right flex flex-col md:flex-row items-start md:items-center gap-[24px]">
                    {isLoadingPlatformData && <Skeleton className='w-[150px] sm:w-[300px] h-[35px]' />}
                    {!!pageHeaderStats?.supply_apy &&
                        <div className="flex items-center max-md:justify-between gap-[4px]">
                            <BodyText level='body1' className='text-gray-700 shrink-0'>
                                Suppply APY
                            </BodyText>
                            <Badge variant="green">
                                <BodyText level='body1' weight='medium'>
                                    {pageHeaderStats?.supply_apy}%
                                </BodyText>
                            </Badge>
                        </div>
                    }
                    {!!pageHeaderStats?.borrow_rate && <span className="hidden md:inline-block text-gray">|</span>}
                    {!!pageHeaderStats?.borrow_rate &&
                        <div className="flex items-center max-md:justify-between gap-[4px]">
                            <BodyText level='body1' className='text-gray-700 shrink-0'>
                                Borrow Rate
                            </BodyText>
                            <Badge variant="yellow">
                                <BodyText level='body1' weight='medium'>
                                    {pageHeaderStats?.borrow_rate}%
                                </BodyText>
                            </Badge>
                        </div>
                    }
                </div>
            </div>
        </section>
    )
}