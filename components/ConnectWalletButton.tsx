"use client"
import React, { useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from './ui/button';
import useIsClient from '@/hooks/useIsClient';
import { useWalletConnection } from '@/hooks/useWalletConnection';

export default function ConnectWalletButton() {
    const { isClient } = useIsClient();
    const { 
      address, 
      isConnecting, 
      isDisconnected, 
      handleConnect,
      connectionStatus 
    } = useWalletConnection();

    // Debug logging
    useEffect(() => {
      console.log('Connection status:', connectionStatus);
      console.log('Address:', address);
      console.log('Is connecting:', isConnecting);
      console.log('Is disconnected:', isDisconnected);
    }, [connectionStatus, address, isConnecting, isDisconnected]);

    const displayAddress = address 
      ? `${address.slice(0, 5)}...${address.slice(-5)}`
      : "Connect Wallet";

    return (
        <>
            {!isClient && <Skeleton className='w-[120px] h-[40px]' />}
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