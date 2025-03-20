import React from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import ImageWithDefault from '@/components/ImageWithDefault'
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function AppleFarmRewardsBanner({ totalRewards, isLoading = false }: AppleFarmRewardsBannerProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-[#F5FFF7] via-[#EDFBEF] to-[#EDFBEF] md:to-[#00985b] hover:shadow-md transition-all duration-300">
      <RainingApples />
      <div className="flex items-center justify-between p-6 gap-4">
        <div className="flex flex-col gap-2 z-10">
          <div className="flex items-center gap-3">
            <ImageWithDefault
              src="/images/logos/apple-green.png"
              alt="Apple Farm"
              width={32}
              height={32}
              className="object-contain"
            />
            <HeadingText level="h4" weight="medium" className="text-gray-800">
              Your Apple Farm Rewards
            </HeadingText>
          </div>
          <div className="flex flex-col gap-1">
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
          </div>
        </div>
        
        <Link 
          href="https://www.applefarm.xyz/waitlist" 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button 
            size="lg"
            variant="default" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Claim Rewards
            <ArrowRightIcon className="w-4 h-4 ml-2 -rotate-45" />
          </Button>
        </Link>
      </div>
    </Card>
  )
} 