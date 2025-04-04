'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestPoints } from '@/queries/request'
import { TAddress } from '@/types'

export type TEventType = 'SUPERLEND_AGGREGATOR_TRANSACTION'

export type TLogNewUserEventParams = {
  user_address: TAddress
  event_type: TEventType
  platform_type: string
  protocol_identifier: string
  event_data: string
  authToken: string
}

export type TLogNewUserEventResponse = {
  user_address: string
  total_points: number
  referral_code: string
  starting_epoch: number
  current_epoch: number
  last_check_in_timestamp: string
}

export default function useLogNewUserEvent() {
  const queryClient = useQueryClient()

  const { mutate, isPending, isError, isSuccess, data, error } = useMutation<
    TLogNewUserEventResponse,
    Error,
    TLogNewUserEventParams
  >({
    mutationFn: async (params: TLogNewUserEventParams) => {
      const { user_address, authToken, event_type, platform_type, protocol_identifier, event_data } = params

      const headers: Record<string, string> = {}
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const body: Record<string, any> = {
        user_address,
        event_type,
        platform_type,
        protocol_identifier,
        event_data,
      }

      try {
        const responseData = await requestPoints<TLogNewUserEventResponse>({
          method: 'POST',
          path: '/user/new_event',
          query: {
            wallet: user_address,
          },
          body,
          headers,
        })
        return responseData
      } catch (error) {
        console.error('New event logging error => ', error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate user details query to refresh data after logging an event
      queryClient.invalidateQueries({ queryKey: ['user-details'] })
    },
  })

  return {
    logUserEvent: mutate,
    isPending,
    isError,
    isSuccess,
    data,
    error,
  }
} 