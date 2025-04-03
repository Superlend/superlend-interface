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

export default function RewardsPage() {
  const { isWalletConnected, walletAddress, isConnectingWallet } = useWalletConnection()
  const { logEvent } = useAnalytics()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    if (isWalletConnected && !isConnectingWallet) {
      logEvent('rewards_page_opened', {
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
            'Connect your wallet to view and manage your rewards.'
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
        <div className="flex flex-col gap-[4px]">
          <HeadingText level="h4" weight="medium" className="text-gray-800">
            Rewards Program
          </HeadingText>
          <BodyText level="body1" className="text-gray-600">
            Earn points for your activity and get rewarded at the end of each epoch.
          </BodyText>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex flex-col gap-8">
        {/* Points Overview */}
        <section className="px-5">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-100 border-b border-gray-200 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {/* <TrophyIcon className="w-5 h-5 text-primary" /> */}
                  <InfoIcon key="info" className="w-5 h-5 text-primary" />
                  How it works
                  {/* <Badge variant="blue" className="ml-2">Beta</Badge> */}
                </CardTitle>
                {/* <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white border-secondary-300 text-secondary-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Epoch Ends In: {formatTimeRemaining(mockPointsData.epochEndTime)}
                  </Badge>
                </div> */}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Points and Level */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    {/* <div className="flex items-center justify-between">
                      <Label size="medium" className="text-gray-600">Your Points</Label>
                      <Badge variant="outline" className="bg-white">Level {isLoading ? '-' : mockPointsData.level}</Badge>
                    </div> */}

                    {/* {isLoading ? (
                      <Skeleton className="h-12 w-24 my-1" />
                    ) : (
                      <HeadingText level="h2" weight="semibold" className="text-primary">
                        {mockPointsData.totalPoints}
                      </HeadingText>
                    )} */}

                    {/* <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Level {mockPointsData.level}</span>
                        <span>Level {mockPointsData.level + 1}</span>
                      </div>
                      
                      {isLoading ? (
                        <Skeleton className="h-2 w-full" />
                      ) : (
                        <Progress 
                          value={(mockPointsData.totalPoints / mockPointsData.nextLevelThreshold) * 100} 
                          className="h-2 bg-gray-200" 
                        />
                      )}
                      
                      <BodyText level="body2" className="text-gray-500">
                        {isLoading ? 
                          <Skeleton className="h-4 w-32 inline-block" /> : 
                          `${mockPointsData.nextLevelThreshold - mockPointsData.totalPoints} points until next level`
                        }
                      </BodyText>
                    </div> */}
                  </div>

                  {/* <div className="p-4 rounded-md bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <Label size="medium" className="text-gray-600 flex items-center gap-1">
                        Your Rank
                        <InfoTooltip content="Your position on the global leaderboard" side="top" />
                      </Label>
                    </div>
                    
                    {isLoading ? (
                      <Skeleton className="h-8 w-36" />
                    ) : (
                      <HeadingText level="h3" weight="semibold" className="text-gray-800">
                        #{mockPointsData.rank.toLocaleString()}
                      </HeadingText>
                    )}
                  </div> */}
                </div>

                {/* Points History & Info */}
                {/* <div className="md:col-span-2"> */}
                {/* <PointsTabs> */}
                {/* Points History Content */}
                {/* {isLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : (
                      <div className="overflow-y-auto max-h-[300px] pr-2">
                        <table className="w-full">
                          <thead className="border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 font-medium text-gray-600">Date</th>
                              <th className="text-left py-2 font-medium text-gray-600">Activity</th>
                              <th className="text-right py-2 font-medium text-gray-600">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockPointsData.pointsHistory.map((item, i) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="py-3 text-gray-800">{item.date}</td>
                                <td className="py-3 text-gray-800">{item.reason}</td>
                                <td className="py-3 text-right font-medium text-primary">+{item.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )} */}

                {/* Leaderboard Content */}
                {/* {isLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : (
                      <div className="overflow-y-auto max-h-[300px] pr-2">
                        <table className="w-full">
                          <thead className="border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 font-medium text-gray-600">Rank</th>
                              <th className="text-left py-2 font-medium text-gray-600">Address</th>
                              <th className="text-right py-2 font-medium text-gray-600">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockPointsData.leaderboard.map((item, i) => (
                              <tr key={i} className={`border-b border-gray-100 ${item.address === walletAddress ? 'bg-gray-50' : ''}`}>
                                <td className="py-3 text-gray-800">#{item.rank}</td>
                                <td className="py-3 text-gray-800">{truncateAddress(item.address)}</td>
                                <td className="py-3 text-right font-medium text-primary">{item.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )} */}

                {/* How It Works Content */}
                {/* <div className="space-y-4">
                      <div>
                        <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          What are Superlend Points?
                        </HeadingText>
                        <BodyText level="body1" className="text-gray-600">
                          Superlend Points are rewards earned for participating in the protocol. Points can be earned through various activities such as daily check-ins, lending, borrowing, and more.
                        </BodyText>
                      </div>
                      
                      <div>
                        <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          What happens after an epoch?
                        </HeadingText>
                        <BodyText level="body1" className="text-gray-600">
                          At the end of each epoch, points are tallied and users receive rewards based on their point total and rank. Higher ranks earn greater rewards.
                        </BodyText>
                      </div>
                      
                      <div>
                        <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          How do we get these points redeemed?
                        </HeadingText>
                        <BodyText level="body1" className="text-gray-600">
                          Points are automatically redeemed at the end of each epoch. Rewards are distributed directly to your wallet within 48 hours after the epoch ends.
                        </BodyText>
                      </div>
                    </div> */}
                {/* </PointsTabs> */}
                {/* </div> */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    What are Superlend Points?
                  </HeadingText>
                  <BodyText level="body1" className="text-gray-600">
                    Superlend Points are rewards earned for participating in the protocol. Points can be earned through various activities such as daily check-ins, lending, borrowing, and more.
                  </BodyText>
                </div>

                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    What happens after an epoch?
                  </HeadingText>
                  <BodyText level="body1" className="text-gray-600">
                    At the end of each epoch, points are tallied and users receive rewards based on their point total and rank. Higher ranks earn greater rewards.
                  </BodyText>
                </div>

                <div>
                  <HeadingText level="h5" weight="medium" className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    How do we get these points redeemed?
                  </HeadingText>
                  <BodyText level="body1" className="text-gray-600">
                    Points are automatically redeemed at the end of each epoch. Rewards are distributed directly to your wallet within 48 hours after the epoch ends.
                  </BodyText>
                </div>
              </div>
            </CardContent>

            {/* <CardFooter className="bg-gray-50 py-4 px-6 border-t border-gray-100">
              <BodyText level="body2" className="text-gray-500">
                Points Program is currently in beta. Your feedback helps us improve!
              </BodyText>
            </CardFooter> */}
          </Card>
        </section>

        {/* Ways to Earn Points */}
        <section className="px-5 mb-6">
          <Card>
            <CardHeader className="bg-gray-100 border-b border-gray-200 pb-4">
              <CardTitle className="flex items-center gap-2">
                {/* <CheckCircle2 className="w-5 h-5 text-primary" /> */}
                <RewardsIcon className="w-5 h-5 stroke-primary" />
                Ways to Earn Points
              </CardTitle>
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
                    Check in daily to earn 1 point per day.
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

                {/* <div className="p-4 rounded-md border border-gray-100 hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                      <TrophyIcon className="w-4 h-4" />
                    </div>
                    <HeadingText level="h5" weight="medium">Referrals</HeadingText>
                  </div>
                  <BodyText level="body2" className="text-gray-600">
                    Invite friends and earn points when they join.
                  </BodyText>
                </div> */}

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