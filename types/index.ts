export type TOpportunityType = "lend" | "borrow";

export type TOpportunity = {
  "token": {
      // token details
      address: string;
      decimals: number;
      logo: string;
      name: string;
      price_usd: number;
      symbol: string;
  },
  "chain_id": "number", // chain details
  "chain": {
      // new chain details
      "chain_id": "number",
      "logo": "string"
  }
  "platform": {
      // platform details
      "name": "string",
      "logo": "string",
      "additional_rewards": "boolean",
      "max_ltv": "number",
      "liquidity": "string",
      "utilization_rate": "string",
      "apy": {
          "current": "string",
          "avg_7days": "string",
          "avg_30days": "string"
      }
  },
  "trend": {
      // trend details
      "value": "string",
      "type": "string"
  }
}

export type TLendOpportunitiesParams = {
  type: "lend" | "borrow";
  chain_ids?: number[];
  tokens?: string[];
  trend?: boolean;
  limit?: number;
};

export type TToken = {
  address: string;
  decimals: number;
  logo: string | null;
  name: string;
  price_usd: number;
  symbol: string;
};

export type TChain= {
  chain_id: number;
  logo: string | null;
  name: string;
};
