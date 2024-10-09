// import { IAssetData } from "@interfaces/IAssetData";
import { TGetTokensParams, TToken } from "@/types";
import { request } from "./request";

export async function getTokensData(params: TGetTokensParams = {}) {
  const { chain_id = [], token = [] } = params;

  return request<TToken[]>({
    method: "GET",
    path: "/tokens",
    query: {
      chain_id,
      token,
    },
  });
}
