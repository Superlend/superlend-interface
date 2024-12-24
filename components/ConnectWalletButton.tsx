// components/ConnectWalletButton.tsx
'use client'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import useIsClient from '@/hooks/useIsClient'
import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react'

export default function ConnectWalletButton() {
    const { isClient } = useIsClient()
    const { address: walletAddress, isConnected, caipAddress, status } = useAppKitAccount()
    const { open, close } = useAppKit()
    const { open: isOpen, selectedNetworkId } = useAppKitState()

    const displayText = walletAddress
        ? `${walletAddress?.slice(0, 5)}...${walletAddress?.slice(-5)}`
        : "Connect Wallet";

    const isConnecting = status === 'connecting';

    function handleConnect() {
        if (isOpen) {
            close()
        } else {
            open()
        }
    }

    return (
        <>
            {/* This is a workaround to show the skeleton on the first render */}
            {!isClient &&
                <div className='w-[100px] md:w-[120px] h-[40px] rounded-4 overflow-hidden'>
                    <Skeleton className='h-full w-full' />
                </div>
            }
            {/* This is the actual button */}
            {isClient && (
                <Button
                    variant={walletAddress ? "default" : "primary"}
                    size="lg"
                    className="rounded-4 py-2 capitalize w-full"
                    onClick={handleConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Connecting...' : displayText}
                </Button>
            )}
        </>
    )
}
