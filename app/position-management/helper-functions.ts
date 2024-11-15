import { getLowestDisplayValue, hasLowestDisplayValuePrefix } from "@/lib/utils";
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
  const asset: TPlatformAsset["token"] | undefined = platformData?.assets?.find(
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

export function getStatDisplayValue(value: string | number, hasPrefix: boolean = true) {
  return `${hasPrefix ? hasLowestDisplayValuePrefix(Number(value)) : ""}${getLowestDisplayValue(Number(value))}`;
}

// Function to calculate estimated earnings
/**
* @param lendCollateral - Amount of collateral supplied
* @param borrowing - Amount of borrowing
* @param duration - Duration of investment
* @returns - Estimated earnings
*/

/** Calculation logic - 
Supply APY: 
𝑅𝑠 (as a decimal, e.g., 0.05 for 5%)

Borrow APY: 
𝑅𝑏 (as a decimal, e.g., 0.04 for 4%)

Amount supplied: 𝐴𝑠
Amount borrowed: 𝐴𝑏

supply token price: Price(S)
borrow token price: Price(B)

Duration of investment: 𝑇
T (in years; for shorter periods, express as a fraction, e.g., 0.5 for 6 months)

Net Returns = T×(As × Rs x Price(S) ​− Ab ​× Rb x Price(B))
*/
export function getEstimatedEarnings({
  supplyAPY,
  borrowAPY,
  amountSupplied,
  amountBorrowed,
  supplyTokenPrice,
  borrowTokenPrice,
  duration,
}: {
  supplyAPY: number;
  borrowAPY: number;
  amountSupplied: number;
  amountBorrowed: number;
  supplyTokenPrice: number;
  borrowTokenPrice: number;
  duration: number;
}) {
  return duration * (amountSupplied * supplyAPY * supplyTokenPrice - amountBorrowed * borrowAPY * borrowTokenPrice);
}
