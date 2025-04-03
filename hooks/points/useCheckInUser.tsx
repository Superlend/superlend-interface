'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestPoints } from '@/queries/request'

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

      const responseData = await requestPoints<TCheckInResponse>({
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

      return responseData
    },
    onSuccess: () => {
      // Invalidate user details query to refresh data after successful check-in
      queryClient.invalidateQueries({ queryKey: ['user-details'] })
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