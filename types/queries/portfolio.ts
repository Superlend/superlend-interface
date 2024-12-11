// Portfolio
export type TGetPortfolioParams = {
  user_address: `0x${string}` | undefined;
  chain_id?: string[];
  platform_id?: string[];
  position_type?: 'lend' | 'borrow';
  protocol_identifier?: string[];
};

type TPosition = {
  type: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logo: string;
    price_usd: number;
  };
  amount: number;
  initial_amount: number;
  apy: number;
  liquidation_threshold: number;
};

type TPlatform = {
  name: string;
  platform_name: string;
  protocol_identifier: string;
  protocol_type: string;
  vaultId: string;
  morpho_market_id: string;
  logo: string;
  chain_id: number;
  positions: TPosition[];
  net_apy: number;
  health_factor: number;
  pnl: number;
  total_liquidity: number;
  total_borrow: number;
};

export type TPortfolio = {
  platforms: TPlatform[];
  total_borrowed: number;
  total_supplied: number;
};

export type TGetUserPositionsParams = {
  user_address: `0x${string}` | undefined;
  chain_ids?: string[];
  platform_ids?: string[];
  tokens?: string[];
};

export type TUserPosition = {
  platform: [
    {
      name: string;
      logo: string;
      chain_id: number;
    },
  ];
  recommended_change: [
    {
      message: string;
      action: string;
    },
  ];
  lend_amount_usd: number;
  borrow_amount_usd: number;
  health_factor: number;
};
