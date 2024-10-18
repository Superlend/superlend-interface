"use client";
import React, { useContext } from "react";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { POSITIONS_AT_RISK_DATA } from "@/data/portfolio-page";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BodyText, HeadingText, Label } from "@/components/ui/typography";
import ArrowRightIcon from "@/components/icons/arrow-right-icon";
import Image from "next/image";
import ImageWithBadge from "@/components/ImageWithBadge";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import useGetPortfolioData from "@/hooks/useGetPortfolioData";
import { abbreviateNumber, capitalizeText } from "@/lib/utils";
import { AssetsDataContext } from "@/context/data-provider";
import AvatarCircles from "@/components/ui/avatar-circles";
import { Skeleton } from "@/components/ui/skeleton";

const scrollToPosInit = {
    next: false,
    prev: false,
};

const BLUR_ON_LEFT_END_STYLES = "md:[mask-image:linear-gradient(to_right,transparent,white_5%)]"
const BLUR_ON_RIGHT_END_STYLES = "md:[mask-image:linear-gradient(to_left,transparent,white_5%)]"

export default function TopLowRiskPositions() {
    const router = useRouter();
    const { allChainsData } = useContext(AssetsDataContext);
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [scrollToPos, setScrollToPos] = React.useState(scrollToPosInit);
    const address = "0xBbde906d77465aBc098E8c9453Eb80f3a5F794e9";
    const {
        data,
        isLoading,
        isError
    } = useGetPortfolioData({
        user_address: address,
    });

    function getRiskFactor(healthFactor: string | number) {
        const HF = Number(healthFactor);
        if (HF < 1) return {
            label: "high",
            theme: "destructive"
        }
        if (HF < 1.5) return {
            label: "medium",
            theme: "yellow"
        }
        return {
            label: "low",
            theme: "green"
        }
    }

    const PLATFORMS_WITH_POSITIONS = data?.platforms.filter(platform => platform.positions.length > 0)

    const POSITIONS_AT_RISK = PLATFORMS_WITH_POSITIONS?.map((platform, index: number) => {
        const lendPositions = platform.positions.filter(position => position.type === "lend");
        const borrowPositions = platform.positions.filter(position => position.type === "borrow");
        const chainDetails = allChainsData.find(chain => chain.chain_id === platform.chain_id);

        return {
            lendAsset: {
                tokenImages: lendPositions.map(position => position.token.logo),
                tokenDetails: lendPositions.map(position => ({
                    logo: position.token.logo,
                    symbol: position.token.symbol,
                    amount: abbreviateNumber(position.amount),
                })),
                amount: abbreviateNumber(platform.total_liquidity, 0),
            },
            borrowAsset: {
                tokenImages: borrowPositions.map(position => position.token.logo),
                tokenDetails: borrowPositions.map(position => ({
                    logo: position.token.logo,
                    symbol: position.token.symbol,
                    amount: abbreviateNumber(position.amount),
                })),
                amount: abbreviateNumber(platform.total_borrow, 0),
            },
            positionOn: {
                platformName: capitalizeText(platform?.platform_name),
                platformImage: platform?.logo ?? "",
                chainImage: chainDetails?.logo ?? "",
            },
            netApy: abbreviateNumber(platform.net_apy),
        }
    })

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    function handleNext() {
        if (!api) {
            return;
        }

        api.scrollNext();

        setScrollToPos((state) => ({ ...state, next: false }));
    }

    function handlePrev() {
        if (!api) {
            return;
        }

        api.scrollPrev();

        setScrollToPos((state) => ({ ...state, prev: false }));
    }

    return (
        <section id="top-low-risk-positions">
            <div className="section-header flex items-center justify-between mb-[24px] px-5">
                <div className="flex items-center gap-[12px]">
                    <HeadingText level="h3" weight='semibold'>Top low risk positions</HeadingText>
                    <InfoTooltip />
                </div>
                {POSITIONS_AT_RISK.length > 1 &&
                    <div className="slide-carousel-btns flex items-center gap-[16px]">
                        <Button
                            variant={"ghost"}
                            className="p-0 hover:bg-white/50 active:bg-white/25"
                            onClick={handlePrev}
                            disabled={current <= 1}
                        >
                            <ArrowLeft className="text-gray-600" />
                        </Button>
                        <Button
                            variant={"ghost"}
                            className="p-0 hover:bg-white/50 active:bg-white/25"
                            onClick={handleNext}
                            disabled={current === count}
                        >
                            <ArrowRight className="text-gray-600" />
                        </Button>
                    </div>
                }
            </div>
            {!isLoading &&
                <Carousel
                    setApi={setApi}
                // className={
                //     current === count
                //         ? BLUR_ON_LEFT_END_STYLES
                //         : BLUR_ON_RIGHT_END_STYLES
                // }
                >
                    <CarouselContent className="pl-5 cursor-grabbing">
                        {POSITIONS_AT_RISK.map((positions, index) => (
                            <CarouselItem
                                key={index}
                                className="basis-[90%] min-[450px]:basis-[380px] md:basis-[380px]"
                            >
                                <Card className="w-full max-w-[380px] select-none">
                                    <CardContent className="bg-white rounded-b-6 py-[22px] px-[26px] divide-y divide-gray-400">
                                        <div className="flex items-center justify-between pb-[17px]">
                                            <div className="lend-amount-block flex flex-col gap-[4px]">
                                                <Label className="capitalize text-gray-600">
                                                    Lend amount
                                                </Label>
                                                <div className="flex items-center gap-[4px]">
                                                    <AvatarCircles
                                                        avatarUrls={positions.lendAsset.tokenImages}
                                                        avatarDetails={positions.lendAsset.tokenDetails}
                                                    />
                                                    <BodyText level={"body2"} weight="medium">
                                                        ${positions.lendAsset.amount}
                                                    </BodyText>
                                                </div>
                                            </div>
                                            <div className="borrow-amount-block flex flex-col gap-[4px]">
                                                <Label className="capitalize text-gray-600">
                                                    Borrow amount
                                                </Label>
                                                <div className="flex items-center justify-end gap-[4px]">
                                                    <BodyText level={"body2"} weight="medium">
                                                        ${positions.borrowAsset.amount}
                                                    </BodyText>
                                                    <AvatarCircles
                                                        avatarUrls={positions.borrowAsset.tokenImages}
                                                        avatarDetails={positions.borrowAsset.tokenDetails}
                                                    />
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
                                                    <Label className="capitalize text-gray-600">
                                                        Position on
                                                    </Label>
                                                    <BodyText
                                                        level={"body2"}
                                                        weight="medium"
                                                        className="capitalize text-wrap break-words max-w-[10ch]"
                                                    >
                                                        {positions.positionOn.platformName}
                                                    </BodyText>
                                                </div>
                                            </div>
                                            <div className="risk-factor-block flex flex-col items-end gap-[4px]">
                                                <Label className="capitalize text-gray-600">
                                                    Net APY
                                                </Label>
                                                <BodyText level={"body2"} weight="medium">
                                                    {positions.netApy}%
                                                </BodyText>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="py-[16px] flex item-center justify-center gap-[5px] md:gap-[14px]">
                                        <Button
                                            variant="link"
                                            className="group uppercase flex items-center gap-[4px] w-fit"
                                        // onClick={() => router.push("position-management")}
                                        >
                                            View position
                                            <ArrowRightIcon
                                                width={16}
                                                height={16}
                                                weight="2"
                                                className="stroke-secondary-500 group-hover:opacity-75 group-active:opacity-75"
                                            />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>}
            {
                isLoading &&
                <div className="overflow-hidden rounded-6 pl-5">
                    <Skeleton className="h-[225px] w-[364px]" />
                </div>
            }
        </section>
    );
}

