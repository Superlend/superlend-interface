import { Period, PeriodDisplay } from "./types/periodButtons";

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
    label: "LTV",
    value: "ltv",
  },
  {
    label: "Variable Borrow APR",
    value: "variableBorrowRate",
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
  "DAI",
  "CDAI",
  "SDAI",
  "CSDAI",
  "SUSDE",
  "CSUSDE",
  "USDC",
  "CUSDC",
  "USDC.E",
  "CUSDC.E",
  "USDE",
  "CUSDE",
  "USDT",
  "CUSDT",
];

export const SHEET_FORM_URL = "https://script.google.com/macros/s/AKfycbwdG0b3rOiiRL0UP0KwHSBZfwVYRyeDZrJfVKAAV7yoVPGglaRaIanX91S_yRIl0ZYw/exec"