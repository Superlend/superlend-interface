"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import StackedIcons from "../StackedIcons"
import { Badge } from "../ui/badge"
import { BodyText, Label as LabelText } from "../ui/typography"
import { TPortfolio } from "@/types/queries/portfolio"
import ImageWithDefault from "../ImageWithDefault"
import { abbreviateNumber, capitalizeText, convertScientificToNormal, isLowestValue } from "@/lib/utils"
import { useContext } from "react"
import { AssetsDataContext } from "@/context/data-provider"
import AvatarCircles from "../ui/avatar-circles"
import { Skeleton } from "../ui/skeleton"

export const description = "A radial chart with stacked sections"

const chartConfig = {
    1: {
        label: "Aave",
        color: "hsl(var(--chart-1))",
    },
    2: {
        label: "Compound",
        color: "hsl(var(--chart-2))",
    },
    3: {
        label: "Compound",
        color: "hsl(var(--chart-3))",
    },
    4: {
        label: "Compound",
        color: "hsl(var(--chart-4))",
    },
    5: {
        label: "Compound",
        color: "hsl(var(--chart-5))",
    },
} satisfies ChartConfig

const ICONS_LIST = [
    {
        src: "/images/platforms/aave.webp",
        alt: "Aave",
        id: 1,
    },
    {
        src: "/images/platforms/euler.webp",
        alt: "Euler",
        id: 2,
    },
    {
        src: "/images/platforms/compound.webp",
        alt: "Compound",
        id: 3,
    },
];

function CustomToolTip(payload: any) {
    const { platform, chain, lend, borrow } = payload.payload;

    function hasLowestValuePrefix(value: number) {
        return isLowestValue(Number(value)) ? "< " : "";
    }

    function handleLowestValue(value: number) {
        return isLowestValue(Number(value)) ? 0.01 : value;
    }

    const borrowAmount = handleLowestValue(borrow?.amount)
    const lendAmount = handleLowestValue(lend?.amount)

    return (
        <div className="bg-white rounded-4 w-[225px] px-[12px] py-[16px]">
            <div className="flex items-center justify-between border-b border-gray-400 pb-[12px]">
                <div className="flex items-center gap-1">
                    <ImageWithDefault
                        src={platform?.logo || ""}
                        width={20}
                        height={20}
                        className={"max-w-[20px] max-h-[20px] object-contain"}
                    />
                    <BodyText level="body2" weight="medium">{platform?.id?.split("-")[0]}</BodyText>
                </div>
                <Badge variant="blue" size="sm">
                    Borrow / Lend
                </Badge>
            </div>
            <div className="details-block flex flex-col gap-[13px] pt-[12px]">
                <div className="flex items-center justify-between">
                    <LabelText> Borrow </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">{hasLowestValuePrefix(borrow?.amount)} ${borrowAmount}</BodyText>
                        <AvatarCircles avatarUrls={borrow.tokens.map((token: any) => token.logo)} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <LabelText> Lend </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">{hasLowestValuePrefix(lend?.amount)} ${lendAmount}</BodyText>
                        <AvatarCircles avatarUrls={lend.tokens.map((token: any) => token.logo)} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <LabelText> Chain </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">{capitalizeText(chain?.name)}</BodyText>
                        <ImageWithDefault src={chain?.logo} alt="optimism" height={16} width={16} className="max-w-[16px] max-h-[16px]" />
                    </div>
                </div>
            </div>
        </div>
    )
}

const CustomActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
        <g>
            <path
                d={`
            M ${cx},${cy}
            L ${cx + outerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-startAngle * Math.PI / 180)}
            A ${outerRadius},${outerRadius} 0 0 1 ${cx + outerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-endAngle * Math.PI / 180)}
            L ${cx},${cy}
            Z
          `}
                fill={fill}
                fillOpacity={0.8}
                stroke={fill}
                strokeWidth={2}
            />
        </g>
    );
};

