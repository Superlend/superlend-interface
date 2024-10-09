import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
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
import { abbreviateNumber, convertDateToTime, formatDateAccordingToPeriod, shortNubers } from "@/lib/utils"

interface CustomYAxisTickProps {
    x: number
    y: number
    payload: {
        value: number
    }
    index: number
    length: number
}

const CustomYAxisTick = ({
    x,
    y,
    payload,
    index,
    length,
}: CustomYAxisTickProps) => {
    // if (index === 0 || index === length - 1) return null
    return (
        <g
            transform={`translate(${x - 20},${y})`}
            style={{ zIndex: 10, position: 'relative', color: "#000000" }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fill="#000000">
                {shortNubers(payload.value)}
            </text>
        </g>
    )
}

interface CustomXAxisTickProps {
    x: number
    y: number
    selectedRange: Period
    payload: {
        value: number
    }
    index: number
    length: number
}

const CustomXAxisTick = ({
    x,
    y,
    selectedRange,
    payload,
    index,
    length,
}: CustomXAxisTickProps) => {
    if (index % 2) return null
    return (
        <g transform={`translate(${x},${y})`} style={{ zIndex: 10 }}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#000000">
                {formatDateAccordingToPeriod(payload.value.toString(), selectedRange)}
            </text>
        </g>
    )
}

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
                {value}%
            </BodyText>
            <Label size="small" className="text-gray-600">
                {caption}
            </Label>
        </div>
    )
}

export const description = "A stacked area chart"

const chartConfig = {
    platformHistory: {
        label: "History",
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
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: -60,
                            right: 0,
                            top: 30,
                            bottom: -30
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={-35}
                            tickFormatter={(value) =>
                                formatDateAccordingToPeriod(value, selectedRange)
                            }
                            tick={({ x, y, payload, index }) => (
                                <CustomXAxisTick
                                    payload={payload as { value: number }}
                                    selectedRange={selectedRange}
                                    x={x as number}
                                    y={y as number}
                                    index={index as number}
                                    length={data.length}
                                />
                            )}
                        />
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
                            type="monotone"
                            fill="var(--color-platformHistory)"
                            fillOpacity={0.3}
                            stroke="var(--color-platformHistory)"
                            strokeWidth={2}
                            stackId="a"
                        />
                        <YAxis
                            tick={({ x, y, payload, index }) => (
                                <CustomYAxisTick
                                    payload={payload as { value: number }}
                                    x={x as number}
                                    y={y as number}
                                    index={index as number}
                                    length={chartData.length}
                                />
                            )}
                            // domain={[minValue, maxValue]}
                            tickCount={5}
                            tickMargin={-20}
                            stroke="#FFF"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
