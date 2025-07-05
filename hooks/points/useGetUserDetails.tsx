'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthRequest } from '@/hooks/useAuthRequest'

export type TUserDetails = {
  user_address: string
  total_points: number
  referral_code: string
  starting_epoch: number
  current_epoch: number
  last_check_in_timestamp: string
}

export type TGetUserDetailsParams = {
  user_address?: string
  authToken?: string
}

export default function useGetUserDetails(params: TGetUserDetailsParams) {
  const { user_address, authToken } = params
  const { makeRequest } = useAuthRequest()

  const { data, isLoading, isError, refetch } = useQuery<TUserDetails, Error>({
    queryKey: ['user-details', user_address, authToken],
    queryFn: async () => {
      try {
        const headers: Record<string, string> = {}

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`
        }

        return await makeRequest<TUserDetails>({
          method: 'GET',
          path: '/user',
          query: {
            user_address: user_address!,
            wallet: user_address!,
          },
          headers,
        })
      } catch (error) {
        throw new Error('There was an error while fetching user details')
      }
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!user_address && !!authToken,
  })

  return {
    data: data || {
      current_epoch: 0,
      last_check_in_timestamp: '',
      referral_code: '',
      total_points: 0,
      user_address: user_address || '',
    },
    isLoading,
    isError,
    refetch,
  }
}
