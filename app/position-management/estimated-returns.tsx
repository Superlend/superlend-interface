import { getEstimatedEarnings } from "./helper-functions";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { TPlatform } from '@/types'
import { BodyText, HeadingText } from "@/components/ui/typography";
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import ImageWithDefault from "@/components/ImageWithDefault";
import { motion } from "framer-motion";
import TooltipText from "@/components/tooltips/TooltipText";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { useSearchParams } from "next/navigation";

type TRow = {
    id: number;
    key: "lend" | "borrow" | "duration";
    title: string;
    logo?: string;
    selectedLabel: string;
    selectedValue: number;
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
    let lendAssetDetails, borrowAssetDetails;

    /*
    1. If platform_type is aaveV3, then get the lend asset details from the token address
    2. If platform_type is other than aaveV3, then get the lend asset details from the platform data
    */
    if (platformDetails?.platform.platform_type === "aaveV3") {
        if (positionType === "lend") {
            lendAssetDetails = platformDetails?.assets.find(asset => asset.token.address === tokenAddress);
            borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0];
        } else {
            lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0];
            borrowAssetDetails = platformDetails?.assets.find(asset => asset.token.address === tokenAddress);
        }
    } else {
        lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled)[0];
        borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled)[0];
    }

    const supplyAPY = (lendAssetDetails?.supply_apy) || 0;
    const borrowAPY = (borrowAssetDetails?.variable_borrow_apy) || 0;
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
            totalValue: 10000,
            step: 500,
        },
        {
            id: 2,
            key: "borrow",
            title: "borrowing",
            logo: borrowAssetDetails?.token.logo,
            selectedLabel: borrowAssetDetails?.token.symbol || "",
            selectedValue: selectedValue.borrow,
            totalValue: 10000,
            step: 500,
        },
        {
            id: 3,
            key: "duration",
            title: "Duration",
            selectedLabel: selectedValue.duration > 1 ? "Months" : "Month",
            selectedValue: selectedValue.duration,
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
                        <BodyText level='body2' weight='normal' className="text-gray-600">
                            Estimate returns by using slider below
                        </BodyText>
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
                                                        <div className="flex items-center gap-[6px]">
                                                            {row.logo && <ImageWithDefault src={row.logo} alt={row.selectedLabel} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />}
                                                            <HeadingText level='h4' weight='medium' className="text-gray-800">
                                                                {row.selectedLabel}
                                                            </HeadingText>
                                                        </div>
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
                                    <Slider disabled={isAssetNotAvailable(row)} defaultValue={[row.selectedValue]} max={row.totalValue} step={row.step} onValueChange={(value) => handleSelectedValueChange(value[0], row.key)} />
                                </div>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}