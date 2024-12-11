import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { HISTORY_CHART_SELECT_OPTIONS, PERIOD_LIST } from '@/constants';
import RadioGroupDropdown from '../dropdowns/RadioGroupDropdown';
import { Period } from '@/types/periodButtons';
import { BodyText, Label } from '../ui/typography';
import {
  abbreviateNumber,
  extractTimeFromDate,
  formatDateAccordingToPeriod,
  shortNubers,
} from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { ChartLine, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import ImageWithDefault from '../ImageWithDefault';

interface CustomYAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: number;
  };
  index: number;
  length: number;
  setYAxisDigitCount: any;
}

const CustomYAxisTick = ({
  x,
  y,
  payload,
  index,
  length,
  setYAxisDigitCount,
}: CustomYAxisTickProps) => {
  // if (index === 0 || index === length - 1) return null
  setYAxisDigitCount(payload.value.toString().length);

  return (
    <g
      transform={`translate(${x - 5},${y - 3})`}
      style={{ zIndex: 10, position: 'relative', color: '#000000' }}
    >
      <text x={0} y={0} dy={6} dx={11} textAnchor="start" fill="#000000">
        {`${shortNubers(payload.value)}%`}
      </text>
    </g>
  );
};

interface CustomXAxisTickProps {
  x: number;
  y: number;
  selectedRange: Period;
  payload: {
    value: number;
  };
  index: number;
  length: number;
}

const CustomXAxisTick = ({ x, y, selectedRange, payload, index, length }: CustomXAxisTickProps) => {
  // if (index % 2) return null
  return (
    <g transform={`translate(${x + 10},${y})`} style={{ zIndex: 10 }}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#000000">
        {formatDateAccordingToPeriod(payload.value.toString(), selectedRange)}
      </text>
    </g>
  );
};

function CustomChartTooltipContent({ payload, label }: { payload: any[]; label: string }) {
  const value = payload[0].value;
  const caption = payload[0].payload.timestamp;

  return (
    <div className="flex flex-col items-center gap-[4px] px-1.5 pt-1.5">
      <BodyText level="body2" weight="medium">
        {abbreviateNumber(value)}%
      </BodyText>
      <Label size="small" className="text-gray-600">
        {caption}
      </Label>
    </div>
  );
}

export const description = 'A stacked area chart';

const chartConfig = {
  platformHistory: {
    label: 'History',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function AreaChartStacked({
  selectedRange,
  handleRangeChange,
  selectedFilter,
  handleFilterChange,
  chartData,
  disableCategoryFilters,
}: any) {
  const [yAxisDigitCount, setYAxisDigitCount] = useState(0);

  const isFilterDisabled = disableCategoryFilters.length === HISTORY_CHART_SELECT_OPTIONS.length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 py-[32px] bg-white">
        {!chartData && <GraphLoading />}
        {chartData && !isFilterDisabled && (
          <>
            <div className="px-[20px] flex flex-col sm:flex-row gap-[16px] items-center justify-between">
              {/* Timeline Filters Tab */}
              <Tabs
                defaultValue={Period.oneMonth}
                value={selectedRange}
                onValueChange={handleRangeChange}
                className="w-fit"
              >
                <TabsList>
                  {PERIOD_LIST.map((item) => (
                    <TabsTrigger key={item.value} value={item.value} className="px-[12px] py-[2px]">
                      {item.label}
                    </TabsTrigger>
                  ))}
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
                data={chartData}
                margin={{
                  left: yAxisDigitCount > 4 ? 20 : yAxisDigitCount > 3 ? 10 : 0,
                  right: 20,
                  top: 30,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={true}
                  axisLine={true}
                  tickMargin={5}
                  interval={100}
                  tickCount={4}
                  tickFormatter={(value) => formatDateAccordingToPeriod(value, selectedRange)}
                  tick={({ x, y, payload, index }) => (
                    <CustomXAxisTick
                      payload={payload as { value: number }}
                      selectedRange={selectedRange}
                      x={x as number}
                      y={y as number}
                      index={index as number}
                      length={chartData.length}
                    />
                  )}
                />
                <ChartTooltip
                  cursor={true}
                  content={
                    <ChartTooltipContent
                      hideIndicator={true}
                      className=" rounded-lg"
                      labelFormatter={(label, playload) => (
                        <CustomChartTooltipContent payload={playload} label={label} />
                      )}
                    />
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
                      setYAxisDigitCount={setYAxisDigitCount}
                    />
                  )}
                  // domain={[minValue, maxValue]}
                  tickCount={4}
                  tickMargin={yAxisDigitCount > 4 ? 60 : yAxisDigitCount > 3 ? 50 : 40}
                  // stroke="#FFF"
                  tickLine={true}
                  axisLine={true}
                />
              </AreaChart>
            </ChartContainer>
            {/* Chart Ends Here */}
          </>
        )}
        {chartData && isFilterDisabled && (
          <div className="flex flex-col gap-2 items-center justify-center h-[250px] w-full">
            <ChartLine className="w-12 h-12 text-gray-600" />
            <Label size="large" weight="medium" className="text-gray-600">
              No history data found
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GraphLoading() {
  return (
    <div className="relative px-4 h-[300px] w-full rounded-6 overflow-hidden">
      <Skeleton className="z-[0] relative w-full h-full" />
      <LoaderCircle className="z-[1] absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin" />
    </div>
  );
}
