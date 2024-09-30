import { TGetPlatformHistoryParams, TPlatform } from "@/types";
import { request } from "./request";

export async function getPlatformHistoryData({
  platform_id,
  token,
  period,
}: TGetPlatformHistoryParams) {
  return request<any[]>({
    method: "GET",
    path: `/platform/history`,
    query: {
      platform_id,
      token,
      period,
    },
  });
}
