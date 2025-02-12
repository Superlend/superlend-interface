import { TChain } from '@/types/chain'
import { request } from './request'

export async function getChainsData() {
    return request<TChain[]>({
        method: 'GET',
        path: '/chains',
    })
}
