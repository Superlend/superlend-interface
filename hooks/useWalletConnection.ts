import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'

export const useWalletConnection = () => {
    // const { address: walletAddress } = useAccount()
    const { user } = usePrivy()
    const isWalletConnected = !!user
    const walletAddress = user?.wallet?.address
    const { wallets } = useWallets()
    const wallet = wallets.find(
        (wallet: any) => wallet.address === walletAddress
    )

    async function handleSwitchChain(chain_id: number) {
        await wallet?.switchChain(Number(chain_id))
    }

    return {
        user,
        wallet,
        walletAddress,
        isWalletConnected,
        handleSwitchChain,
    }
}
