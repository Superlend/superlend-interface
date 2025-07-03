'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletConnection } from '@/hooks/useWalletConnection'

interface AuthContextType {
  accessToken: string | null
  getAccessTokenFromPrivy: () => Promise<string | null>
  isLoadingToken: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, ready, authenticated, user } = usePrivy()
  const { walletAddress, isWalletConnected } = useWalletConnection()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)

  const getAccessTokenFromPrivy = useCallback(async (): Promise<string | null> => {
    // Don't attempt to get token if not ready or not authenticated
    if (!ready || !authenticated || !user) {
      return null
    }

    try {
      setIsLoadingToken(true)
      const token = await getAccessToken()
      setAccessToken(token)
      return token
    } catch (error) {
      console.error('Error getting access token from Privy:', error)
      setAccessToken(null)
      return null
    } finally {
      setIsLoadingToken(false)
    }
  }, [getAccessToken, ready, authenticated, user])

  // Fetch token when wallet connects and Privy is ready
  useEffect(() => {
    if (isWalletConnected && ready && authenticated && user && walletAddress) {
      getAccessTokenFromPrivy()
    } else if (!isWalletConnected || !authenticated) {
      // Clear token when wallet disconnects or user is not authenticated
      setAccessToken(null)
      setIsLoadingToken(false)
    }
  }, [isWalletConnected, walletAddress, ready, authenticated, user, getAccessTokenFromPrivy])

  return (
    <AuthContext.Provider value={{ accessToken, getAccessTokenFromPrivy, isLoadingToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