export function RadialChartStacked({
    data,
    isLoading
}: {
    data: TPortfolio,
    isLoading: boolean,
}) {
    const { allChainsData } = useContext(AssetsDataContext);
    const PLATFORMS_WITH_POSITIONS = data.platforms.filter(platform => platform.positions.length > 0);
    const openPositionsCount = PLATFORMS_WITH_POSITIONS.reduce((acc, curr) => {
        return acc + curr.positions.length
    }, 0);
    const totalPlatformsCount = PLATFORMS_WITH_POSITIONS.length;
    const chartData = PLATFORMS_WITH_POSITIONS.map((platform) => {
        const chainDetails = allChainsData.find(chain => Number(chain.chain_id) === Number(platform.chain_id));

        return {
            platform: {
                id: platform.platform_name,
                name: platform.name,
                logo: platform.logo,
                pnl: abbreviateNumber(platform.pnl),
            },
            chain: {
                id: chainDetails?.chain_id,
                name: chainDetails?.name,
                logo: chainDetails?.logo
            },
            lend: {
                amount: getSanitizedValue(platform.total_liquidity),
                tokens: [
                    ...platform.positions.filter(position => position.type === "lend").map(platform => ({ ...platform.token }))
                ],
            },
            borrow: {
                amount: getSanitizedValue(platform.total_borrow),
                tokens: [
                    ...platform.positions.filter(position => position.type === "borrow").map(platform => ({ ...platform.token }))
                ],
            },
        }
    })
    const platformDetails = {
        logos: chartData.map(data => data.platform.logo),
        platform_names: chartData.map(data => data.platform.id.split("-").join(" ")),
    }
    const platformTooltipNames = platformDetails.platform_names.map(name => ({ content: name }));

    return (
        <Card className="flex flex-col">
            <CardContent className="flex flex-1 items-center pb-0">
                {
                    isLoading && <Skeleton className="mx-auto aspect-square w-full max-w-[200px] rounded-full my-4" />
                }
                {!isLoading &&
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square w-full max-w-[250px]"
                    >
                        <RadialBarChart
                            data={chartData}
                            // endAngle={180}
                            innerRadius={90}
                            outerRadius={140}
                        >
                            <ChartTooltip
                                cursor={false}
                                // content={<ChartTooltipContent />
                                content={
                                    <ChartTooltipContent
                                        hideIndicator
                                        className="rounded-6"
                                        labelFormatter={(label, payload) => <CustomToolTip payload={payload[0].payload} />}
                                    />
                                }
                            />
                            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0)}
                                                        className="fill-foreground text-2xl font-bold"
                                                    >
                                                        {openPositionsCount.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 20}
                                                        className="fill-muted-foreground"
                                                    >
                                                        Position{openPositionsCount > 1 ? "s" : ""} open
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </PolarRadiusAxis>
                            {
                                chartData.map((data, index) => (
                                    <RadialBar
                                        key={index}
                                        dataKey={(obj) => {
                                            return Number(obj.platform.pnl) || 1
                                        }}
                                        stackId="a"
                                        cornerRadius={16}
                                        fill={`var(--color-${index + 1})`}
                                        className="stroke-transparent stroke-2"
                                    />
                                ))
                            }
                        </RadialBarChart>
                    </ChartContainer>}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                {isLoading && <Skeleton className="h-7 w-full max-w-[200px] rounded-3" />}
                {!isLoading &&
                    <div className="flex items-center gap-2 font-medium leading-none">
                        {totalPlatformsCount > 0 && <AvatarCircles avatarUrls={platformDetails.logos} avatarDetails={platformTooltipNames} />}
                        Spread across {totalPlatformsCount} platform{totalPlatformsCount > 1 ? "s" : ""}
                    </div>
                }
            </CardFooter>
        </Card>
    )
}

function getSanitizedValue(value: number) {
    const normalValue = Number(convertScientificToNormal(value));
    return isLowestValue(normalValue) ? normalValue.toFixed(10) : abbreviateNumber(normalValue);
}
