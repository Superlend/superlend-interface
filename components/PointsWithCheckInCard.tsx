'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { BodyText, HeadingText } from './ui/typography'
import { ArrowRightIcon, TrophyIcon, Clock, CheckCircle, Loader2 } from 'lucide-react'
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
import { Badge } from './ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { abbreviateNumber } from '@/lib/utils'
import { Skeleton } from './ui/skeleton'
import TooltipText from './tooltips/TooltipText'

// Compact version of CheckInButton specifically for this component
function CompactCheckInButton() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { logEvent } = useAnalytics()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      const newCheckedInStatus = hoursSinceLastCheckIn < 24;
      setIsCheckedIn(newCheckedInStatus);

      // If status changed from checked-in to not checked-in, refetch user details
      if (isCheckedIn && !newCheckedInStatus) {
        refetchUserDetails();
      }
    } else {
      setIsCheckedIn(false);
    }
    setIsLoading(false);
  }, [userDetails, refetchUserDetails, isCheckedIn]);

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
          disabled={isCheckedIn || isLoading || isCheckInPending || isUserDetailsLoading}
          variant={isCheckedIn ? "outline" : "default"}
          size="sm"
          className={`w-full h-7 px-2 text-xs flex items-center gap-1 disabled:opacity-100 ${(isUserDetailsLoading || isLoading || isCheckInPending) ? 'bg-gray-200 text-gray-500 border-gray-200 hover:bg-gray-200' : isCheckedIn ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' : 'bg-primary text-white hover:bg-primary/90'}`}
        >
          {(isLoading || isCheckInPending) ? (
            <span className="flex items-center">
              <Loader2 className="w-3 h-3 animate-spin mr-1" /> Checking in...
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

// Animated number component for the timer
const AnimatedNumber = ({ value, label }: { value: string, label: string }) => {
  return (
    <div className="flex items-end justify-end gap-0.5">
      <div className="relative h-5 w-fit overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-end items-center font-medium text-sm text-gray-500"
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
};

export default function PointsWithCheckInCard() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { accessToken } = useAuth()
  const [isCheckedInWithin24Hours, setIsCheckedInWithin24Hours] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 })

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

  // Memoize the next epoch date to prevent recalculations on each render
  const nextEpochDate = React.useMemo(() => {
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
  }, [userDetails]);

  const userPoints = 'total_points' in userDetails ? userDetails.total_points : 0

  // Calculate hours and minutes until next check-in
  const calculateTimeRemaining = React.useCallback(() => {
    try {
      if (!nextEpochDate || isNaN(nextEpochDate.getTime())) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const now = new Date();
      const diffMs = nextEpochDate.getTime() - now.getTime();

      if (diffMs <= 0) return { hours: 0, minutes: 0, seconds: 0 };

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    } catch (error) {
      console.error("Error calculating time remaining:", error);
      return { hours: 0, minutes: 0, seconds: 0 };
    }
  }, [nextEpochDate]);

  // Update time remaining every second
  useEffect(() => {
    if (!isCheckedInWithin24Hours) return;

    // Initial calculation
    const initialTime = calculateTimeRemaining();
    setTimeRemaining(initialTime);

    // If initial time is already zero, update check-in status
    if (initialTime.hours === 0 && initialTime.minutes === 0 && initialTime.seconds === 0) {
      setIsCheckedInWithin24Hours(false);
      return;
    }

    // Set up interval to update every second
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      // Check if timer has reached zero
      if (newTime.hours === 0 && newTime.minutes === 0 && newTime.seconds === 0) {
        setIsCheckedInWithin24Hours(false);
        clearInterval(interval);
      }
    }, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [isCheckedInWithin24Hours, calculateTimeRemaining]);

  if (!isWalletConnected) return null

  return (
    <Card className="max-w-full md:max-w-[380px] w-full overflow-visible">
      <CardContent className="p-4 flex flex-col gap-3 bg-white relative rounded-6">
        {/* <Badge className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">
          New
        </Badge> */}
        {/* Top: Trophy icon and Points */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <TrophyIcon className="w-4 h-4 text-primary" />
            <HeadingText level="h4" weight="semibold" className="text-primary leading-none">
              {abbreviateNumber(userPoints, 0)}
            </HeadingText>
            <InfoTooltip
              label={
                <HeadingText level="h5" weight="medium" className="text-gray-800">
                  <TooltipText>
                    Points
                  </TooltipText>
                </HeadingText>
              }
              content={
                <BodyText level="body3" className="text-gray-600">
                  Points are updated every Sunday based on your activity on Superlend during the week.
                </BodyText>
              }
            />
          </div>
          {isUserDetailsLoading && (
            <Skeleton className="w-24 h-4 rounded-4" />
          )}
          {isCheckedInWithin24Hours && (
            <div className="max-md:hidden rounded-full bg-gray-400 w-1 h-1" />
          )}
          {isCheckedInWithin24Hours && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <BodyText level="body2" className="text-gray-500">
                Next Check In:
              </BodyText>
              <div className="flex items-center space-x-0.5">
                <AnimatedNumber value={timeRemaining.hours.toString().padStart(2, '0')} label="h" />
                <span className="text-gray-400 flex items-center -mt-0.5">:</span>
                <AnimatedNumber value={timeRemaining.minutes.toString().padStart(2, '0')} label="m" />
                <span className="text-gray-400 flex items-center -mt-0.5">:</span>
                <AnimatedNumber value={timeRemaining.seconds.toString().padStart(2, '0')} label="s" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Check-in time and buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {isUserDetailsLoading && <Skeleton className="w-24 h-7 rounded-4" />}
            {!isUserDetailsLoading && <CompactCheckInButton />}
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