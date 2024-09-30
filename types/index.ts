import { Period } from "./periodButtons";

export type TOpportunityType = "lend" | "borrow";

export type TToken = {
  address: string;
  decimals: number;
  logo: string | null;
  name: string;
  price_usd: number;
  symbol: string;
};

export type TChain = {
  chain_id: number;
  logo: string | null;
  name: string;
};

// Queries START =====================================

// Login Challenge
export type TGetLoginChallengeParams = {
  user_address: string;
};

export type TLoginChallengeResponse = {
  challenge: string;
};

// Login
export type TPostLoginParams = {
  challenge: string;
  signature: string;
  address: string;
};

export type TLoginResponse = {
  access_token: string;
  refresh_token: string;
};

// Refresh
export type TPostRefreshParams = {
  Authorization: string;
};

export type TRefreshResponse = TLoginResponse;

// Opportunities
export type TGetOpportunitiesParams = {
  type: "lend" | "borrow";
  chain_ids?: number[];
  tokens?: string[];
  trend?: boolean;
  limit?: number;
};

export type TOpportunity = {
  token: {
    address: string;
    decimals: number;
    logo: string;
    name: string;
    price_usd: number;
    symbol: string;
  };
  chain_id: "number";
  platform: {
    name: string;
    platform_name: string;
    logo: string;
    additional_rewards: "boolean";
    max_ltv: "number";
    liquidity: string;
    utilization_rate: string;
    apy: {
      current: string;
      avg_7days: string;
      avg_30days: string;
    };
  };
  trend: {
    value: string;
    type: string;
  };
};

export type TOpportunityTable = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenLogo: string;
  chainLogo: string;
  chain_id: string;
  platform_id: string;
  platformName: string;
  platformLogo: string;
  apy_current: string;
  max_ltv: string;
  deposits: string;
  utilization: string;
};

// Platform
export type TGetPlatformParams = {
  chain_id: number;
  platform_id: string;
};

export type TPlatform = {
  platform: {
    name: string;
    logo: string;
    chain_id: 0;
  };
  assets: {
    token: {
      name: string;
      symbol: string;
      logo: string;
      address: string;
      decimals: number;
      price_usd: number;
    };
    supply_apy: number;
    variable_borrow_apy: number;
    stable_borrow_apy: number;
    borrow_enabled: boolean;
    remaining_supply_cap: number;
    remaining_borrow_cap: number;
  };
};

export type TGetPlatformHistoryParams = {
  platform_id: string;
  token: string;
  period: Period.oneDay | Period.oneMonth | Period.oneWeek | Period.oneYear;
};

export type TGetTokensParams = {
  chain_id?: string[];
  token?: string[];
};

// Queries END =====================================
