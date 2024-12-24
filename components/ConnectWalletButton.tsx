// components/ConnectWalletButton.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import useIsClient from '@/hooks/useIsClient'
// import { client } from '@/app/client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { Check, Copy, LogOut, X } from 'lucide-react'
import { BodyText, HeadingText } from './ui/typography'
import { copyToClipboard } from '@/lib/utils'
// import {
//     arbitrum,
//     base,
//     mainnet,
//     polygon,
//     scroll,
//     optimism,
//     gnosis,
// } from 'thirdweb/chains'

// import { createThirdwebClient, defineChain, getContract } from 'thirdweb'
// import { viemAdapter } from 'thirdweb/adapters/viem'
// import {
//     useSetActiveWallet,
//     PayEmbed,
//     ConnectButton,
//     TransactionButton,
//     useActiveWallet,
//     MediaRenderer,
//     useReadContract,
//     lightTheme,
// } from 'thirdweb/react'
// import { createWallet, createWalletAdapter } from 'thirdweb/wallets'
// import { claimTo, getNFT } from 'thirdweb/extensions/erc1155'
import {
    useAccount,
    useConnect,
    useDisconnect,
    useSwitchChain,
    useWalletClient,
} from 'wagmi'
import { ConnectKitButton } from 'connectkit'

export default function ConnectWalletButton() {
    const { isClient } = useIsClient()

    const { address: walletAddress } = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnectAsync } = useDisconnect()
    // This is how to set a wagmi account in the thirdweb context to use with all the thirdweb components including Pay
    // const { data: walletClient } = useWalletClient()
    // const { switchChainAsync } = useSwitchChain()
    // const setActiveWallet = useSetActiveWallet()

    // useEffect(() => {
    //     const setActive = async () => {
    //         if (walletClient) {
    //             const adaptedAccount = viemAdapter.walletClient.fromViem({
    //                 walletClient: walletClient as any, // accounts for wagmi/viem version mismatches
    //             });
    //             const w = createWalletAdapter({
    //                 adaptedAccount,
    //                 chain: defineChain(await walletClient.getChainId()),
    //                 client,
    //                 onDisconnect: async () => {
    //                     await disconnectAsync();
    //                 },
    //                 switchChain: async (chain) => {
    //                     await switchChainAsync({ chainId: chain.id as any });
    //                 },
    //             });
    //             setActiveWallet(w);
    //         }
    //     };
    //     setActive();
    // }, [walletClient, disconnectAsync, switchChainAsync, setActiveWallet]);

    // handle disconnecting from wagmi
    // const thirdwebWallet = useActiveWallet();
    // useEffect(() => {
    //     const disconnectIfNeeded = async () => {
    //         if (thirdwebWallet && wagmiAccount.status === "disconnected") {
    //             await thirdwebWallet.disconnect();
    //         }
    //     };
    //     disconnectIfNeeded();
    // }, [wagmiAccount, thirdwebWallet]);

    // useEffect(() => {
    //     setOpenWalletsModal(false);
    // }, [activeWallet]);

    // const handleConnect = () => {
    //     setOpenWalletsModal(true);
    // };

    // const handleOpenAccountInfo = () => {
    //     setOpenAccountInfoModal(true);
    // }

    // const handleDisconnect = () => {
    //     if (activeWallet) {
    //         disconnect(activeWallet);
    //         setOpenAccountInfoModal(false);
    //     }
    // }

    const displayText = walletAddress
        ? `${walletAddress?.slice(0, 5)}...${walletAddress?.slice(-5)}`
        : "Connect Wallet";

    // const wallets = [
    //     createWallet('io.metamask'),
    //     createWallet('com.okex.wallet'),
    //     createWallet('com.coinbase.wallet'),
    //     createWallet('me.rainbow'),
    // ]

    // const metis = defineChain(1088)
    // const bsc = defineChain(56)
    // const avalanche = defineChain(43114)

    return (
        <>
            {/* {!isClient && <Skeleton className='w-[100px] md:w-[120px] h-[40px]' />}
            {isClient && isConnecting && (
                <Button
                    variant="default"
                    size="lg"
                    className="rounded-[12px] py-2 capitalize"
                    disabled
                >
                    Connecting...
                </Button>
            )}
            {isClient && !isConnecting && (
                <Button
                    variant={walletAddress ? "default" : "primary"}
                    size="lg"
                    className="rounded-[12px] py-2 capitalize"
                    onClick={walletAddress ? handleOpenAccountInfo : handleConnect}
                    disabled={isConnecting}
                >
                    {displayText}
                </Button>
            )}
            <Wallets
                open={openWalletsModal}
                handleClose={() => setOpenWalletsModal(false)}
            />
            <AccountInfo
                open={openAccountInfoModal}
                handleClose={() => setOpenAccountInfoModal(false)}
                walletAddress={walletAddress || ''}
                handleDisconnect={handleDisconnect}
                copySuccess={copySuccess}
                handleCopy={handleCopy}
            /> */}
            {/* md:max-w-[165px] */}
            {/* <div className="rounded-4 overflow-hidden max-h-[40px] w-full">
                <ConnectButton
                    client={client}
                    chains={[
                        mainnet,
                        arbitrum,
                        polygon,
                        base,
                        scroll,
                        optimism,
                        gnosis,
                        metis,
                        bsc,
                        avalanche,
                    ]}
                    theme={lightTheme({
                        colors: {
                            modalBg: '#fff',
                            primaryButtonBg: '#f65700',
                            borderColor: '#F0F1F2',
                        },
                    })}
                    connectButton={{
                        label: 'Connect Wallet',
                        className: 'connect-wallet-button',
                    }}
                    connectModal={{
                        title: 'Select Wallet',
                        // titleIcon: "https://example.com/logo.png",
                        size: 'compact',
                    }}
                    wallets={wallets}
                />
            </div> */}
            {/* <ConnectKitButton theme="soft" /> */}
            {/* <ConnectKitButton.Custom>
                {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
                    return (
                        <Button
                            onClick={show}
                            variant={walletAddress ? "default" : "primary"}
                            size="lg"
                            className={`rounded-[12px] py-2 capitalize font-medium ${isConnected ? "bg-white text-black" : "bg-primary text-white"}`}
                        >
                            {displayText}
                        </Button>
                    );
                }}
            </ConnectKitButton.Custom> */}
            <appkit-button />
        </>
    )
}

