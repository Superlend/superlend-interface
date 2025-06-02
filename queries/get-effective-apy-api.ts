import { requestFundsIndexer } from './request'

export async function getEffectiveApy({
    vault_address,
    chain_id
}: {
    vault_address: `0x${string}`
    chain_id: number
}) {
    return requestFundsIndexer<any>({
        method: 'GET',
        path: `vaults/state/${vault_address}/${chain_id}`,
    })
}
