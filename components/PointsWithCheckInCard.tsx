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
    if (userDetails && 'last_check_in_timestamp' in userDetails && userDetails.last_check_in_timestamp) {
      const lastCheckInTime = new Date(userDetails.last_check_in_timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastCheckIn = (now - lastCheckInTime) / (1000 * 60 * 60);
      // User has checked in if the last check-in was less than 24 hours ago
      setIsCheckedIn(hoursSinceLastCheckIn < 24);
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
      classNameLabel="w-full"
      label={
        <Button
          onClick={handleCheckIn}
          disabled={isCheckedIn || isLoading || isCheckInPending}
          variant={isCheckedIn ? "outline" : "default"}
          size="sm"
          className={`w-full h-7 px-2 text-xs flex items-center gap-1 disabled:opacity-100 ${isCheckedIn ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' : 'bg-primary text-white hover:bg-primary/90'}`}
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
                  <span>Checked In</span>
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
  const [isCheckedInWithin24Hours, setIsCheckedInWithin24Hours] = useState(false)

  const {
    data: userDetails,
    isLoading: isUserDetailsLoading,
    isError: isUserDetailsError,
  } = useGetUserDetails({
    user_address: walletAddress,
    authToken: accessToken || undefined
  })

  // Check if user has checked in within 24 hours
  useEffect(() => {
    if (userDetails && 'last_check_in_timestamp' in userDetails && userDetails.last_check_in_timestamp) {
      const lastCheckInTime = new Date(userDetails.last_check_in_timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastCheckIn = (now - lastCheckInTime) / (1000 * 60 * 60);
      setIsCheckedInWithin24Hours(hoursSinceLastCheckIn < 24);
    }
  }, [userDetails])

  // Calculate next epoch date - 24 hours after last check in
  const calculateNextEpochDate = () => {
    try {
      if (userDetails && 'last_check_in_timestamp' in userDetails && userDetails.last_check_in_timestamp) {
        const lastCheckInTime = new Date(userDetails.last_check_in_timestamp).getTime();
        if (!isNaN(lastCheckInTime)) {
          return new Date(lastCheckInTime + 24 * 60 * 60 * 1000); // 24 hours after last check in
        }
      }
      // Default fallback if no timestamp available or invalid
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error("Error calculating next epoch date:", error);
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  const userPoints = 'total_points' in userDetails ? userDetails.total_points : 0
  const nextEpochDate = calculateNextEpochDate()

  if (!isWalletConnected) return null

  // Calculate hours and minutes until next check-in
  const calculateTimeRemaining = () => {
    try {
      if (!nextEpochDate || isNaN(nextEpochDate.getTime())) {
        return { hours: 0, minutes: 0 };
      }

      const now = new Date();
      const diffMs = nextEpochDate.getTime() - now.getTime();

      if (diffMs <= 0) return { hours: 0, minutes: 0 };

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return { hours, minutes };
    } catch (error) {
      console.error("Error calculating time remaining:", error);
      return { hours: 0, minutes: 0 };
    }
  };

  const { hours, minutes } = calculateTimeRemaining();
  const formattedTimeRemaining = `T-${hours}h ${minutes}m`;

  return (
    <Card className="max-w-full md:max-w-[380px] w-full">
      <CardContent className="p-4 flex flex-col gap-3 bg-white">
        {/* Top: Trophy icon and Points */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <TrophyIcon className="w-4 h-4 text-primary" />
            <HeadingText level="h4" weight="semibold" className="text-primary leading-none">
              {userPoints}
            </HeadingText>
            <HeadingText level="h5" weight="medium" className="text-gray-800">
              Points
            </HeadingText>
          </div>
          <div className="rounded-full bg-gray-400 w-1 h-1" />
          {isCheckedInWithin24Hours && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" /> */}
              <BodyText level="body2" className="text-gray-500 whitespace-nowrap">
                Next Check In: {formattedTimeRemaining}
              </BodyText>
            </div>
          )}
        </div>

        {/* Bottom: Check-in time and buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <CompactCheckInButton />
          </div>

          <Link href="/points" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs font-medium w-full"
            >
              How it works?
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 