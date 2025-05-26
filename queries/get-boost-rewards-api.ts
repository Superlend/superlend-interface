import { requestFundsRewards } from './request'

export interface BoostRewardResponse {
  token: {
    name: string
    decimals: number
    symbol: string
    address: string
  },
  boost_apy: number
}

export interface BoostRewardParams {
  vaultAddress: string
  chainId: number
}

export async function getBoostRewards({
  vaultAddress,
  chainId,
}: BoostRewardParams) {
  return requestFundsRewards<BoostRewardResponse[]>({
    method: 'GET',
    path: `/reward/native-boost/${vaultAddress}/${chainId}`,
  })
} 