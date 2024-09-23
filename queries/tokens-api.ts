// import { IAssetData } from "@interfaces/IAssetData";
import { TToken } from "@/types";
import { request } from "./request";

export async function getTokensData() {
  return request<TToken[]>({
    method: "GET",
    path: "/tokens",
    query: {
      chain_id: "1",
      // token: "BTC,ETH"
    },
  });
}
