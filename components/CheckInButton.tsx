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
export default function CheckInButton() {
  const { isWalletConnected, walletAddress } = useWalletConnection()
  const { logEvent } = useAnalytics()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has already checked in today (using localStorage for demo)
  useEffect(() => {
    if (typeof window !== 'undefined' && isWalletConnected) {
      const lastCheckIn = localStorage.getItem(`lastCheckIn_${walletAddress}`)
      const today = new Date().toDateString()

      if (lastCheckIn === today) {
        setIsCheckedIn(true)
      }
    }
  }, [isWalletConnected, walletAddress])

  const handleCheckIn = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to check in')
      return
    }

    try {
      setIsLoading(true)

      // Here you would make an API call to register the check-in
      // const response = await fetch('/api/checkin', {
      //   method: 'POST',
      //   body: JSON.stringify({ walletAddress }),
      // })

      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 800))

      // Save check-in status to localStorage
      const today = new Date().toDateString()
      localStorage.setItem(`lastCheckIn_${walletAddress}`, today)

      setIsCheckedIn(true)
      logEvent('daily_checkin_success', { wallet_address: walletAddress })
      toast.success('🎉 Checked in for the day! +5 points')
    } catch (error) {
      toast.error('Failed to check in. Please try again later.')
      console.error('Check-in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isWalletConnected) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCheckIn}
            disabled={isCheckedIn || isLoading}
            variant={isCheckedIn ? "outline" : "default"}
            size="sm"
            className={`h-8 px-3 flex items-center gap-1 ${isCheckedIn ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            {isLoading ? (
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
          <BodyText level="body2" className="text-gray-500">Earn 1 point each day you check in</BodyText>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 