// function Wallets({ open, handleClose }: { open: boolean, handleClose: () => void }) {
//     const { width: screenWidth } = useDimensions();
//     const wallets = [
//         createWallet("io.metamask"),
//         createWallet("com.coinbase.wallet"),
//         createWallet("me.rainbow"),
//     ];

//     if (screenWidth >= 768) {
//         return (
//             <Dialog open={open} onOpenChange={handleClose}>
//                 <DialogContent className="w-fit px-6">
//                     <DialogHeader>
//                         <DialogTitle className="text-center">Select Wallet</DialogTitle>
//                     </DialogHeader>
//                     {/* Connect Embed */}
//                     <ConnectEmbed
//                         theme="light"
//                         client={client}
//                         wallets={wallets}
//                     />
//                 </DialogContent>
//             </Dialog>
//         )
//     }

//     return (
//         <Drawer open={open} onOpenChange={handleClose}>
//             <DrawerContent className="flex flex-col items-center justify-center">
//                 <DrawerHeader>
//                     <DrawerTitle>Select Wallet</DrawerTitle>
//                 </DrawerHeader>
//                 {/* Connect Embed */}
//                 <ConnectEmbed
//                     theme="light"
//                     client={client}
//                     wallets={wallets}
//                 />
//                 {/* Cancel Button */}
//                 <DrawerClose asChild>
//                     <Button variant="default" size={'xl'} className="w-full py-4 border-0">
//                         Cancel
//                     </Button>
//                 </DrawerClose>
//             </DrawerContent>
//         </Drawer>

//     )
// }

// function AccountInfo({ open, handleClose, walletAddress, handleDisconnect, copySuccess, handleCopy }: { open: boolean, handleClose: () => void, walletAddress: string, handleDisconnect: () => void, copySuccess: boolean, handleCopy: () => void }) {
//     const { width: screenWidth } = useDimensions();
//     const formattedWalletAddress = walletAddress.slice(0, 5) + '...' + walletAddress.slice(-5);

//     if (screenWidth >= 768) {
//         return (
//             <Dialog open={open} onOpenChange={handleClose}>
//                 <DialogContent className="w-fit px-[50px]">
//                     {/* Account info */}
//                     <div className="flex flex-col items-center justify-center gap-4">
//                         <div className="flex items-center justify-between gap-3 rounded-6 py-4 px-6 ring-[1px] ring-gray-400 font-medium my-5">
//                             <BodyText level="body1" className="text-gray-800 font-medium">
//                                 {formattedWalletAddress}
//                             </BodyText>
//                             {!copySuccess && <Copy strokeWidth={1.75} className="cursor-pointer w-5 h-5 text-gray-600" onClick={handleCopy} />}
//                             {copySuccess && <Check className="w-5 h-5 text-green-600" />}
//                         </div>
//                         <Button variant="outline" size={'lg'} className="w-full md:w-fit px-4 py-2 rounded-6 border-gray-400 font-medium" onClick={handleDisconnect}>
//                             <LogOut className="w-4 h-4 mr-2 text-gray-600" />
//                             Disconnect
//                         </Button>
//                     </div>
//                 </DialogContent>
//             </Dialog>
//         )
//     }

//     return (
//         <Drawer open={open} onOpenChange={handleClose}>
//             <DrawerContent>
//                 {/* Account info */}
//                 <div className="flex flex-col items-center justify-center gap-4">
//                     <div className="flex items-center justify-between gap-3 rounded-6 py-4 px-6 ring-[1px] ring-gray-400 font-medium my-5">
//                         <BodyText level="body1" className="text-gray-800 font-medium">
//                             {formattedWalletAddress}
//                         </BodyText>
//                         {!copySuccess && <Copy strokeWidth={1.75} className="cursor-pointer w-5 h-5 text-gray-600" onClick={handleCopy} />}
//                         {copySuccess && <Check className="w-5 h-5 text-green-600" />}
//                     </div>
//                     <Button variant="outline" size={'lg'} className="w-full md:w-fit md:px-4 py-4 md:py-2 md:rounded-6 border-gray-400 font-medium" onClick={handleDisconnect}>
//                         <LogOut className="w-4 h-4 mr-2 text-gray-600" />
//                         Disconnect
//                     </Button>
//                 </div>
//             </DrawerContent>
//         </Drawer>

//     )
// }
