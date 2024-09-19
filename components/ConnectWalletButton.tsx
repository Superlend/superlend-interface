"use client"
import React, { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from './ui/button';

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
    const [isClient, setIsClient] = useState(false)
    const { open: openAuthModal, close: closeAuthModal } = useAppKit();
    const { address, isConnecting, isDisconnected } = useAccount();

    useEffect(() => {
        setIsClient(true)
    }, [])

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
                    className="rounded-[12px] py-2"
                    onClick={onConnect}
                >
                    {isDisconnected && "Connect wallet"}
                    {address && `${address.slice(0, 5)}...${address.slice(address.length - 5)}`}
                </Button>
            )}
        </>
    )
}
