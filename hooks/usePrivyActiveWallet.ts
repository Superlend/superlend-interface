'use client'

import { useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'

/**
 * Keeps Wagmi's active wallet in-sync with the wallet
 * the user has currently selected in the Privy modal.
 */
export function usePrivyActiveWallet() {
  const { ready, wallets } = useWallets()
  const { setActiveWallet } = useSetActiveWallet()

  useEffect(() => {
    if (!ready || wallets.length === 0) return
    // Pick the first connected wallet as the active one
    setActiveWallet(wallets[0])
  }, [ready, wallets, setActiveWallet])
} 