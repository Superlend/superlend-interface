'use client'

import { useAuth } from '@/context/auth-provider'
import { requestPoints } from '@/queries/request'
import { useState } from 'react'

type RequestOptions = {
  method: 'GET' | 'POST'
  path: string
  body?: any
  query?: Record<string, string>
  headers?: Record<string, string>
}

export function useAuthRequest() {
  const { getAccessTokenFromPrivy } = useAuth()
  const [isRefreshingToken, setIsRefreshingToken] = useState(false)

  const makeRequest = async <T,>(options: RequestOptions): Promise<T> => {
    try {
      const response = await requestPoints<T>(options)
      return response
    } catch (error: any) {
      // Check if it's a 401 error and we're not already refreshing the token
      if (error?.response?.status === 401 && !isRefreshingToken) {
        try {
          setIsRefreshingToken(true)
          // Get new token
          const newToken = await getAccessTokenFromPrivy()
          
          if (!newToken) {
            throw new Error('Failed to refresh token')
          }

          // Retry the original request with new token
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          }

          return await requestPoints<T>(retryOptions)
        } finally {
          setIsRefreshingToken(false)
        }
      }
      // If it's not a 401 or we're already refreshing, rethrow the error
      throw error
    }
  }

  return { makeRequest }
} 