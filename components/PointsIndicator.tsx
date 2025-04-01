'use client'

import React from 'react'
import { Card, CardContent } from './ui/card'
import { BodyText, HeadingText } from './ui/typography'
import { Progress } from './ui/progress'
import { ArrowRightIcon, TrophyIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import Link from 'next/link'
import { useWalletConnection } from '@/hooks/useWalletConnection'

// Mock data - replace with actual API
const mockData = {
  points: 65,
  level: 4,
  nextLevelThreshold: 75
}

export default function PointsIndicator() {
  const { isWalletConnected } = useWalletConnection()
  
  if (!isWalletConnected) return null
  
  return (
    <Link href="/rewards">
      <Card className="w-full hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-primary" />
              <BodyText level="body2" weight="medium" className="text-gray-800">
                Points
              </BodyText>
            </div>
            <Badge variant="blue" className="text-[10px] py-0 px-1">Beta</Badge>
          </div>
          
          <div className="mb-2">
            <HeadingText level="h4" weight="semibold" className="text-primary">
              {mockData.points}
            </HeadingText>
            <Progress 
              value={(mockData.points / mockData.nextLevelThreshold) * 100} 
              className="h-1 bg-gray-200 mt-1" 
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <BodyText level="body3" className="text-gray-500">
              Level {mockData.level}
            </BodyText>
            <div className="flex items-center gap-1 text-primary text-xs font-medium group-hover:underline">
              View Details 
              <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 