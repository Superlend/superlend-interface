import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
    throw new Error('Project ID is not defined')
}

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    networks: [
        {
            id: "eip155:128123" as const,
            chainId: 128123,
            chainNamespace: "eip155",
            name: "Etherlink Testnet",
            currency: "ETL",
            explorerUrl: "https://testnet.explorer.etherlink.com",
            rpcUrl: "https://node.ghostnet.etherlink.com",
        }
    ], // Add the required networks property
    projectId: projectId // Add the required projectId property
})

export const config = wagmiAdapter.wagmiConfig