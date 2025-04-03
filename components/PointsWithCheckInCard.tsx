'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { BodyText, HeadingText } from './ui/typography'
import { ArrowRightIcon, TrophyIcon, Clock, CheckCircle } from 'lucide-react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { formatDistanceToNow } from 'date-fns'
import { Button } from './ui/button'
import toast from 'react-hot-toast'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useAuth } from '@/context/auth-provider'
import useGetUserDetails from '@/hooks/points/useGetUserDetails'
import useCheckInUser from '@/hooks/points/useCheckInUser'
import InfoTooltip from './tooltips/InfoTooltip'
import Link from 'next/link'
import ImageWithDefault from './ImageWithDefault'

// Compact version of CheckInButton specifically for this component
function CompactCheckInButton() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { logEvent } = useAnalytics()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { accessToken } = useAuth()

  const {
    data: userDetails,
    isLoading: isUserDetailsLoading,
    isError: isUserDetailsError,
    refetch: refetchUserDetails
  } = useGetUserDetails({
    user_address: walletAddress,
    authToken: accessToken || undefined
  })

  const {
    checkIn,
    isPending: isCheckInPending,
    isSuccess: isCheckInSuccess,
    isError: isCheckInError,
    data: checkInData,
    error: checkInError
  } = useCheckInUser()

  // Update checked-in status based on user details
  useEffect(() => {
    if (userDetails && 'last_check_in_timestamp' in userDetails) {
      const lastCheckInDate = new Date(userDetails.last_check_in_timestamp).toDateString()
      const today = new Date().toDateString()
      setIsCheckedIn(lastCheckInDate === today)
    }
  }, [userDetails])

  // Handle check-in success
  useEffect(() => {
    if (isCheckInSuccess && checkInData) {
      setIsCheckedIn(true)
      logEvent('daily_checkin_success', { wallet_address: walletAddress })
      toast.success(`🎉 Checked in for the day! +1 point`)
    }
  }, [isCheckInSuccess, checkInData, walletAddress, logEvent])

  // Handle check-in error
  useEffect(() => {
    if (isCheckInError && checkInError) {
      toast.error('Failed to check in. Please try again later.')
      console.error('Check-in error:', checkInError)
    }
  }, [isCheckInError, checkInError])

  const handleCheckIn = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to check in')
      return
    }

    if (!accessToken) {
      toast.error('Authentication required. Please try again.')
      return
    }

    try {
      setIsLoading(true)
      checkIn({
        user_address: walletAddress,
        authToken: accessToken
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? checkInError?.message || error.message : 'Failed to check in. Please try again later.'
      toast.error(errorMessage)
      console.error('Check-in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <InfoTooltip
      label={
        <Button
          onClick={handleCheckIn}
          disabled={isCheckedIn || isLoading || isCheckInPending}
          variant={isCheckedIn ? "outline" : "default"}
          size="sm"
          className={`h-7 px-2 text-xs flex items-center gap-1 ${isCheckedIn ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' : 'bg-primary text-white hover:bg-primary/90'}`}
        >
          {isLoading || isCheckInPending ? (
            <span className="flex items-center">
              <span className="animate-spin mr-1">⟳</span> Checking in...
            </span>
          ) : (
            <>
              {isCheckedIn ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Checked</span>
                </>
              ) : (
                <>
                  <span>Check In</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </>
              )}
            </>
          )}
        </Button>
      }
      content={
        <>
          <BodyText level="body2" weight="medium">
            {isCheckedIn ? "You've already checked in today!" : "Check in daily to earn points!"}
          </BodyText>
          <BodyText level="body2" className="text-gray-500">Earn 1 point each day you check in</BodyText>
        </>
      }
    />
  )
}

export default function PointsWithCheckInCard() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { accessToken } = useAuth()

  const {
    data: userDetails,
    isLoading: isUserDetailsLoading,
    isError: isUserDetailsError,
  } = useGetUserDetails({
    user_address: walletAddress,
    authToken: accessToken || undefined
  })

  // Calculate next epoch date - 24 hours after last check in
  const calculateNextEpochDate = () => {
    try {
      if (userDetails && 'last_check_in_timestamp' in userDetails && userDetails.last_check_in_timestamp) {
        const lastCheckInTime = new Date(userDetails.last_check_in_timestamp).getTime()
        if (!isNaN(lastCheckInTime)) {
          return new Date(lastCheckInTime + 24 * 60 * 60 * 1000) // 24 hours after last check in
        }
      }
      // Default fallback if no timestamp available or invalid
      return new Date(Date.now() + 24 * 60 * 60 * 1000)
    } catch (error) {
      console.error("Error calculating next epoch date:", error)
      return new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  }

  const userPoints = 'total_points' in userDetails ? userDetails.total_points : 0
  const nextEpochDate = calculateNextEpochDate()

  if (!isWalletConnected) return null

  // Format the time until next epoch
  const timeUntilNextEpoch: string = (() => {
    try {
      if (!nextEpochDate || isNaN(nextEpochDate.getTime())) {
        return "soon";
      }
      const formatted = formatDistanceToNow(nextEpochDate, { addSuffix: false });
      return formatted.split(' ').slice(1).join(' ');
    } catch (error) {
      console.error("Error formatting time until next epoch:", error);
      return "soon";
    }
  })();

  return (
    <Card className="max-w-full md:max-w-[380px] w-full">
      <CardContent className="p-3 flex max-md:flex-wrap items-center h-full max-md:gap-5 gap-12">
        {/* Left side: Trophy icon and Points */}
        <div className="flex flex-col gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <TrophyIcon className="w-3.5 h-3.5 text-primary" />
            <HeadingText level="h5" weight="medium" className="text-gray-800">
              Points
            </HeadingText>
            <BodyText level="body2" weight="medium" className="text-secondary-500 underline hover:no-underline">
              <Link href="/rewards">
                How it works?
              </Link>
            </BodyText>
          </div>
          <div className="flex items-center gap-2">
            <HeadingText level="h4" weight="semibold" className="text-primary leading-none">
              {userPoints}
            </HeadingText>
            <div className="rounded-full bg-white p-1 w-5 h-5">
              <ImageWithDefault
                src="/images/logos/favicon-32x32.png"
                alt="Points"
                width={14}
                height={14}
                className="w-3 h-3"
              />
            </div>
            {/* <Link href="/rewards">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs font-medium"
              >
                View
                <ArrowRightIcon className="w-3 h-3 ml-1" />
              </Button>
            </Link> */}
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-2 md:ml-auto">
          <div className="flex flex-col md:items-end justify-end gap-1">
            {/* Epoch time */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <BodyText level="body3" className="text-gray-500 whitespace-nowrap">
                {true ? "Next Check In:" : "Check In:"} {timeUntilNextEpoch}
              </BodyText>
            </div>
            {/* Check in button */}
            <CompactCheckInButton />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 