import { request } from ".";

export async function getChainsData() {
  return request<any[]>({
    method: "GET",
    path: "/chains",
  });
}
