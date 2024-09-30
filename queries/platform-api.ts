import { TGetPlatformParams, TPlatform } from "@/types";
import { request } from "./request";

export async function getPlatformData({
  chain_id,
  platform_id,
}: TGetPlatformParams) {
  return request<TPlatform[]>({
    method: "GET",
    path: `/platform`,
    query: {
      chain_id,
      platform_id,
    },
  });
}
