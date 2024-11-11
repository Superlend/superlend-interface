// components/ConnectWalletButton.tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from './ui/button';
import useIsClient from '@/hooks/useIsClient';

import { ConnectButton, ConnectEmbed, lightTheme, useActiveAccount, useConnect } from "thirdweb/react";
import { client } from "@/app/client";
import { createWallet, injectedProvider } from "thirdweb/wallets";
import { useDisconnect, useActiveWallet } from "thirdweb/react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import useDimensions from '@/hooks/useDimensions';
import { Check, Copy, LogOut, X } from 'lucide-react';
import { BodyText, HeadingText } from './ui/typography';
import { copyToClipboard } from '@/lib/utils';



export default function ConnectWalletButton() {
    const { isClient } = useIsClient();
    // const { open: openAuthModal } = useAppKit();
    // const { address, isConnecting } = useAccount();
    const { connect, isConnecting, error } = useConnect();
    const { disconnect } = useDisconnect();
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const walletAddress = activeAccount?.address;
    const [openWalletsModal, setOpenWalletsModal] = useState(false);
    const [openAccountInfoModal, setOpenAccountInfoModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(walletAddress || '');
        setCopySuccess(success);
        if (success) {
            setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
        }
    };

    useEffect(() => {
        setOpenWalletsModal(false);
    }, [activeWallet]);

    const handleConnect = () => {
        setOpenWalletsModal(true);
    };

    const handleOpenAccountInfo = () => {
        setOpenAccountInfoModal(true);
    }

    const handleDisconnect = () => {
        if (activeWallet) {
            disconnect(activeWallet);
            setOpenAccountInfoModal(false);
        }
    }

    const displayText = walletAddress
        ? `${walletAddress?.slice(0, 5)}...${walletAddress?.slice(-5)}`
        : "Connect Wallet";

    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
    ];

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
            <div className="rounded-4 overflow-hidden max-h-[40px] w-full md:max-w-[165px]">
                <ConnectButton
                    client={client}
                    theme={lightTheme({
                        colors: {
                            modalBg: "#fff",
                            primaryButtonBg: "#f65700",
                            borderColor: "#F0F1F2",
                        },
                    })}
                    connectButton={{
                        label: "Connect Wallet",
                        className: "connect-wallet-button",
                    }}
                    connectModal={{
                        title: "Select Wallet",
                        // titleIcon: "https://example.com/logo.png",
                        size: "compact",
                    }}
                    wallets={wallets}
                />
            </div>
        </>
    );
}

function Wallets({ open, handleClose }: { open: boolean, handleClose: () => void }) {
    const { width: screenWidth } = useDimensions();
    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
    ];

    if (screenWidth >= 768) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-fit px-6">
                    <DialogHeader>
                        <DialogTitle className="text-center">Select Wallet</DialogTitle>
                    </DialogHeader>
                    {/* Connect Embed */}
                    <ConnectEmbed
                        theme="light"
                        client={client}
                        wallets={wallets}
                    />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={handleClose}>
            <DrawerContent className="flex flex-col items-center justify-center">
                <DrawerHeader>
                    <DrawerTitle>Select Wallet</DrawerTitle>
                </DrawerHeader>
                {/* Connect Embed */}
                <ConnectEmbed
                    theme="light"
                    client={client}
                    wallets={wallets}
                />
                {/* Cancel Button */}
                <DrawerClose asChild>
                    <Button variant="default" size={'xl'} className="w-full py-4 border-0">
                        Cancel
                    </Button>
                </DrawerClose>
            </DrawerContent>
        </Drawer>

    )
}

function AccountInfo({ open, handleClose, walletAddress, handleDisconnect, copySuccess, handleCopy }: { open: boolean, handleClose: () => void, walletAddress: string, handleDisconnect: () => void, copySuccess: boolean, handleCopy: () => void }) {
    const { width: screenWidth } = useDimensions();
    const formattedWalletAddress = walletAddress.slice(0, 5) + '...' + walletAddress.slice(-5);

    if (screenWidth >= 768) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-fit px-[50px]">
                    {/* Account info */}
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center justify-between gap-3 rounded-6 py-4 px-6 ring-[1px] ring-gray-400 font-medium my-5">
                            <BodyText level="body1" className="text-gray-800 font-medium">
                                {formattedWalletAddress}
                            </BodyText>
                            {!copySuccess && <Copy strokeWidth={1.75} className="cursor-pointer w-5 h-5 text-gray-600" onClick={handleCopy} />}
                            {copySuccess && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                        <Button variant="outline" size={'lg'} className="w-full md:w-fit px-4 py-2 rounded-6 border-gray-400 font-medium" onClick={handleDisconnect}>
                            <LogOut className="w-4 h-4 mr-2 text-gray-600" />
                            Disconnect
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={handleClose}>
            <DrawerContent>
                {/* Account info */}
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center justify-between gap-3 rounded-6 py-4 px-6 ring-[1px] ring-gray-400 font-medium my-5">
                        <BodyText level="body1" className="text-gray-800 font-medium">
                            {formattedWalletAddress}
                        </BodyText>
                        {!copySuccess && <Copy strokeWidth={1.75} className="cursor-pointer w-5 h-5 text-gray-600" onClick={handleCopy} />}
                        {copySuccess && <Check className="w-5 h-5 text-green-600" />}
                    </div>
                    <Button variant="outline" size={'lg'} className="w-full md:w-fit md:px-4 py-4 md:py-2 md:rounded-6 border-gray-400 font-medium" onClick={handleDisconnect}>
                        <LogOut className="w-4 h-4 mr-2 text-gray-600" />
                        Disconnect
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>

    )
}