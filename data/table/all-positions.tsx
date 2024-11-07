"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import TooltipText from "@/components/tooltips/TooltipText";
import { Badge } from "@/components/ui/badge";
import { BodyText, Label } from "@/components/ui/typography";
import { PositionsContext } from "@/context/positions-provider";
import useDimensions from "@/hooks/useDimensions";
import { abbreviateNumber, capitalizeText, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useContext } from "react";

export type TPositions = {
    token: string
    platform: string
    chain: string
    apy: string
    max_ltv: string
    deposits: string
    utilization: string
    token_image: string
    chain_image: string
    platform_image: string
}

export type TPositionsTable = {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    tokenLogo: string;
    chain_id: number;
    chainName: string;
    chainLogo: string;
    platform_id: string;
    protocol_identifier: string;
    platformName: string;
    platformLogo: string;
    apy: number;
    deposits: string;
    borrows: string;
    earnings: number;
};

export const columns: ColumnDef<TPositionsTable>[] = [
    {
        accessorKey: "tokenSymbol",
        header: "Token",
        accessorFn: item => item.tokenSymbol,
        cell: ({ row }) => {
            const { width: screenWidth } = useDimensions();
            const tokenSymbol: string = row.getValue("tokenSymbol");
            const tokenLogo = row.original.tokenLogo;
            const tokenAddress = row.original.tokenAddress;
            const tokenName = row.original.tokenName;
            const chainId = row.original.chain_id;
            const chainLogo = row.original.chainLogo;
            const chainName = row.original.chainName;
            const platformId = row.original.platform_id;
            const protocolIdentifier = row.original.protocol_identifier;
            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Token</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={tokenSymbol} src={tokenLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{tokenName}</BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={chainName} src={chainLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{capitalizeText(chainName)}</BodyText>
                        </span>
                    </span>
                </span>
            )

            return (
                <BodyText level="body2" weight="medium" className="flex items-center gap-[8px] w-fit max-w-full">
                    <InfoTooltip
                        hide={screenWidth < 768}
                        label={
                            <ImageWithBadge
                                mainImg={tokenLogo}
                                badgeImg={chainLogo}
                                mainImgAlt={tokenSymbol}
                                badgeImgAlt={chainName}
                            />
                        }
                        content={tooltipContent}
                    />
                    <Link href={{
                        pathname: "position-management",
                        query: {
                            token: tokenAddress,
                            chain_id: chainId,
                            protocol_identifier: protocolIdentifier,
                        }
                    }}
                        className="truncate">
                        <span className="truncate block shrink-0 hover:text-secondary-500">
                            {tokenSymbol}
                        </span>
                    </Link>
                    {/* <InfoTooltip iconWidth={16} iconHeight={16} content={tooltipContent} /> */}
                </BodyText>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "platformName",
        header: "Platform",
        accessorFn: item => item.platformName,
        cell: ({ row }) => {
            const platformName: string = row.getValue("platformName");
            const platformVersion: string = row.original.platform_id.split("-")[1]

            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        src={row.original.platformLogo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platformName}
                        width={20}
                        height={20}
                        className="w-[20px] h-[20px] max-w-[20px] max-h-[20px]"
                    />
                    <BodyText level="body2" weight="medium" className="truncate">
                        {`${capitalizeText(platformName)} ${platformVersion}`}
                    </BodyText>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "apy",
        accessorFn: item => Number(item.apy),
        header: () => {
            const { positionType } = useContext<any>(PositionsContext);
            const lendTooltipContent = "% interest you earn on deposits over a year. This includes compounding.";
            const borrowTooltipContent = "% interest you pay for your borrows over a year. This includes compunding.";
            const tooltipContent = positionType === "lend" ? lendTooltipContent : borrowTooltipContent;
            return (
                <InfoTooltip
                    side="bottom"
                    label={
                        <TooltipText>APY</TooltipText>
                    }
                    content={tooltipContent}
                />
            )
        },
        cell: ({ row }) => {
            if (`${Number(row.getValue("apy")).toFixed(2)}` === "0.00") {
                return (
                    <InfoTooltip
                        side="bottom"
                        label={
                            <TooltipText>{`${Number(row.getValue("apy")).toFixed(2)}%`}</TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return (
                <BodyText level="body2" weight="medium">
                    {`${Number(row.getValue("apy")).toFixed(2)}%`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "deposits",
        accessorFn: item => Number(item.deposits),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Deposits</TooltipText>
                }
                content={"Total amount of asset deposited in the pool as collateral so far."}
            />
        ),
        cell: ({ row }) => {
            const value: number = Number(row.getValue("deposits"));
            const isLowestValue = value < 0.01;
            const sanitizedValue = isLowestValue ? "0.01" : abbreviateNumber(value);

            return (
                <BodyText level="body2" weight="medium">
                    {`${isLowestValue ? "< " : ""} $${sanitizedValue}`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "borrows",
        accessorFn: item => Number(item.borrows),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Borrows</TooltipText>
                }
                content={"Total amount of asset borrowed from the pool."}
            />
        ),
        cell: ({ row }) => {
            const value: number = Number(row.getValue("borrows"));
            const isLowestValue = value < 0.01;
            const sanitizedValue = isLowestValue ? "0.01" : abbreviateNumber(value);

            return (
                <BodyText level="body2" weight="medium">
                    {`${isLowestValue ? "< " : ""} $${sanitizedValue}`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "earnings",
        accessorFn: item => Number(item.earnings),
        header: "Earnings",
        cell: ({ row }) => {
            const value: string = Number(row.getValue("earnings")).toFixed(2);
            const prefixSign = Number(value) < 0 ? "-" : Number(value) > 0 ? "+" : "";
            const badgeVariant = Number(value) < 0 ? "destructive" : Number(value) > 0 ? "green" : "default";

            function getSanitizedValue(value: string | number) {
                if (containsNegativeInteger(value)) {
                    return `$${abbreviateNumber(Number(convertNegativeToPositive(value)) ?? 0)}`
                }
                return `$${abbreviateNumber(Number(value) ?? 0)}`
            }

            return (
                <Badge variant={badgeVariant}>
                    {prefixSign}{" "}{getSanitizedValue(value)}
                </Badge>
            )
        },
        // enableGlobalFilter: false,
    },
]
