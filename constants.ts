import { Period, PeriodDisplay } from "./types/periodButtons";
import {
  PlatformDisplayValue,
  PlatformValue,
  PlatformWebsiteLink,
} from "./types/platform";

export type TPlatformWebsiteLinks = {
  aave: PlatformWebsiteLink.AAVE;
  compound: PlatformWebsiteLink.COMPOUND;
  fluid: PlatformWebsiteLink.FLUID;
  morpho: PlatformWebsiteLink.MORPHO;
};

export type TChainNamesBasedOnAaveMarkets = {
  bsc: "bnb";
};

export const PERIOD_LIST = [
  {
    label: PeriodDisplay.oneDay,
    value: Period.oneDay,
  },
  {
    label: PeriodDisplay.oneWeek,
    value: Period.oneWeek,
  },
  { label: PeriodDisplay.oneMonth, value: Period.oneMonth },
  //   { label: PeriodDisplay.threeMonth, value: Period.threeMonth },
  //   { label: PeriodDisplay.sixMonth, value: Period.sixMonth },
  { label: PeriodDisplay.oneYear, value: Period.oneYear },
];

export const PERIOD_DISPLAY_MAPPER: { [key in Period]: string } = {
  [Period.oneDay]: "day",
  [Period.oneWeek]: "week",
  [Period.oneMonth]: "month",
  //   [Period.threeMonth]: "3 months",
  //   [Period.sixMonth]: "6 months",
  [Period.oneYear]: "year",
};

export const HISTORY_CHART_SELECT_OPTIONS = [
  {
    label: "Deposit Rate",
    value: "depositRate",
  },
  {
    label: "Deposit Rate with Reward",
    value: "depositRateReward",
  },
  {
    label: "LTV",
    value: "ltv",
  },
  {
    label: "Variable Borrow APR",
    value: "variableBorrowRate",
  },
  {
    label: "Variable Borrow APR with Reward",
    value: "variableBorrowRateReward",
  },
  {
    label: "Utilization Rate",
    value: "utilizationRate",
  },
  {
    label: "Liquidation Threshold",
    value: "liquidationThreshold",
  },
  {
    label: "Liquidation Penalty",
    value: "liquidationPenalty",
  },
  {
    label: "Reserve Factor",
    value: "reserveFactor",
  },
];

export const STABLECOINS_NAMES_LIST = [
  "USDT",
  "sUSDe",
  "USDe",
  "GHO",
  "USDC",
  "DAI",
  "USDS",
  "sDAI",
  "PYUSD",
  "crvUSD",
  "LUSD",
  "USDP",
  "TUSD",
  "sUSD",
  "FDUSD",
  "USDC.e",
  "fUSDT",
  "m.USDT",
  "m.DAI",
  "m.USDC",
  "USDbC",
  "DAI.e",
];

export const platformWebsiteLinks: TPlatformWebsiteLinks = {
  aave: PlatformWebsiteLink.AAVE,
  compound: PlatformWebsiteLink.COMPOUND,
  fluid: PlatformWebsiteLink.FLUID,
  morpho: PlatformWebsiteLink.MORPHO,
};

export const SHEET_FORM_URL =
  "https://script.google.com/macros/s/AKfycbwdG0b3rOiiRL0UP0KwHSBZfwVYRyeDZrJfVKAAV7yoVPGglaRaIanX91S_yRIl0ZYw/exec";

export const chainNamesBasedOnAaveMarkets: TChainNamesBasedOnAaveMarkets = {
  bsc: "bnb",
};

export const PLATFORM_OPTIONS = [
  {
    value: PlatformValue.AaveV3Arbitrum,
    label: PlatformDisplayValue.AaveV3Arbitrum,
  },
  {
    value: PlatformValue.AaveV3Avalanche,
    label: PlatformDisplayValue.AaveV3Avalanche,
  },
  { value: PlatformValue.AaveV3Bsc, label: PlatformDisplayValue.AaveV3Bsc },
  { value: PlatformValue.AaveV3Base, label: PlatformDisplayValue.AaveV3Base },
  {
    value: PlatformValue.AaveV3Ethereum,
    label: PlatformDisplayValue.AaveV3Ethereum,
  },
  // {
  //   value: PlatformValue.AaveV3Fantom,
  //   label: PlatformDisplayValue.AaveV3Fantom,
  // },
  {
    value: PlatformValue.AaveV3Gnosis,
    label: PlatformDisplayValue.AaveV3Gnosis,
  },
  { value: PlatformValue.AaveV3Metis, label: PlatformDisplayValue.AaveV3Metis },
  {
    value: PlatformValue.AaveV3Optimism,
    label: PlatformDisplayValue.AaveV3Optimism,
  },
  {
    value: PlatformValue.AaveV3Polygon,
    label: PlatformDisplayValue.AaveV3Polygon,
  },
  { value: PlatformValue.AaveV3Scoll, label: PlatformDisplayValue.AaveV3Scoll },
  {
    value: PlatformValue.CompoundV2Ethereum,
    label: PlatformDisplayValue.CompoundV2Ethereum,
  },
  // {
  //   value: PlatformValue.SparkEthereum,
  //   label: PlatformDisplayValue.SparkEthereum,
  // },
  // { value: PlatformValue.SparkGnosis, label: PlatformDisplayValue.SparkGnosis },
];

export const POOL_BASED_PROTOCOLS = ["aaveV3", "compoundV2"]; // Extracted values from the platform_type field in the backend
export const PAIR_BASED_PROTOCOLS = ["morpho", "fluid"]; // Extracted values from the platform_type field in the backend

export enum WarningMessages {
  hardcoded_oracle = "Using a fixed oracle, limits accurate pricing.",
  low_liquidity = "Low liquidity, may affect borrowing costs.",
  unrecognized_lender = "Lender unknown, check for risks.",
  not_whitelisted = "Asset not approved, use cautiously.",
  unrecognized_oracle = "Oracle unverified, pricing may be inaccurate.",
  unrecognized_collateral_asset = "Collateral unrecognized, review asset safety.",
  unrecognized_loan_asset = "Loan asset unknown, check details.",
  incompatible_oracle_feeds = "Oracle feeds conflict, may affect rates.",
  bad_debt_unrealized = "Potential bad debt, monitor closely.",
  incorrect_loan_exchange_rate = "Loan rate error, verify terms.",
  incorrect_collateral_exchange_rate = "Collateral rate error, double-check values.",
  unrecognized_oracle_feed = "Oracle feed unknown, pricing reliability in question.",
}
