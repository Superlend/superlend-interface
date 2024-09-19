"use client"

import { TrendingUp } from "lucide-react"
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

export const description = "A radial chart with stacked sections"

const chartData = [{ month: "january", desktop: 1260, mobile: 570 }]

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
    mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
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

function CustomToolTip() {
    return (
        <div className="bg-white rounded-4 w-[225px] px-[12px] py-[16px]">
            <div className="flex items-center justify-between border-b border-gray-400 pb-[12px]">
                <BodyText level="body2" weight="medium">Syrup fi</BodyText>
                <Badge variant="blue" size="sm">
                    Borrow / Lend
                </Badge>
            </div>
            <div className="details-block flex flex-col gap-[13px] pt-[12px]">
                <div className="flex items-center justify-between">
                    <LabelText> Borrow </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">987.66</BodyText>
                        <img src="/images/tokens/usdc.webp" alt="usdc" height={16} width={16} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <LabelText> Lend </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">1.473</BodyText>
                        <img src="/images/tokens/btc.webp" alt="bitcoin" height={16} width={16} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <LabelText> Network </LabelText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText level="body2" weight="medium">Optimism</BodyText>
                        <img src="/images/chains/op.webp" alt="optimism" height={16} width={16} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function RadialChartStacked() {
    const totalVisitors = 5;

    return (
        <Card className="flex flex-col">
            {/* <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Stacked</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader> */}
            <CardContent className="flex flex-1 items-center pb-0">
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
                            content={<CustomToolTip />
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
                                                    {totalVisitors.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 20}
                                                    className="fill-muted-foreground"
                                                >
                                                    Positions open
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                        <RadialBar
                            dataKey="desktop"
                            stackId="a"
                            cornerRadius={16}
                            fill="var(--color-desktop)"
                            className="stroke-transparent stroke-2"
                        />
                        <RadialBar
                            dataKey="mobile"
                            fill="var(--color-mobile)"
                            stackId="a"
                            cornerRadius={16}
                            className="stroke-transparent stroke-2"
                        />
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    <StackedIcons list={ICONS_LIST} />
                    Spread across 4 platforms
                </div>
            </CardFooter>
        </Card>
    )
}
