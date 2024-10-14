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
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from "@/lib/utils"
import { Skeleton } from "../ui/skeleton"
import { LoaderCircle } from "lucide-react"

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
            transform={`translate(${x - 5},${y - 3})`}
            style={{ zIndex: 10, position: 'relative', color: "#000000" }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fill="#000000">
                {`${shortNubers(payload.value)}%`}
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
    // if (index % 2) return null
    return (
        <g transform={`translate(${x + 10},${y})`} style={{ zIndex: 10 }}>
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
        <div className="flex flex-col items-center gap-[4px] pt-1.5">
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
    const data: any[] = chartData?.map((item: any) => {
        const date = new Date(item.timestamp);
        const dateOptions: any = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
        const timeStamp = extractTimeFromDate(date, { exclude: ["seconds"] });

        const requiredFields = HISTORY_CHART_SELECT_OPTIONS.reduce((acc: any, option) => {
            acc[option.value] = abbreviateNumber(item.data[option.value]);
            return acc;
        }, {});

        return {
            ...requiredFields,
            timestamp: selectedRange === Period.oneDay ? timeStamp : formattedDate
        };
    });

    const disableCategoryFilters = HISTORY_CHART_SELECT_OPTIONS
        .filter((option) => {
            return !data?.some((item: any) => !!Number(item[option.value]))
        })
        .map(option => option.value);

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0 py-[32px] bg-white">
                {
                    !data && <GraphLoading />
                }
                {data &&
                    <>
                        <div className="px-[20px] flex flex-col sm:flex-row gap-[16px] items-center justify-between">
                            {/* Timeline Filters Tab */}
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
                            {/* Category Filters Dropdown */}
                            <RadioGroupDropdown
                                listData={HISTORY_CHART_SELECT_OPTIONS}
                                value={selectedFilter}
                                onValueChange={handleFilterChange}
                                triggerLabel="Filter by"
                                disableFilterOptions={disableCategoryFilters}
                            />
                        </div>

                        {/* Chart Begins Here */}

                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <AreaChart
                                accessibilityLayer
                                data={data}
                                margin={{
                                    left: 0,
                                    right: 20,
                                    top: 30,
                                    bottom: 0
                                }}
                            >
                                {/* <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                        </defs> */}
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickLine={true}
                                    axisLine={true}
                                    tickMargin={5}
                                    interval={100}
                                    tickCount={4}
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
                                    activeDot={{ r: 6 }}
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
                                    tickCount={4}
                                    tickMargin={40}
                                    // stroke="#FFF"
                                    tickLine={true}
                                    axisLine={true}
                                />
                            </AreaChart>
                        </ChartContainer>
                        {/* Chart Ends Here */}
                    </>
                }
            </CardContent>
        </Card>
    )
}

function GraphLoading() {
    return (
        <div className="relative px-4 h-[300px] w-full rounded-6 overflow-hidden">
            <Skeleton className='z-[0] relative w-full h-full' />
            <LoaderCircle className='z-[1] absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin' />
        </div>
    )

}
