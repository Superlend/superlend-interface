'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletConnection } from '@/hooks/useWalletConnection'

interface AuthContextType {
  accessToken: string | null
  getAccessTokenFromPrivy: () => Promise<string | null>
  isLoadingToken: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()
  const { walletAddress } = useWalletConnection()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)

  const getAccessTokenFromPrivy = async (): Promise<string | null> => {
    try {
      setIsLoadingToken(true)
      const token = await getAccessToken()
      setAccessToken(token)
      return token
    } catch (error) {
      console.error('Error getting access token from Privy:', error)
      return null
    } finally {
      setIsLoadingToken(false)
    }
  }

  useEffect(() => {
    getAccessTokenFromPrivy()
  }, [walletAddress])

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
