'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ArrowRightIcon, HelpCircle, CheckCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import toast from 'react-hot-toast'
import { BodyText } from './ui/typography'
import useCheckInUser from '@/hooks/points/useCheckInUser'
import useGetUserDetails, { TUserDetails } from '@/hooks/points/useGetUserDetails'

export default function CheckInButton() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { logEvent } = useAnalytics()
  
  // Assuming auth token is stored in localStorage or somewhere in your auth system
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''
  
  // Get user details to check last check-in timestamp
  const { 
    data: userData,
    isLoading: isUserDataLoading 
  } = useGetUserDetails({ 
    user_address: walletAddress || '',
    authToken: authToken || ''
  })
  
  // Use the check-in hook
  const { 
    checkIn, 
    isPending, 
    isSuccess, 
    data: checkInData 
  } = useCheckInUser()

  // Determine if user has already checked in today based on timestamp
  const isCheckedIn = (() => {
    // Need to cast userData to TUserDetails since the default fallback object uses old structure
    const userDetails = userData as TUserDetails;
    if (!userDetails?.last_check_in_timestamp) return false;
    
    const lastCheckInDate = new Date(userDetails.last_check_in_timestamp).toDateString();
    const today = new Date().toDateString();
    return lastCheckInDate === today;
  })()

  const handleCheckIn = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to check in')
      return
    }
    
    if (!authToken) {
      toast.error('Authentication required. Please login again.')
      return
    }

    try {
      checkIn({ 
        user_address: walletAddress || '', 
        authToken 
      })
      
      logEvent('daily_checkin_success', { wallet_address: walletAddress })
    } catch (error) {
      console.log(error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in. Please try again later.'
      toast.error(errorMessage)
      console.error('Check-in error:', error)
    }
  }

  // Show success toast when check-in is successful
  useEffect(() => {
    if (isSuccess && checkInData) {
      toast.success(`🎉 Checked in for the day! +1 point`)
    }
  }, [isSuccess, checkInData])

  if (!isWalletConnected) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCheckIn}
            // disabled={isCheckedIn || isPending || isUserDataLoading}
            variant={isCheckedIn ? "outline" : "default"}
            size="sm"
            className={`h-8 px-3 flex items-center gap-1 ${isCheckedIn ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            {isPending ? (
              <span className="flex items-center">
                <span className="animate-spin mr-1">⟳</span> Checking
              </span>
            ) : (
              <span className="flex items-center gap-1">
                {isCheckedIn && <CheckCircle className="w-3.5 h-3.5" />}
                {isCheckedIn ? <span>Checked In</span> : <span>Daily Check-In</span>}
                {!isCheckedIn && <ArrowRightIcon className="w-3 h-3" />}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <BodyText level="body2" weight="medium">Check in daily to earn points!</BodyText>
          <BodyText level="body2" className="text-gray-500">Earn points each day you check in</BodyText>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 