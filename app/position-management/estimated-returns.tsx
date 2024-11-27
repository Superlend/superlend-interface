import { getEstimatedEarnings } from "./helper-functions";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { TPlatform } from '@/types'
import { BodyText, HeadingText, Label } from "@/components/ui/typography";
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
import { Switch } from "@/components/ui/switch";
import { usePositionManagementContext } from "@/context/position-management-provider";


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

const DEFAULT_SELECTED_VALUES = {
    lend: 0,
    borrow: 0,
    duration: 1,
}

export function EstimatedReturns({
    platformDetails
}: {
    platformDetails: TPlatform;
}) {
    const { platformHistoryData } = usePositionManagementContext();
    const searchParams = useSearchParams();
    const tokenAddress = searchParams.get("token") || "";
    const positionType = searchParams.get("position_type") || "lend";
    const [selectedValue, setSelectedValue] = useState(DEFAULT_SELECTED_VALUES);
    const [selectedStableTokenDetails, setSelectedStableTokenDetails] = useState<any>(null);
    const [lendAssetDetails, setLendAssetDetails] = useState<any>(null);
    const [borrowAssetDetails, setBorrowAssetDetails] = useState<any>(null);
    const [stableLendAssetsList, setStableLendAssetsList] = useState<any[]>([]);
    const [stableBorrowAssetsList, setStableBorrowAssetsList] = useState<any[]>([]);
    const isAaveV3 = platformDetails?.platform.protocol_type === "aaveV3";
    const [isUSDAmount, setIsUSDAmount] = useState(false);

    useEffect(() => {
        /*
            1. If protocol_type is aaveV3, then get the lend/borrow asset details from the token address
            2. If protocol_type is other than aaveV3, then get the lend asset details from the platform data
        */
        if (isAaveV3) {
            if (positionType === "lend") {
                // Get lend asset details
                setLendAssetDetails(platformDetails?.assets.find(asset => asset.token.address === tokenAddress));
                // Get the first borrow asset details
                setBorrowAssetDetails(platformDetails?.assets.filter(asset => asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0]);
                // Get stable borrow assets list
                setStableBorrowAssetsList(platformDetails?.assets.filter(asset => asset.borrow_enabled && STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol)));
            } else {
                // Get stable lend assets list
                setStableLendAssetsList(platformDetails?.assets.filter(asset => STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol)));
                // Get the first lend asset details
                setLendAssetDetails(platformDetails?.assets.filter(asset => STABLE_TOKEN_SYMBOLS.includes(asset.token.symbol))[0]);
                // Get borrow asset details
                setBorrowAssetDetails(platformDetails?.assets.find(asset => asset.token.address === tokenAddress));
            }
        } else {
            // Get the first lend asset details
            setLendAssetDetails(platformDetails?.assets.filter(asset => !asset.borrow_enabled)[0]);
            // Get the first borrow asset details
            setBorrowAssetDetails(platformDetails?.assets.filter(asset => asset.borrow_enabled)[0]);
        }
    }, [tokenAddress]);

    // Reset selected values when isUSDAmount changes
    // useEffect(() => {
    //     setSelectedValue(DEFAULT_SELECTED_VALUES);
    // }, [isUSDAmount]);

    // Reset borrow value when lend value changes
    useEffect(() => {
        setSelectedValue(prev => ({ ...prev, borrow: 0 }));
    }, [selectedValue.lend]);

    const supplyAPY = isAaveV3 && positionType === "borrow" ? (selectedStableTokenDetails?.supply_apy) || 0 : (lendAssetDetails?.supply_apy) || 0;
    const borrowAPY = isAaveV3 && positionType === "lend" ? (selectedStableTokenDetails?.variable_borrow_apy) || 0 : (borrowAssetDetails?.variable_borrow_apy) || 0;
    const amountSuppliedInUsd = selectedValue?.lend || 0;
    const amountBorrowedInUsd = selectedValue?.borrow || 0;
    const duration = selectedValue?.duration || 0;
    const assetLTV = platformHistoryData?.processMap[platformHistoryData?.processMap.length - 1]?.data?.ltv || 0;

    const handleSelectedValueChange = (value: number, type: "lend" | "borrow" | "duration") => {
        setSelectedValue(prev => ({ ...prev, [type]: value }));
    }

    // const amountSupplied = isUSDAmount ? amountSuppliedInUsd : selectedValue.lend;
    // const amountBorrowed = isUSDAmount ? amountBorrowedInUsd : selectedValue.borrow;
    const amountSupplied = selectedValue.lend;
    const amountBorrowed = selectedValue.borrow;
    const maxBorrowAmountInUsd = (assetLTV / 100) * (lendAssetDetails?.token.price_usd * selectedValue.lend);
    // max borrow amount in usd = ltv/100 * usd_value_of_collat

    const rows: TRow[] = [
        {
            id: 1,
            key: "lend",
            title: "lend collateral",
            logo: lendAssetDetails?.token.logo,
            selectedLabel: lendAssetDetails?.token.symbol || "",
            selectedValue: selectedValue.lend,
            hasSelectedValue: !(stableLendAssetsList.length > 0),
            totalValue: isUSDAmount ? 25000 : Math.max(25000 / lendAssetDetails?.token.price_usd, 5),
            step: isUSDAmount ? 50 : Math.min(0.01, 50 / lendAssetDetails?.token.price_usd),
        },
        {
            id: 2,
            key: "borrow",
            title: "borrowing",
            logo: borrowAssetDetails?.token.logo,
            selectedLabel: borrowAssetDetails?.token.symbol || "",
            selectedValue: selectedValue.borrow,
            hasSelectedValue: !(stableBorrowAssetsList.length > 0),
            totalValue: isUSDAmount ? maxBorrowAmountInUsd : Math.max(maxBorrowAmountInUsd / borrowAssetDetails?.token.price_usd, 5),
            step: isUSDAmount ? 50 : Math.min(0.01, 50 / borrowAssetDetails?.token.price_usd),
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

    const {
        interestGain,
        interestLoss,
        netEstimatedEarnings,
    } = getEstimatedEarnings({
        supplyAPY,
        borrowAPY,
        amountSupplied,
        amountBorrowed,
        duration,
    });

    function getDisplayedValuePrefix(key: "lend" | "borrow" | "duration") {
        return key === "lend" || key === "borrow" ? (isUSDAmount ? "$" : "") : "";
    }

    function getDisplayedValueSufix(key: "lend" | "borrow" | "duration") {
        return key === "duration" ? " Years" : "";
    }

    function isAssetNotAvailable(rowItem: TRow) {
        return !rowItem.logo && rowItem.key !== "duration";
    }

    function handleIsUSDAmountChange(checked: boolean) {
        // First reset the values explicitly based on the direction of the change
        if (checked) {  // false -> true
            setSelectedValue({
                lend: 0,
                borrow: 0,
                duration: 1,
            });
            // Force a small delay before changing the format
            setTimeout(() => {
                setIsUSDAmount(checked);
            }, 0);
        } else {  // true -> false
            setIsUSDAmount(checked);
            setSelectedValue({
                lend: 0,
                borrow: 0,
                duration: 1,
            });
        }
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
                        {/* Estimate returns by using slider below */}
                        <div className="flex items-center gap-[8px]">
                            <BodyText level='body2' weight='normal' className="text-gray-600">
                                Estimate returns by using slider below
                            </BodyText>
                            <InfoTooltip
                                content="This is an approximate estimate of returns and not the actual returns as change in supply will affect the overall earnings with time"
                            />
                        </div>
                        <div className="flex items-center gap-[8px]">
                            <Switch
                                id="values-format"
                                checked={isUSDAmount}
                                onCheckedChange={handleIsUSDAmountChange}
                            />
                            <Label htmlFor="values-format" weight="medium" className="text-gray-600">
                                {isUSDAmount ? "USD" : "Token"} Amount
                            </Label>
                        </div>
                        {/* Estimated earnings */}
                        <div className="flex items-center gap-[8px]">
                            {/* Title */}
                            <BodyText level='body2' weight='normal' className="text-gray-600">
                                Estimated earnings
                            </BodyText>
                            {/* HeadingText for USD amount */}
                            {isUSDAmount && <HeadingText level='h4' weight='medium' className="text-gray-800">
                                {containsNegativeInteger(netEstimatedEarnings) ? "-" : ""}{isUSDAmount ? "$" : ""}{abbreviateNumber(Number(convertNegativeToPositive(netEstimatedEarnings)))}
                            </HeadingText>}
                            {/* Info tooltip for token amount */}
                            {!isUSDAmount && <InfoTooltip
                                label={
                                    <HeadingText level='h4' weight='medium' className="text-gray-800">
                                        <TooltipText>
                                            {containsNegativeInteger(netEstimatedEarnings) ? "-" : ""}{isUSDAmount ? "$" : ""}{abbreviateNumber(Number(convertNegativeToPositive(netEstimatedEarnings)))}
                                        </TooltipText>
                                    </HeadingText>
                                }
                                content={
                                    <div className="flex flex-col gap-[12px]">
                                        <div className="flex flex-col gap-[4px]">
                                            <BodyText level='body2' weight='normal' className="capitalize text-gray-600">
                                                Supply -
                                            </BodyText>
                                            <div className="flex items-center gap-[6px]">
                                                <HeadingText level='h5' weight='medium' className="text-gray-800">
                                                    {containsNegativeInteger(interestGain) ? "-" : ""}{isUSDAmount ? "$" : ""}{abbreviateNumber(Number(convertNegativeToPositive(interestGain)))}
                                                </HeadingText>
                                                <ImageWithDefault src={lendAssetDetails?.token.logo} alt={lendAssetDetails?.token.symbol} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-[4px]">
                                            <BodyText level='body2' weight='normal' className="capitalize text-gray-600">
                                                Loan -
                                            </BodyText>
                                            <div className="flex items-center gap-[6px]">
                                                <HeadingText level='h5' weight='medium' className="text-gray-800">
                                                    {containsNegativeInteger(interestLoss) ? "-" : ""}{isUSDAmount ? "$" : ""}{abbreviateNumber(Number(convertNegativeToPositive(interestLoss)))}
                                                </HeadingText>
                                                <ImageWithDefault src={borrowAssetDetails?.token.logo} alt={borrowAssetDetails?.token.symbol} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />
                                            </div>
                                        </div>
                                    </div>
                                }
                            />}
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
                                                        <HeadingText level='h5' weight='medium' className="text-gray-800">
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
                                        key={row.key}
                                        // || (row.key === "borrow" && selectedValue.borrow === row.totalValue)
                                        defaultValue={[row.selectedValue]}
                                        max={row.totalValue}
                                        step={row.step}
                                        value={[row.selectedValue]}
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
                            className={
                                cn("flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4",
                                    selectedStableTokenDetails?.token?.address === asset?.token?.address && "bg-gray-400")
                            }
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