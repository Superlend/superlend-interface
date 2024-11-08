"use client"
import React, { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from './ui/button';
import useIsClient from '@/hooks/useIsClient';

type TProps = {
    // isConnecting: boolean;
    // isDisconnected: boolean;
    // address: `0x${string}` | undefined;
    // onConnect: () => void;
}

export default function ConnectWalletButton(
    //     {
    //     isConnecting,
    //     isDisconnected,
    //     address,
    //     onConnect,
    // }: TProps
) {
    const { isClient } = useIsClient();
    const { open: openAuthModal, close: closeAuthModal } = useAppKit();
    const { address, isConnecting, isDisconnected } = useAccount();

    function onConnect() {
        openAuthModal();
    }

    return (
        <>
            {!isClient && <Skeleton className='w-[120px] h-[40px]' />}
            {isClient && isConnecting && <Skeleton className='w-[120px] h-[40px]' />}
            {isClient && !isConnecting && (
                <Button
                    variant={address ? "default" : "primary"}
                    size={"lg"}
                    className="rounded-[12px] py-2 capitalize"
                    onClick={onConnect}
                >
                    {isDisconnected && "Connect Wallet"}
                    {address && `${address.slice(0, 5)}...${address.slice(address.length - 5)}`}
                </Button>
            )}
        </>
    )
}
