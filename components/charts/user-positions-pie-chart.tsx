'use client';

import * as React from 'react';
import { Label as RechartsLabel, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TPortfolio } from '@/types/queries/portfolio';
import {
  abbreviateNumber,
  capitalizeText,
  convertNegativeToPositive,
  containsNegativeInteger,
} from '@/lib/utils';
import { convertScientificToNormal } from '@/lib/utils';
import { isLowestValue } from '@/lib/utils';
import { AssetsDataContext } from '@/context/data-provider';
import { Skeleton } from '../ui/skeleton';
import AvatarCircles from '../ui/avatar-circles';
import ImageWithDefault from '../ImageWithDefault';
import { BodyText, Label } from '../ui/typography';
import { Badge } from '../ui/badge';
import { ChartPie } from 'lucide-react';

export const description = 'A donut chart with text';

const chartDataTemplate = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const chartConfig = {
  aave: {
    label: 'Aave',
    color: 'hsl(var(--chart-aave))',
  },
  compound: {
    label: 'Compound',
    color: 'hsl(var(--chart-compound))',
  },
  morpho: {
    label: 'Morpho',
    color: 'hsl(var(--chart-morpho))',
  },
  fluid: {
    label: 'Fluid',
    color: 'hsl(var(--chart-fluid))',
  },
} satisfies ChartConfig;

