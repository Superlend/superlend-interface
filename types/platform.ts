import { Period } from "./periodButtons";

// Platform
export type TPlatformAsset = {
  token: {
    name: string;
    symbol: string;
    logo: string;
    address: string;
    decimals: number;
    price_usd: number;
    warnings: any[];
  };
  supply_apy: number;
  variable_borrow_apy: number;
  stable_borrow_apy: number;
  borrow_enabled: boolean;
  remaining_supply_cap: number;
  remaining_borrow_cap: number;
};

export type TPlatform = {
  platform: {
    name: string;
    platform_name: string;
    protocol_identifier: string;
    // protocol_type: "aaveV3" | "compoundV2" | "morpho" | "fluid";
    protocol_type: "aaveV3" | "compoundV2" | "morpho" | "fluid";
    logo: string;
    chain_id: number;
    vaultId: string;
    isVault: boolean;
    morpho_market_id: string;
    core_contract: string;
  };
  assets: TPlatformAsset[];
};

export type TPlatformHistoryProcessMap = {
  timestamp: number;
  data: {
    size: number;
    tokenID: string;
    symbol: string;
    liquidationPenalty: number;
    blockNumber: number;
    depositRate: number;
    depositRateReward: number;
    variableBorrowRate: number;
    variableBorrowRateReward: number;
    ltv: number;
    liquidationThreshold: number;
    stableBorrowRate: number;
    tokenName: string;
    utilizationRate: number;
    decimals: number;
    platformMarketId: string;
    underlyingAsset: string;
    reserveFactor: number;
  };
};

export type TPlatformHistoryStats = {
  depositRateAverage: number;
  depositRateRewardAverage: number;
  variableBorrowRateAverage: number;
  variableBorrowRateRewardAverage: number;
  utilizationRateAverage: number;
  prediction: {
    depositRatePredict: number;
    variableBorrowRatePredict: number;
  };
};

export type TPlatformHistory = {
  processMap: TPlatformHistoryProcessMap[];
  stats: TPlatformHistoryStats;
};

export enum PlatformValue {
  AaveV3Arbitrum = 'AAVE-V3-ARBITRUM',
  AaveV3Avalanche = 'AAVE-V3-AVALANCHE',
  AaveV3Bsc = 'AAVE-V3-BSC',
  AaveV3Base = 'AAVE-V3-BASE',
  AaveV3Ethereum = 'AAVE-V3-ETHEREUM',
  // AaveV3Fantom = "AAVE-V3-FANTOM",
  AaveV3Gnosis = 'AAVE-V3-GNOSIS',
  AaveV3Metis = 'AAVE-V3-METIS',
  AaveV3Optimism = 'AAVE-V3-OPTIMISM',
  AaveV3Polygon = 'AAVE-V3-POLYGON',
  AaveV3Scoll = 'AAVE-V3-SCROLL',
  CompoundV2Ethereum = 'COMPOUND-V2-ETHEREUM',
  // SparkEthereum = "SPARK-ETHEREUM",
  // SparkGnosis = "SPARK-GNOSIS",
}

export enum PlatformDisplayValue {
  AaveV3Arbitrum = 'AAVE v3 Arbitrum',
  AaveV3Avalanche = 'AAVE v3 Avalanche',
  AaveV3Bsc = 'AAVE v3 BSC',
  AaveV3Base = 'AAVE v3 Base',
  AaveV3Ethereum = 'AAVE v3 Ethereum',
  // AaveV3Fantom = "AAVE v3 Fantom",
  AaveV3Gnosis = 'AAVE v3 Gnosis',
  AaveV3Metis = 'AAVE v3 Metis',
  AaveV3Optimism = 'AAVE v3 Optimism',
  AaveV3Polygon = 'AAVE v3 Polygon',
  AaveV3Scoll = 'AAVE v3 Scroll',
  CompoundV2Ethereum = 'Compound v2 Ethereum',
  // SparkEthereum = "Spark v3 Ethereum",
  // SparkGnosis = "Spark v3 Gnosis",
}

export enum PlatformWebsiteLink {
  AAVE = 'https://app.aave.com',
  COMPOUND = 'https://app.compound.finance/markets/v2',
  FLUID = 'https://fluid.instadapp.io',
  MORPHO = 'https://app.morpho.org',
}

export enum ProtocolIdentifier {
  AAVE = '0xd90fee53cfefbf93ca503a0d64f59094fed2cf1580b2b045f35d81e133e56efb',
  COMPOUND = '0x961d4fe13e02e466e2062e39c0e1145d61e984ef53e19d7d269da579873a2c23',
  FLUID = '0x18b44f70960e14e4f81eea8f78b0aeb027e46f1db1bc047f17b2c6f5c51bc401',
  MORPHO = '0xfeb0a5f9cc734f26b3fea8a850d764fb476db9a75541009a87f797d4008fcc65',
}

export enum PlatformLogo {
  AAVE = 'https://superlend-assets.s3.ap-south-1.amazonaws.com/aave.svg',
  COMPOUND = 'https://superlend-assets.s3.ap-south-1.amazonaws.com/compound.svg',
  FLUID = 'https://superlend-assets.s3.ap-south-1.amazonaws.com/fluid_logo.png',
  MORPHO = 'https://superlend-assets.s3.ap-south-1.amazonaws.com/morpho-logo.svg',
}

export enum PlatformType {
  AAVE = 'aaveV3',
  COMPOUND = 'compoundV2',
  FLUID = 'fluid',
  MORPHO = 'morpho',
}
