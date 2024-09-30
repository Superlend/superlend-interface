import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { HISTORY_CHART_SELECT_OPTIONS, PERIOD_LIST } from "@/constants"
import RadioGroupDropdown from "../dropdowns/RadioGroupDropdown"
import { Period } from "@/types/periodButtons"
import { BodyText, Label } from "../ui/typography"
import { abbreviateNumber, convertDateToTime } from "@/lib/utils"

function CustomChartTooltipContent({
    payload,
    label
}: {
    payload: any[];
    label: string;
}) {
    const value = payload[0].value;
    const caption = payload[0].payload.timestamp;

    return (
        <div className="p-0 bg-white rounded-6 flex flex-col items-center gap-[4px]">
            <BodyText level="body2" weight="medium">
                {value}
            </BodyText>
            <Label size="small" className="text-gray-600">
                {caption}
            </Label>
        </div>
    )
}

export const description = "A stacked area chart"

const chartConfig = {
    liquidationThreshold: {
        label: "Liquidation Threshold",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export function AreaChartStacked({
    selectedRange,
    handleRangeChange,
    selectedFilter,
    handleFilterChange,
    chartData,
}: any) {
    const data = chartData?.map((item: any) => {
        const date = new Date(item.timestamp);
        const dateOptions: any = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
        const timeStamp = convertDateToTime(date, { exclude: ["seconds"] });
        // const formattedDate = `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`;

        return ({
            [selectedFilter.value]: abbreviateNumber(item.data[selectedFilter.value]),
            timestamp: selectedRange === Period.oneDay ? timeStamp : formattedDate
        })
    }
    )

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0 pt-[32px] bg-white">
                <div className="px-[20px] md:px-[36px] flex flex-col sm:flex-row gap-[16px] items-center justify-between">
                    <Tabs defaultValue={Period.oneMonth} value={selectedRange} onValueChange={handleRangeChange} className="w-fit">
                        <TabsList>
                            {
                                PERIOD_LIST.map(item => (
                                    <TabsTrigger key={item.value} value={item.value} className="px-[12px] py-[2px]">
                                        {item.label}
                                    </TabsTrigger>
                                ))
                            }
                        </TabsList>
                    </Tabs>
                    <RadioGroupDropdown listData={HISTORY_CHART_SELECT_OPTIONS} value={selectedFilter} onValueChange={handleFilterChange} triggerLabel="Filter by" />
                </div>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 0,
                            right: 0,
                            top: 30
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
                            cursor={true}
                            content={
                                <ChartTooltipContent
                                    hideIndicator={true}
                                    labelFormatter={(label, playload) => <CustomChartTooltipContent payload={playload} label={label} />} />
                            }
                        />
                        <Area
                            dataKey={selectedFilter.value}
                            type="natural"
                            fill="var(--color-liquidationThreshold)"
                            fillOpacity={0.4}
                            stroke="var(--color-liquidationThreshold)"
                            stackId="a"
                        />
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
