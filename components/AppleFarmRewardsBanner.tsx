import React from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import ImageWithDefault from '@/components/ImageWithDefault'
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetMerklUserRewardsData } from '@/hooks/useGetMerklUserRewardsData'
import { useWalletConnection } from '@/hooks/useWalletConnection'

interface AppleFarmRewardsBannerProps {
  totalRewards?: string;
  isLoading?: boolean;
}

const RainingApples = () => {
  // Create 10 apple elements with random positions and delays
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-rain"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            top: `-50px`,
          }}
        >
          <ImageWithDefault
            src="/images/logos/apple-green.png"
            alt=""
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  )
}

export default function AppleFarmRewardsBanner({ isLoading = false }: AppleFarmRewardsBannerProps) {
  const { walletAddress } = useWalletConnection()
  const { data: userRewardsData, isLoading: isUserRewardsLoading } = useGetMerklUserRewardsData({
    walletAddress: walletAddress as `0x${string}`,
  })

  const totalRewards: number = Number(userRewardsData?.[0]?.rewards?.[0]?.amount ?? 0) / 1e18

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-[#F5FFF7] via-[#EDFBEF] to-[#EDFBEF] md:to-[#00985b] hover:shadow-md transition-all duration-300">
      {/* <RainingApples /> */}
      <div className="flex flex-wrap items-center justify-between p-6 gap-4">
        <div className="flex flex-col gap-2 z-10">
          <div className="flex items-center gap-3">
            <ImageWithDefault
              src="/images/logos/apple-green.png"
              alt="Apple Farm"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="flex flex-col">
              <HeadingText level="h4" weight="medium" className="text-gray-800">
                Your Apple Farm Rewards
              </HeadingText>
              {isUserRewardsLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <BodyText level="body1" className="text-emerald-600 font-semibold">
                  {!!totalRewards ? totalRewards.toFixed(2) : 'No'} Rewards Available
                </BodyText>
              )}
            </div>
          </div>
          {/* <div className="flex flex-col gap-1">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <BodyText level="body1" className="text-emerald-600 font-semibold">
                {totalRewards || '0'} Rewards Available
              </BodyText>
            )}
            <BodyText level="body2" className="text-gray-600">
              Claim your rewards on Apple Farm
            </BodyText>
          </div> */}
        </div>

        <Link
          href={!totalRewards ? "/etherlink?chainId=42793" : "https://www.applefarm.xyz"}
          target={!totalRewards ? "_self" : "_blank"}
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button
            size="lg"
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {!totalRewards ? "Start Supplying" : "Claim Rewards"}
            {!!totalRewards && <ArrowRightIcon className="w-4 h-4 ml-2 -rotate-45" />}
          </Button>
        </Link>
      </div>
    </Card>
  )
} 