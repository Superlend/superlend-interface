'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { History, TrophyIcon, InfoIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface PointsTabsProps {
  children: React.ReactNode[]
  defaultTab?: string
  tabLabels?: string[]
  className?: string
}

export default function PointsTabs({ 
  children, 
  defaultTab = "history",
  tabLabels = ["Points History", "Leaderboard", "How It Works"],
  className = ""
}: PointsTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab)
  
  const tabValues = ["history", "leaderboard", "info"]
  const tabIcons = [
    <History key="history" className="w-4 h-4" />,
    <TrophyIcon key="leaderboard" className="w-4 h-4" />,
    <InfoIcon key="info" className="w-4 h-4" />
  ]
  
  return (
    <Tabs 
      defaultValue={defaultTab} 
      className={`w-full ${className}`}
      onValueChange={(value) => setActiveTab(value)}
    >
      <div className="relative bg-white rounded-2 p-1 shadow-sm border border-gray-100">
        <TabsList className="w-full grid grid-cols-3 bg-transparent p-0">
          {tabValues.map((value, index) => (
            <TabsTrigger
              key={value}
              value={value}
              className={`
                relative z-10 px-4 py-2 rounded-2
                ${activeTab === value 
                  ? 'text-white data-[state=active]:text-white data-[state=active]:bg-transparent' 
                  : 'text-gray-500 hover:text-gray-700 data-[state=active]:bg-transparent'
                }
              `}
            >
              {tabIcons[index]}
              <span className="hidden sm:inline ml-1.5">{tabLabels[index]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Animated background for selected tab */}
        <motion.div 
          className="absolute top-1 left-0 h-[calc(100%-8px)] bg-primary rounded-2 shadow-sm z-0"
          animate={{ 
            left: activeTab === "history" 
              ? '0%' 
              : activeTab === "leaderboard" 
                ? '33.333%' 
                : '66.666%',
            width: '33.333%'
          }}
          initial={{ 
            left: defaultTab === "history" 
              ? '0%' 
              : defaultTab === "leaderboard" 
                ? '33.333%' 
                : '66.666%',
            width: '33.333%'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
      
      {/* Tab Content */}
      {tabValues.map((value, index) => (
        <TabsContent key={value} value={value} className="mt-2">
          {children[index]}
        </TabsContent>
      ))}
    </Tabs>
  )
} 