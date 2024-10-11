// Portfolio
export type TGetPortfolioParams = {
  user_address: `0x${string}` | undefined;
  chain_id?: string[];
  platform_id?: string[];
  position_type?: "lend" | "borrow";
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
  apy: number;
  liquidation_threshold: number;
};

type TPlatform = {
  name: string;
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
