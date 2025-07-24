import React from 'react'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import ImageWithDefault from '@/components/ImageWithDefault'
import Link from 'next/link'
import { ArrowRightIcon, InfoIcon } from 'lucide-react'

export default function AppleFarmBanner() {
  return (
    <Link href="https://www.applefarm.xyz" target="_blank" rel="noopener noreferrer">
      <Card className="relative overflow-hidden bg-gradient-to-r from-[#F5FFF7] via-[#EDFBEF] to-[#EDFBEF] md:to-[#00985b] hover:shadow-md transition-all duration-300 cursor-pointer group">
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
                Apple Farm Season 2 on Etherlink!
              </HeadingText>
            </div>
            <BodyText level="body2" weight="normal" className="text-gray-600 max-w-[600px]">
              An onchain incentive platform that rewards users who provide liquidity for key token pairs, supply to lending markets, and trade on selected DeFi protocols.
            </BodyText>
            {/* <div className="flex items-center gap-2 text-emerald-600 font-medium mt-1">
              Season Two Rewards: Coming Soon
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div> */}
          </div>

          <ImageWithDefault
            src="https://www.etherlink.com/logo-desktop.svg"
            alt="Etherlink"
            width={200}
            height={60}
            className="md:block hidden object-contain absolute right-8 top-1/2 -translate-y-1/2 brightness-125"
          />
        </div>
      </Card>
    </Link>
  )
} 