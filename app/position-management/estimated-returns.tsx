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
import { abbreviateNumber } from "@/lib/utils";
import ImageWithDefault from "@/components/ImageWithDefault";
import { motion } from "framer-motion";
import TooltipText from "@/components/tooltips/TooltipText";
import InfoTooltip from "@/components/tooltips/InfoTooltip";

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

export function EstimatedReturns({
    platformDetails
}: {
    platformDetails: TPlatform;
}) {
    const [selectedValue, setSelectedValue] = useState({
        lend: 0,
        borrow: 0,
        duration: 0,
    });

    const lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled)[0];
    const borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled)[0];

    // console.log("lendAssetDetails", platformDetails?.assets.filter(asset => !asset.borrow_enabled));
    // console.log("borrowAssetDetails", platformDetails?.assets.filter(asset => asset.borrow_enabled));

    const supplyAPY = (lendAssetDetails?.supply_apy / 100) || 0;
    const borrowAPY = (borrowAssetDetails?.variable_borrow_apy / 100) || 0;
    const amountSupplied = selectedValue.lend || 0;
    const amountBorrowed = selectedValue.borrow || 0;
    const supplyTokenPrice = supplyAPY * lendAssetDetails?.token?.price_usd || 0;
    const borrowTokenPrice = borrowAPY * borrowAssetDetails?.token?.price_usd || 0;
    const duration = selectedValue.duration || 0;

    // console.log("supplyAPY", supplyAPY);
    // console.log("borrowAPY", borrowAPY);
    // console.log("amountSupplied", amountSupplied);
    // console.log("amountBorrowed", amountBorrowed);
    // console.log("supplyTokenPrice", supplyTokenPrice);
    // console.log("borrowTokenPrice", borrowTokenPrice);
    // console.log("duration", duration);

    const handleSelectedValueChange = (value: number, type: "lend" | "borrow" | "duration") => {
        setSelectedValue(prev => ({ ...prev, [type]: value }));
    }

    const rows: TRow[] = [
        {
            id: 1,
            key: "lend",
            title: "lend collateral",
            logo: lendAssetDetails?.token.logo,
            selectedLabel: lendAssetDetails?.token.symbol,
            selectedValue: selectedValue.lend,
            totalValue: 1000000,
            step: 10000,
        },
        {
            id: 2,
            key: "borrow",
            title: "borrowing",
            logo: borrowAssetDetails?.token.logo,
            selectedLabel: borrowAssetDetails?.token.symbol,
            selectedValue: selectedValue.borrow,
            totalValue: 1000000,
            step: 10000,
        },
        {
            id: 3,
            key: "duration",
            title: "Duration",
            selectedLabel: "years",
            selectedValue: selectedValue.duration,
            totalValue: 5,
            step: 0.5,
        }
    ];

    const estimatedEarnings = getEstimatedEarnings({
        supplyAPY,
        borrowAPY,
        amountSupplied,
        amountBorrowed,
        supplyTokenPrice,
        borrowTokenPrice,
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
                    <div className="flex justify-between items-center gap-[12px]">
                        <BodyText level='body2' weight='normal' className="text-gray-600">
                            Estimate returns by using slider below
                        </BodyText>
                        <div className="flex items-center gap-[8px]">
                            {/* Title */}
                            <BodyText level='body2' weight='normal' className="text-gray-600">
                                Your earnings
                            </BodyText>
                            {/* Info tooltip for earnings */}
                            <InfoTooltip
                                label={
                                    <HeadingText level='h4' weight='medium' className="text-gray-800">
                                        <TooltipText>
                                            ${abbreviateNumber(estimatedEarnings)}
                                        </TooltipText>
                                    </HeadingText>
                                }
                                content="This is an approximate estimate of returns and not the actual returns as change in supply will affect the overall earnings with time"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className='bg-white rounded-5 px-[32px] py-[28px]'>
                    <div className="flex flex-col gap-[16px]">
                        {
                            rows.map(row => (
                                <div key={row.id} className="flex flex-col gap-[16px]">
                                    <div className="flex items-center justify-between">
                                        {/* Title */}
                                        <div className="flex items-center gap-[8px]">
                                            <BodyText level='body2' weight='normal' className="capitalize text-gray-600">
                                                {row.title} -
                                            </BodyText>
                                            {/* Selected value */}
                                            <div className="flex items-center gap-[6px]">
                                                {row.logo && <ImageWithDefault src={row.logo} alt={row.selectedLabel} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />}
                                                {
                                                    !isAssetNotAvailable(row) &&
                                                    <HeadingText level='h4' weight='medium' className="text-gray-800">
                                                        {getDisplayedValuePrefix(row.key)}{abbreviateNumber(row.selectedValue, row.key === "duration" ? 1 : 0)} {row.selectedLabel}
                                                    </HeadingText>
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
                                                {getDisplayedValuePrefix(row.key)}{abbreviateNumber(row.totalValue, 0)}{getDisplayedValueSufix(row.key)}
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