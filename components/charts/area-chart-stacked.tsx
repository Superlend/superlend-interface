"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

export const description = "A stacked area chart"

const chartData = [
    { apy: "25" },
    { apy: "55" },
    { apy: "27" },
    { apy: "85" },
    { apy: "28" },
    { apy: "22" },
]

const chartConfig = {
    // desktop: {
    //     label: "Desktop",
    //     color: "hsl(var(--chart-1))",
    // },
    apy: {
        label: "APY",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export function AreaChartStacked() {
    return (
        <Card className="overflow-hidden">
            {/* <CardHeader>
                <CardTitle>Area Chart - Stacked</CardTitle>
                <CardDescription>
                    Showing total visitors for the last 6 months
                </CardDescription>
            </CardHeader> */}
            <CardContent className="p-0 bg-white">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 0,
                            right: 0,
                            top: 0
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        {/* <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        /> */}
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="apy"
                            type="natural"
                            fill="var(--color-apy)"
                            fillOpacity={0.4}
                            stroke="var(--color-apy)"
                            stackId="a"
                        />
                        {/* <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                            stackId="a"
                        /> */}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            {/* <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            January - June 2024
                        </div>
                    </div>
                </div>
            </CardFooter> */}
        </Card>
    )
}
