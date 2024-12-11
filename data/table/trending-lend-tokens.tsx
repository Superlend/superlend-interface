'use client';

import ImageWithBadge from '@/components/ImageWithBadge';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type TTrendingLendTokens = {
//     token: string
//     platform: string
//     chain: string
//     apy: string
//     max_ltv: string
//     deposits: string
//     utilization: string
//     token_image: string
//     chain_image: string
//     platform_image: string
// }
export type TTrendingLendTokens = {
  token: {
    // token details
    name: 'string';
    logo: 'string';
  };
  chain_id: 'number'; // chain details
  platform: {
    // platform details
    name: 'string';
    logo: 'string';
    additional_rewards: 'boolean';
    max_ltv: 'number';
    liquidity: 'string';
    utilization_rate: 'string';
    apy: {
      current: 'string';
      avg_7days: 'string';
      avg_30days: 'string';
    };
  };
  trend: {
    // trend details
    value: 'string';
    type: 'string';
  };
};

export const columns: ColumnDef<TTrendingLendTokens>[] = [
  {
    accessorKey: 'token',
    header: 'Token',
    cell: ({ row }) => {
      return (
        <span className="flex items-center gap-1">
          {/* <ImageWithBadge
                        mainImg={row.original.token.logo}
                        badgeImg={row.original.chain_image}
                    /> */}
          <span className="font-medium">
            <Link href="position-management">{row.original.token.name}</Link>
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
    cell: ({ row }) => {
      return (
        <span className="flex items-center gap-1">
          <img
            src={row.original.platform.logo}
            alt={row.original.platform.name}
            width={20}
            height={20}
          />
          <span className="font-medium">{row.original.platform.name}</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'apy',
    header: 'APY',
  },
  {
    accessorKey: 'max_ltv',
    header: 'Max LTV',
  },
  {
    accessorKey: 'deposits',
    header: 'Deposits',
  },
  {
    accessorKey: 'utilization',
    header: 'Utilization',
  },
  {
    accessorKey: '24hr_change',
    header: '24hr Change',
    cell: ({ row }) => {
      return <Badge variant="green">+ $24.8k Deposits</Badge>;
    },
  },
];
