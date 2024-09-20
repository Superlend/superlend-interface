// import { IAssetData } from "@interfaces/IAssetData";
import { request } from "./";


export async function getTokensData() {
  return request<any[]>({
    method: "GET",
    path: "/tokens",
    query: {
      chain_id: "1",
      // token: "BTC,ETH"
    }
  });
}
