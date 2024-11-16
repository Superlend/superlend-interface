import { getEstimatedEarnings } from "./helper-functions";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { TPlatform } from '@/types'
import { BodyText, HeadingText } from "@/components/ui/typography";
import { abbreviateNumber, cn, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import ImageWithDefault from "@/components/ImageWithDefault";
import { motion } from "framer-motion";
import TooltipText from "@/components/tooltips/TooltipText";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";


type TRow = {
    id: number;
    key: "lend" | "borrow" | "duration";
    title: string;
    logo?: string;
    selectedLabel: string;
    selectedValue: number;
    hasSelectedValue: boolean;
    totalValue: number;
    step: number;
}

const STABLE_TOKEN_SYMBOLS = ["wBTC", "wETH", "USDC", "USDT"];

export function EstimatedReturns({
    platformDetails
}: {
    platformDetails: TPlatform;
}) {
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    const positionType = searchParams.get("position_type") || "lend";
    const [selectedValue, setSelectedValue] = useState({
        lend: 0,
        borrow: 0,
        duration: 1,
    });
    const [selectedStableTokenDetails, setSelectedStableTokenDetails] = useState<any>(null);
    const isAaveV3 = platformDetails?.platform.platform_type === "aaveV3";
    // Declare asset details for lend and borrow assets
    let lendAssetDetails: any, borrowAssetDetails: any, stableLendAssetsList: any[] = [], stableBorrowAssetsList: any[] = [];

    /*
    1. If platform_type is aaveV3, then get the lend/borrow asset details from the token address
    2. If platform_type is other than aaveV3, then get the lend asset details from the platform data
    */
    if (isAaveV3) {
        if (positionType === "lend") {
            lendAssetDetails = platformDetails?.assets.find(asset => asset.token.address === tokenAddress);
            borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0];

            stableBorrowAssetsList = platformDetails?.assets.filter(asset => asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol));
        } else {
            stableLendAssetsList = platformDetails?.assets.filter(asset => !asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol));

            lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0];
            borrowAssetDetails = platformDetails?.assets.find(asset => asset.token.address === tokenAddress);
        }
    } else {
        lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled)[0];
        borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled)[0];
    }

    const supplyAPY = isAaveV3 && positionType === "borrow" ? (selectedStableTokenDetails?.supply_apy) || 0 : (lendAssetDetails?.supply_apy) || 0;
    const borrowAPY = isAaveV3 && positionType === "lend" ? (selectedStableTokenDetails?.variable_borrow_apy) || 0 : (borrowAssetDetails?.variable_borrow_apy) || 0;
    const amountSuppliedInUsd = selectedValue?.lend || 0;
    const amountBorrowedInUsd = selectedValue?.borrow || 0;
    const duration = selectedValue?.duration || 0;

    const handleSelectedValueChange = (value: number, type: "lend" | "borrow" | "duration") => {
        setSelectedValue(prev => ({ ...prev, [type]: value }));
    }

    const rows: TRow[] = [
        {
            id: 1,
            key: "lend",
            title: "lend collateral",
            logo: lendAssetDetails?.token.logo,
            selectedLabel: lendAssetDetails?.token.symbol || "",
            selectedValue: selectedValue.lend,
            hasSelectedValue: !(stableLendAssetsList.length > 0),
            totalValue: 10000,
            step: 50,
        },
        {
            id: 2,
            key: "borrow",
            title: "borrowing",
            logo: borrowAssetDetails?.token.logo,
            selectedLabel: borrowAssetDetails?.token.symbol || "",
            selectedValue: selectedValue.borrow,
            hasSelectedValue: !(stableBorrowAssetsList.length > 0),
            totalValue: 10000,
            step: 50,
        },
        {
            id: 3,
            key: "duration",
            title: "Duration",
            selectedLabel: selectedValue.duration > 1 ? "Months" : "Month",
            selectedValue: selectedValue.duration,
            hasSelectedValue: true,
            totalValue: 24,
            step: 1,
        }
    ];

    const estimatedEarnings = getEstimatedEarnings({
        supplyAPY,
        borrowAPY,
        amountSuppliedInUsd,
        amountBorrowedInUsd,
        duration,
    });

    function getDisplayedValuePrefix(key: "lend" | "borrow" | "duration") {
        return key === "lend" || key === "borrow" ? "$" : "";
    }

    function getDisplayedValueSufix(key: "lend" | "borrow" | "duration") {
        return key === "duration" ? " Years" : "";
    }

    function isAssetNotAvailable(rowItem: TRow) {
        return !rowItem.logo && rowItem.key !== "duration";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
            <Card>
                <CardHeader className='pb-[12px]'>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-[12px]">
                        <div className="flex items-center gap-[8px]">
                            <BodyText level='body2' weight='normal' className="text-gray-600">
                                Estimate returns by using slider below
                            </BodyText>
                            <InfoTooltip
                                className="max-w-full"
                                content={
                                    <div className="flex flex-col gap-[12px]">
                                        {/* <HeadingText level='h5' weight='medium' className="text-gray-800 border-b-[2px] border-gray-200 pb-[12px]">
                                            Estimation Breakdown
                                        </HeadingText>
                                        <BodyText level='body2' weight='normal' className="text-gray-600">
                                            Interest Gain = (Supplied Amount X Supply APY X Duration) / 1200
                                        </BodyText>
                                        <BodyText level='body2' weight='normal' className="text-gray-600">
                                            Interest Loss = (Borrowed Amount X Borrow APY X Duration) / 1200
                                        </BodyText> */}
                                        <BodyText level='body2' weight='medium' className="text-gray-600">
                                            Estimated returns = Interest Gain - Interest Loss
                                        </BodyText>
                                    </div>
                                }
                            />
                        </div>
                        <div className="flex items-center gap-[8px]">
                            {/* Title */}
                            <BodyText level='body2' weight='normal' className="text-gray-600">
                                Estimated earnings
                            </BodyText>
                            {/* Info tooltip for earnings */}
                            <InfoTooltip
                                label={
                                    <HeadingText level='h4' weight='medium' className="text-gray-800">
                                        <TooltipText>
                                            {containsNegativeInteger(estimatedEarnings) ? "-" : ""}${abbreviateNumber(Number(convertNegativeToPositive(estimatedEarnings)))}
                                        </TooltipText>
                                    </HeadingText>
                                }
                                content="This is an approximate estimate of returns and not the actual returns as change in supply will affect the overall earnings with time"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className='bg-white rounded-5 px-[32px] py-[28px]'>
                    <div className="flex flex-col gap-[36px]">
                        {
                            rows.map(row => (
                                <div key={row.id} className="flex flex-col gap-[16px]">
                                    <div className="flex items-end md:items-center justify-between">
                                        {/* Title */}
                                        <div className="flex flex-col md:flex-row md:items-center gap-[8px]">
                                            <BodyText level='body2' weight='normal' className="capitalize text-gray-600">
                                                {row.title} -
                                            </BodyText>
                                            {/* Selected value */}
                                            <div className="flex items-center gap-[6px]">
                                                {
                                                    !isAssetNotAvailable(row) &&
                                                    <>
                                                        <HeadingText level='h4' weight='medium' className="text-gray-800">
                                                            {getDisplayedValuePrefix(row.key)}{abbreviateNumber(row.selectedValue, row.key === "duration" ? 0 : 1)}
                                                        </HeadingText>
                                                        {
                                                            row.hasSelectedValue &&
                                                            <div className="flex items-center gap-[6px]">
                                                                {row.logo && <ImageWithDefault src={row.logo} alt={row.selectedLabel} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />}
                                                                <HeadingText level='h5' weight='medium' className="text-gray-800">
                                                                    {row.selectedLabel}
                                                                </HeadingText>
                                                            </div>
                                                        }
                                                        {
                                                            !row.hasSelectedValue &&
                                                            <StableTokensDropdown
                                                                options={row.key === "lend" ? stableLendAssetsList : stableBorrowAssetsList}
                                                                selectedStableTokenDetails={selectedStableTokenDetails}
                                                                setSelectedStableTokenDetails={setSelectedStableTokenDetails}
                                                            />
                                                        }
                                                    </>
                                                }
                                                {
                                                    isAssetNotAvailable(row) &&
                                                    <BodyText level='body1' weight='normal' className="text-gray-600">
                                                        N/A
                                                    </BodyText>
                                                }
                                            </div>
                                        </div>
                                        {/* Total value */}
                                        {
                                            !isAssetNotAvailable(row) &&
                                            <BodyText level='body1' weight='normal' className="text-gray-600">
                                                {getDisplayedValuePrefix(row.key)}{abbreviateNumber(row.key === "duration" ? row.totalValue / 12 : row.totalValue, 0)}{getDisplayedValueSufix(row.key)}
                                            </BodyText>
                                        }
                                        {
                                            isAssetNotAvailable(row) &&
                                            <BodyText level='body1' weight='normal' className="text-gray-600">
                                                N/A
                                            </BodyText>
                                        }
                                    </div>
                                    <Slider
                                        disabled={isAssetNotAvailable(row)}
                                        defaultValue={[row.selectedValue]}
                                        max={row.totalValue}
                                        step={row.step}
                                        onValueChange={(value) => handleSelectedValueChange(value[0], row.key)}
                                        className={cn("group", isAssetNotAvailable(row) && "disabled")}
                                    />
                                </div>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Child component
function StableTokensDropdown({
    options,
    selectedStableTokenDetails,
    setSelectedStableTokenDetails,
}: {
    options: any[];
    selectedStableTokenDetails: any;
    setSelectedStableTokenDetails: (token: any) => void;
}) {
    useEffect(() => {
        setSelectedStableTokenDetails(options[0]);
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="md" variant="outline" className="group flex items-center gap-1 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800 rounded-2 focus-visible:ring-0">
                    <ImageWithDefault src={selectedStableTokenDetails?.token.logo} alt={selectedStableTokenDetails?.token.symbol} width={18} height={18} className='rounded-full max-w-[18px] max-h-[18px]' />
                    <BodyText level='body2' weight='medium' className="text-gray-800">{selectedStableTokenDetails?.token.symbol}</BodyText>
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <DropdownMenuLabel className="text-gray-600 py-2 px-4">Select Stable Token</DropdownMenuLabel>
                {
                    options?.map((asset: any) => (
                        <DropdownMenuItem
                            key={asset?.token?.address}
                            onClick={() => setSelectedStableTokenDetails(asset)}
                            className="flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4"
                        >
                            <ImageWithDefault src={asset?.token?.logo || ""} alt={asset?.token?.symbol || ""} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />
                            <BodyText level='body2' weight='medium' className="text-gray-800">{asset?.token?.symbol || ""}</BodyText>
                        </DropdownMenuItem>
                    ))
                }
            </DropdownMenuContent>
        </DropdownMenu>
    )
}