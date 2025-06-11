'use client'

import React, { createContext, useContext, useState } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingDialog } from '@/components/onboarding'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { TPositionType } from '@/types'

// Create the context with the same type as the useOnboarding hook
const OnboardingContext = createContext<ReturnType<typeof useOnboarding> & {
  positionType: TPositionType
  setPositionType: (positionType: TPositionType) => void
  opportunitiesData: any
  isLoadingOpportunitiesData: boolean
  isErrorOpportunitiesData: boolean
  refetchOpportunitiesData: () => void
} | null>(null)

interface OnboardingProviderProps {
  children: React.ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { logEvent } = useAnalytics()
  const onboardingState = useOnboarding({ logEvent })
  const [positionType, setPositionType] = useState<TPositionType>('lend')


  const {
    data: opportunitiesData,
    isLoading: isLoadingOpportunitiesData,
    isError: isErrorOpportunitiesData,
    refetch: refetchOpportunitiesData
} = useGetOpportunitiesData({
    type: positionType,
})

  return (
    <OnboardingContext.Provider value={{
      ...onboardingState,
      positionType,
      setPositionType,
      opportunitiesData,
      isLoadingOpportunitiesData,
      isErrorOpportunitiesData,
      refetchOpportunitiesData
    }}>
      {children}
      <OnboardingDialog />
    </OnboardingContext.Provider>
  )
}

// Custom hook to use the onboarding context
export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider')
  }
  return context
} 