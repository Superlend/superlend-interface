import { TGetPortfolioParams, TPortfolio } from "@/types/queries/portfolio";
import { request } from "./request";

export async function getPortfolioData({
  user_address,
  chain_id,
  platform_id,
  position_type,
}: TGetPortfolioParams) {
  return request<TPortfolio>({
    method: "GET",
    path: `/users/portfolio/${user_address}`,
    query: {
      chain_id: chain_id ?? [],
      platform_id: platform_id ?? [],
      position_type: position_type,
    },
  });
}
