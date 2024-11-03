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
  };
  const asset: TPlatformAsset["token"] =
    platformData?.assets?.find(
      (asset: TPlatformAsset) =>
        asset?.token?.address?.toLowerCase() === tokenAddress?.toLowerCase()
    )?.token || fallbackAsset;

  return {
    address: asset?.address || tokenAddress,
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
