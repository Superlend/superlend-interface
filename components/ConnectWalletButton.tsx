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

    useEffect(() => {
        setOpenWalletsModal(false);
    }, [activeWallet]);

    const handleConnect = () => {
        setOpenWalletsModal(true);
    };

    const handleDisconnect = () => {
        if (activeWallet) {
            disconnect(activeWallet);
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
                    onClick={walletAddress ? handleDisconnect : handleConnect}
                    disabled={isConnecting}
                >
                    {displayText}
                </Button>
            )}
            <Wallets open={openWalletsModal} handleClose={() => setOpenWalletsModal(false)} /> */}
            <div className="rounded-4 overflow-hidden max-h-[40px] w-fit max-w-[165px]">
                <ConnectButton
                    client={client}
                    theme={lightTheme({
                        colors: {
                            modalBg: "#fff",
                            primaryButtonBg: "#f65700",
                            borderColor: "#fff",
                        },
                    })}
                    connectButton={{
                        label: "Connect Wallet",
                        className: "connect-wallet-button",
                    }}
                    connectModal={{
                        title: "Connect Wallet",
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
    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
    ];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-fit">
                <DialogHeader>
                    <DialogTitle className="text-center">Connect Wallet</DialogTitle>
                    {/* <DialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </DialogDescription> */}
                </DialogHeader>

                <ConnectEmbed
                    theme="light"
                    client={client}
                    wallets={wallets}
                />
            </DialogContent>
        </Dialog>
    )
}