function CustomToolTip(payload: any) {
  const { platform, chain, lend, borrow } = payload.payload;

  function hasLowestValuePrefix(value: number) {
    return isLowestValue(Number(value)) ? '< ' : '';
  }

  function handleLowestValue(value: number) {
    return isLowestValue(Number(value)) ? 0.01 : value;
  }

  const borrowAmount = handleLowestValue(borrow?.amount);
  const lendAmount = handleLowestValue(lend?.amount);
  const totalPositionsPerPlatform = lend?.tokens.length + borrow?.tokens.length;

  return (
    <div className="bg-white rounded-4 w-[225px] px-[12px] py-[16px]">
      <div className="flex items-center justify-between border-b border-gray-400 pb-[12px]">
        <div className="flex items-center gap-1">
          <ImageWithDefault
            src={platform?.logo || ''}
            alt={platform?.name || ''}
            width={20}
            height={20}
            className={'max-w-[20px] max-h-[20px] object-contain'}
          />
          <BodyText level="body2" weight="medium" className="truncate max-w-[100px]">
            {platform?.id?.split('-')[0]}
          </BodyText>
        </div>
        <Badge variant="blue" size="sm" className="w-fit shrink-0">
          {totalPositionsPerPlatform.toLocaleString()} position
          {totalPositionsPerPlatform > 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="details-block flex flex-col gap-[13px] pt-[12px]">
        <div className="flex items-center justify-between">
          <Label> Borrow </Label>
          <div className="flex items-center gap-[4px]">
            <BodyText level="body2" weight="medium">
              {hasLowestValuePrefix(borrow?.amount)} ${borrowAmount}
            </BodyText>
            <AvatarCircles avatarUrls={borrow.tokens.map((token: any) => token.logo)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label> Lend </Label>
          <div className="flex items-center gap-[4px]">
            <BodyText level="body2" weight="medium">
              {hasLowestValuePrefix(lend?.amount)} ${lendAmount}
            </BodyText>
            <AvatarCircles avatarUrls={lend.tokens.map((token: any) => token.logo)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label> Chain </Label>
          <div className="flex items-center gap-[4px]">
            <BodyText level="body2" weight="medium">
              {capitalizeText(chain?.name)}
            </BodyText>
            <ImageWithDefault
              src={chain?.logo || ''}
              alt={chain?.name || ''}
              height={16}
              width={16}
              className="max-w-[16px] max-h-[16px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserPositionsByPlatform({
  data,
  isLoading,
}: {
  data: TPortfolio;
  isLoading: boolean;
}) {
  const { allChainsData } = React.useContext(AssetsDataContext);

  const PLATFORMS_WITH_POSITIONS = data.platforms.filter(
    (platform) => platform.positions.length > 0
  );
  const openPositionsCount = PLATFORMS_WITH_POSITIONS.reduce((acc, curr) => {
    return acc + curr.positions.length;
  }, 0);
  const totalMarketsCount = PLATFORMS_WITH_POSITIONS.length;

  const chartData = PLATFORMS_WITH_POSITIONS.map((platform) => {
    const chainDetails = allChainsData.find(
      (chain) => Number(chain.chain_id) === Number(platform.chain_id)
    );
    const MIN_VALUE_REQUIRED = 5;
    const MIN_VALUE_PADDING = 0.1;

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
        logo: chainDetails?.logo,
      },
      lend: {
        amount: getSanitizedValue(platform.total_liquidity),
        tokens: [
          ...platform.positions
            .filter((position) => position.type === 'lend')
            .map((platform) => ({ ...platform.token })),
        ],
      },
      borrow: {
        amount: getSanitizedValue(platform.total_borrow),
        tokens: [
          ...platform.positions
            .filter((position) => position.type === 'borrow')
            .map((platform) => ({ ...platform.token })),
        ],
      },
      chartKey: platform.platform_name.split('-')[0].toLowerCase(),
      chartValue: handleNegativeValue(
        platform.pnl < MIN_VALUE_REQUIRED ? platform.pnl + MIN_VALUE_PADDING : platform.pnl
      ),
      fill: `var(--color-${platform.platform_name.split('-')[0].toLowerCase()})`,
    };
  });

  function handleNegativeValue(value: string | number) {
    if (containsNegativeInteger(value)) {
      return Number(convertNegativeToPositive(value));
    }
    return Number(value);
  }

  const platformDetails = {
    logos: chartData.map((data) => data.platform.logo),
    platform_names: chartData.map((data) => data.platform.id.split('-').join(' ')),
  };

  const platformTooltipNames = platformDetails.platform_names.map((name) => ({
    content: capitalizeText(name),
  }));

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-1 p-0">
        {isLoading && (
          <Skeleton className="mx-auto aspect-square w-full max-w-[200px] rounded-full my-8" />
        )}
        {!isLoading && chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-[200px] lg:h-full gap-3">
            <ChartPie strokeWidth={1.5} className="w-8 h-8 text-gray-700" />
            <BodyText level="body1" weight="normal" className="text-gray-700">
              No positions to display
            </BodyText>
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    className="rounded-6"
                    labelFormatter={(label, payload) => (
                      <CustomToolTip payload={payload[0].payload} />
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="chartValue"
                nameKey="chartKey"
                innerRadius={78}
                // strokeWidth={30}
                stroke="#fff"
                cornerRadius={12}
                paddingAngle={1}
              >
                <RechartsLabel
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 5}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {openPositionsCount.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-gray-600 font-medium text-[14px] capitalize"
                          >
                            Positions open
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      {!!totalMarketsCount && (
        <CardFooter className="flex-col gap-2 text-sm">
          {isLoading && <Skeleton className="h-7 w-full max-w-[200px] rounded-3" />}
          {!isLoading && totalMarketsCount > 0 && (
            <div className="flex items-center gap-2 font-medium leading-none text-gray-600">
              {totalMarketsCount > 0 && (
                <AvatarCircles
                  avatarUrls={platformDetails.logos}
                  avatarDetails={platformTooltipNames}
                  moreItemsCount={totalMarketsCount - 6}
                  maxItemsToShow={6}
                />
              )}
              Spread across {totalMarketsCount} market{totalMarketsCount > 1 ? 's' : ''}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function getSanitizedValue(value: number) {
  const normalValue = Number(convertScientificToNormal(value));
  return isLowestValue(normalValue) ? normalValue.toFixed(10) : abbreviateNumber(normalValue);
}
