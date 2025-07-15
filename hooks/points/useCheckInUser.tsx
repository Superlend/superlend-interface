'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthRequest } from '@/hooks/useAuthRequest'

export type TCheckInUserParams = {
  user_address: string
  authToken: string
}

export type TCheckInResponse = {
  user_address: string
  total_points: number
  referral_code: string
  starting_epoch: number
  current_epoch: number
  last_check_in_timestamp: string
}

export default function useCheckInUser() {
  const queryClient = useQueryClient()
  const { makeRequest } = useAuthRequest()

  const { mutate, isPending, isError, isSuccess, data, error } = useMutation<
    TCheckInResponse,
    Error,
    TCheckInUserParams
  >({
    mutationFn: async (params: TCheckInUserParams) => {
      const { user_address, authToken } = params

      const headers: Record<string, string> = {}
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      return await makeRequest<TCheckInResponse>({
        method: 'POST',
        path: '/user/check-in',
        body: {
          user_address,
        },
        query: {
          wallet: user_address,
        },
        headers,
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate user details queries for the specific user and auth token
      queryClient.invalidateQueries({ 
        queryKey: ['user-details', variables.user_address, variables.authToken] 
      })
      // Also invalidate all user-details queries as fallback
      queryClient.invalidateQueries({ 
        queryKey: ['user-details'] 
      })
    },
  })

  return {
    checkIn: mutate,
    isPending,
    isError,
    isSuccess,
    data,
    error,
  }
} 