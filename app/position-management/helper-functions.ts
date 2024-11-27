import {
  getLowestDisplayValue,
  hasLowestDisplayValuePrefix,
} from "@/lib/utils";
import { TPlatform, TPlatformAsset, TChain } from "@/types";

export function getTokenDetails({
  tokenAddress,
  platformData,
}: {
  tokenAddress: string;
  platformData: TPlatform;
}) {
  const fallbackAsset = {
    address: tokenAddress,
    symbol: "",
    name: "",
    logo: "",
    decimals: 0,
    price_usd: 0,
    warnings: [],
  };
  const asset: TPlatformAsset["token"] | undefined =
    platformData?.assets?.find(
      (asset: TPlatformAsset) =>
        asset?.token?.address?.toLowerCase() === tokenAddress?.toLowerCase()
    )?.token || fallbackAsset;

  return {
    address: asset?.address || "",
    symbol: asset?.symbol || "",
    name: asset?.name || "",
    logo: asset?.logo || "",
  };
}

export function getChainDetails({
  allChainsData,
  chainIdToMatch,
}: {
  allChainsData: TChain[];
  chainIdToMatch: string | number;
}) {
  return allChainsData?.find(
    (chain: any) => Number(chain.chain_id) === Number(chainIdToMatch)
  );
}

export function getStatDisplayValue(
  value: string | number,
  hasPrefix: boolean = true
) {
  return `${
    hasPrefix ? hasLowestDisplayValuePrefix(Number(value)) : ""
  }${getLowestDisplayValue(Number(value))}`;
}

// Function to calculate estimated earnings
/**
 * @param supplyAPY - Supply APY from API
 * @param borrowAPY - Borrow APY from API
 * @param amountSuppliedInUsd - Amount supplied in USD from user
 * @param amountBorrowedInUsd - Amount borrowed in USD from user
 * @param duration - Duration in months from user
 * @returns - Estimated earnings
 */

/**
 * Calculation logic:
 * InterestGain = (Supply amount in USD * Supply apy * duration in months)/1200
 * InterestLoss = (Borrow amount in USD * Borrow apy * duration in months)/1200
 * Net estimated earnings = InterestGain - InterestLoss
 */
export function getEstimatedEarnings({
  supplyAPY,
  borrowAPY,
  amountSupplied,
  amountBorrowed,
  duration,
}: {
  supplyAPY: number;
  borrowAPY: number;
  amountSupplied: number;
  amountBorrowed: number;
  duration: number; // In months
}) {
  const interestGain = (amountSupplied * supplyAPY * duration) / 1200;
  const interestLoss = (amountBorrowed * borrowAPY * duration) / 1200;
  return {
    interestGain,
    interestLoss,
    netEstimatedEarnings: interestGain - interestLoss,
  };
}
