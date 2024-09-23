import { request } from "./request";
import { TLendOpportunitiesParams, TOpportunity } from "@/types";

export async function getOpportunitiesData(
  params: TLendOpportunitiesParams
) {
  const {
    type,
    chain_ids = [],
    tokens = [],
    trend = true,
    limit = 10,
  } = params;

  return request<TOpportunity[]>({
    method: "POST",
    path: `/opportunities/${type}`,
    body: {
      chain_ids,
      tokens,
      trend,
      limit,
    },
  });
}
