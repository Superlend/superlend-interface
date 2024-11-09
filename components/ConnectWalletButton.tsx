// components/ConnectWalletButton.tsx
"use client"
import React from 'react';
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from './ui/button';
import useIsClient from '@/hooks/useIsClient';

export default function ConnectWalletButton() {
    const { isClient } = useIsClient();
    const { open: openAuthModal } = useAppKit();
    const { address, isConnecting } = useAccount();

    const handleConnect = () => {
        openAuthModal();
    };

    const displayAddress = address 
        ? `${address.slice(0, 5)}...${address.slice(-5)}`
        : "Connect Wallet";

    return (
        <>
            {!isClient && <Skeleton className='w-[100px] md:w-[120px] h-[40px]' />}
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
                    variant={address ? "default" : "primary"}
                    size="lg"
                    className="rounded-[12px] py-2 capitalize"
                    onClick={handleConnect}
                    disabled={isConnecting}
                >
                    {displayAddress}
                </Button>
            )}
        </>
    );
}