'use client'

import React, { useState } from 'react'
import MainContainer from '@/components/MainContainer'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import InfoBannerWithCta from '@/components/InfoBannerWithCta'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { ArrowRightIcon, InfoIcon, TrophyIcon, CheckCircle2, Calendar, History, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useEffect } from 'react'
import PointsTabs from './PointsTabs'
import RewardsIcon from '@/components/icons/rewards-icon'
import ArrowLeftIcon from '@/components/icons/arrow-left-icon'
import { useRouter } from 'next/navigation'

// Mock data for demonstration - replace with actual API data
const mockPointsData = {
  totalPoints: 65,
  level: 4,
  nextLevelThreshold: 75,
  rank: 556456,
  epochEndTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  pointsHistory: [
    { date: '2023-07-01', amount: 10, reason: 'Daily Check-in' },
    { date: '2023-07-02', amount: 5, reason: 'Daily Check-in' },
    { date: '2023-07-03', amount: 15, reason: 'Deposit' },
    { date: '2023-07-04', amount: 20, reason: 'Referral Bonus' },
    { date: '2023-07-05', amount: 5, reason: 'Daily Check-in' },
    { date: '2023-07-06', amount: 10, reason: 'Asset Diversification' }
  ],
  leaderboard: [
    { rank: 1, address: '0x8e.......19b8', points: 5195, avatar: '/images/avatars/avatar-1.png' },
    { rank: 2, address: '0x8f.......3246', points: 4489, avatar: '/images/avatars/avatar-2.png' },
    { rank: 3, address: '0x74.......7358', points: 4484, avatar: '/images/avatars/avatar-3.png' },
    { rank: 4, address: '0xb2.......9901', points: 4446, avatar: '/images/avatars/avatar-4.png' },
    { rank: 5, address: '0x77.......8658', points: 4425, avatar: '/images/avatars/avatar-5.png' }
  ]
}

export default function PointsPage() {
  const { isWalletConnected, walletAddress, isConnectingWallet } = useWalletConnection()
  const { logEvent } = useAnalytics()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    if (isWalletConnected && !isConnectingWallet) {
      logEvent('points_page_opened', {
        wallet_address: walletAddress,
      })
    }

    return () => clearTimeout(timer)
  }, [isWalletConnected, walletAddress, isConnectingWallet, logEvent])

  function formatTimeRemaining(endTime: Date) {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()

    // Convert milliseconds to days, hours, minutes
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}d ${hours}h ${minutes}m`
  }

  function truncateAddress(address: string) {
    return address
  }

  if (!isWalletConnected && !isConnectingWallet) {
    return (
      <div className="py-16">
        <InfoBannerWithCta
          image={'/images/connect-wallet-banner.webp'}
          title={'Connect Wallet'}
          description={
            'Connect your wallet to view and manage your points.'
          }
          ctaButton={<ConnectWalletButton />}
        />
      </div>
    )
  }

  if (isConnectingWallet) {
    return (
      <MainContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Skeleton className="h-10 w-10 rounded-full mb-4" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </MainContainer>
    )
  }

  return (
    <MainContainer className="px-0 flex flex-col gap-6">
      {/* Page Header */}
      <section className="px-5 mb-4">
        <div className="flex items-start gap-[24px]">
          <Button
            className="py-[8px] px-[12px] rounded-3"
            onClick={() => router.push("/portfolio")}
          >
            <ArrowLeftIcon
              width={16}
              height={16}
              className="stroke-gray-800"
            />
          </Button>
          <div className="flex flex-col">
            <HeadingText level="h4" weight="medium" className="text-gray-800">
              Points Program
            </HeadingText>
            <BodyText level="body1" className="text-gray-600">
              Use Superlend and earn points.
            </BodyText>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex flex-col gap-8">
        {/* Points Overview */}
        <section className="px-5">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-100 border-b border-gray-200 pb-4">
              <div className="flex justify-between items-center">
                <HeadingText level="h4" weight="medium" className="text-gray-800 flex items-center gap-2">
                  <InfoIcon key="info" className="w-5 h-5 text-primary" />
                  How it works
                </HeadingText>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    What are Superlend Points?
                  </HeadingText>
                  <BodyText level="body2" className="text-gray-600">
                    Superlend Points is a rewards system that gives users points for interacting with the Superlend aggregator. The more you engage—by performing actions like lending, borrowing, withdrawing, repaying, or exploring the Discover and Portfolio pages—the more points you earn.
                  </BodyText>
                </div>

                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    What are daily check-ins?
                  </HeadingText>
                  <BodyText level="body2" className="text-gray-600">
                    You can earn points by visiting the Superlend aggregator and clicking the ‘Check-in’ button once every 24 hours. Check-in is seamless and happens through a gasless signature, so no transaction fees are required.
                  </BodyText>
                </div>

                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    When are points updated?
                  </HeadingText>
                  <BodyText level="body2" className="text-gray-600">
                    Points are updated every Sunday based on your activity on Superlend during the week.
                  </BodyText>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Ways to Earn Points */}
        <section className="px-5 mb-6">
          <Card>
            <CardHeader className="bg-gray-100 border-b border-gray-200 pb-4">
              <HeadingText level="h4" weight="medium" className="text-gray-800 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 stroke-primary" />
                Ways to Earn Points
              </HeadingText>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Daily Check-in</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Check in daily to earn 10 points per day.
                  </BodyText>
                </div>

                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Lending</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Earn points based on your lending activity and volume.
                  </BodyText>
                </div>

                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <ArrowRightIcon className="w-4 h-4 rotate-180" />
                    </div>
                    <HeadingText level="h5" weight="medium">Borrowing</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Earn points based on your borrowing activity and volume.
                  </BodyText>
                </div>

                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <ArrowDownIcon className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Withdrawals</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Earn points based on your withdrawals activity and volume.
                  </BodyText>
                </div>

                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <ArrowUpIcon className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Repayments</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Earn points based on your repayments activity and volume.
                  </BodyText>
                </div>

                <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Long-term Usage</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Earn bonus points for consistent protocol activity.
                  </BodyText>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainContainer>
  )
} 