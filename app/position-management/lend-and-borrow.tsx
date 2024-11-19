"use client"

import ImageWithDefault from "@/components/ImageWithDefault";
import LendBorrowToggle from "@/components/LendBorrowToggle";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { AssetsDataContext } from "@/context/data-provider";
import useGetPlatformData from "@/hooks/useGetPlatformData";
import { usePositionManagementContext } from "@/context/position-management-provider";
import useGetPortfolioData from "@/hooks/useGetPortfolioData";
import { TPositionType, TToken } from "@/types";
import { ArrowRightIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import { useIsAutoConnecting, useActiveAccount } from "thirdweb/react";
import { abbreviateNumber, capitalizeText, convertScientificToNormal, isLowestValue } from "@/lib/utils";
import { getRiskFactor } from "@/lib/utils";
import { BodyText } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function LendAndBorrowAssets() {
    const [positionType, setPositionType] = useState<TPositionType>('lend');
    const [selectedTokenDetails, setSelectedTokenDetails] = useState<any>(null);
    const { allTokensData, allChainsData } = useContext(AssetsDataContext);
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || 0;
    const protocol_identifier = searchParams.get("protocol_identifier") || "";
    const activeAccount = useActiveAccount();
    const walletAddress = activeAccount?.address;
    const isAutoConnecting = useIsAutoConnecting();

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        protocol_identifier: [protocol_identifier],
        chain_id: [String(chain_id)],
    });


    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    });

    const isLoading = isLoadingPortfolioData || isLoadingPlatformData;

    const getTokenDetails = (tokenAddress: string) => {
        return allTokensData[chain_id]?.find((token: TToken) => token?.address === tokenAddress);
    }

    const tokenDetails = getTokenDetails(tokenAddress);
    const hasPositionsOnPlatform = portfolioData?.platforms.length > 0;

    // Filter user positions
    const [selectedPlatformDetails] = portfolioData?.platforms.filter(platform =>
        platform?.protocol_identifier.toLowerCase() === (platformData?.platform as any)?.protocol_identifier.toLowerCase()
    );
    // Filter lend and borrow positions
    const lendPositions = selectedPlatformDetails?.positions?.filter((position) => position.type === "lend");
    const borrowPositions = selectedPlatformDetails?.positions?.filter((position) => position.type === "borrow");
    // Check if there are multiple tokens
    const hasMultipleTokens = positionType === "lend" ? lendPositions?.length > 1 : borrowPositions?.length > 1;

    useEffect(() => {
        if (hasPositionsOnPlatform && lendPositions?.length > 0) {
            setSelectedTokenDetails(lendPositions[0]);
        } else {
            setSelectedTokenDetails({
                token: { ...tokenDetails },
            });
        }
    }, [hasPositionsOnPlatform]);

    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <LendBorrowToggle
                type={positionType}
                handleToggle={(positionType: TPositionType) => setPositionType(positionType)}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText level="body2" weight="normal" className="capitalize text-gray-600">
                        {positionType === "lend" ? "lend collateral" : `borrow ${selectedTokenDetails?.token?.symbol}`}
                    </BodyText>
                    {
                        positionType === "lend" && (
                            <BodyText level="body2" weight="normal" className="capitalize text-gray-600 flex items-center gap-[4px]">
                                Bal. {abbreviateNumber(selectedTokenDetails?.amount ?? 0)} <span className="inline-block truncate max-w-[70px]">{selectedTokenDetails?.token?.symbol}</span>
                            </BodyText>
                        )
                    }
                    {
                        positionType === "borrow" && (
                            <BodyText level="body2" weight="normal" className="capitalize text-gray-600 flex items-center gap-[4px]">
                                limit - {abbreviateNumber(selectedTokenDetails?.amount ?? 0)}
                            </BodyText>
                        )
                    }
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div className="rounded-5 border border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)] py-[12px] px-[16px] flex items-center gap-[12px]">
                        {isLoading && <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />}
                        {
                            !isLoading && !hasMultipleTokens && (
                                <ImageWithDefault
                                    src={selectedTokenDetails?.token?.logo || ""}
                                    alt={selectedTokenDetails?.token?.symbol || ""}
                                    className="shrink-0 w-[24px] h-[24px] rounded-full"
                                    width={24}
                                    height={24}
                                />
                            )
                        }
                        {
                            !isLoading && hasMultipleTokens && (
                                <SelectTokensDropdown
                                    key={positionType}
                                    options={positionType === "lend" ? lendPositions : borrowPositions}
                                    selectedItemDetails={selectedTokenDetails}
                                    setSelectedItemDetails={(token) => setSelectedTokenDetails(token)}
                                />
                            )
                        }
                        <BodyText level="body2" weight="normal" className="capitalize text-gray-500">|</BodyText>
                        <Input
                            type="number"
                            placeholder="0.00"
                            className="w-full focus:outline-none text-[24px] font-medium placeholder:text-gray-500 pl-0"
                        />
                        <Button variant="link" className="uppercase text-[14px] font-medium">
                            max
                        </Button>
                    </div>
                    <BodyText level="body2" weight="normal" className="mx-auto w-full text-gray-500 py-[16px] text-center max-w-[250px]">
                        {
                            positionType === "lend" ?
                                "Enter amount to proceed lending collateral for this position" :
                                "Enter the amount you want to borrow from this position"
                        }
                    </BodyText>
                </CardContent>
                <CardFooter className="p-0">
                    <Button disabled variant="primary" className="group flex items-center gap-[4px] py-[13px] w-full rounded-5">
                        <span className="uppercase leading-[0]">
                            {
                                positionType === "lend" ? "Lend collateral" : "Review & Borrow"
                            }
                        </span>
                        <ArrowRightIcon width={16} height={16} className='stroke-white group-[:disabled]:opacity-50' />
                    </Button>
                </CardFooter>
            </Card>
        </section>
    )
}

// Child components
function SelectTokensDropdown({
    options,
    selectedItemDetails,
    setSelectedItemDetails,
}: {
    options: any[];
    selectedItemDetails: any;
    setSelectedItemDetails: (token: any) => void;
}) {

    useEffect(() => {
        setSelectedItemDetails(options[0]);
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="md" variant="ghost" className="group flex items-center gap-1 text-gray-800">
                    <ImageWithDefault src={selectedItemDetails?.token.logo} alt={selectedItemDetails?.token.symbol} width={24} height={24} className='rounded-full max-w-[24px] max-h-[24px]' />
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                {
                    options?.map((asset: any) => (
                        <DropdownMenuItem
                            key={asset?.token?.address}
                            onClick={() => setSelectedItemDetails(asset)}
                            className={
                                cn("flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4",
                                    selectedItemDetails?.token?.address === asset?.token?.address && "bg-gray-400")
                            }
                        >
                            <ImageWithDefault src={asset?.token?.logo || ""} alt={asset?.token?.symbol || ""} width={24} height={24} className='rounded-full max-w-[24px] max-h-[24px]' />
                            <BodyText level='body2' weight='medium' className="text-gray-800">{asset?.token?.symbol || ""}</BodyText>
                        </DropdownMenuItem>
                    ))
                }
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

