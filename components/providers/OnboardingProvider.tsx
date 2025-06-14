'use client'

import React, { createContext, useContext, useState } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingDialog } from '@/components/onboarding'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { TPositionType } from '@/types'
import { AppleFarmRewardsProvider } from '@/context/apple-farm-rewards-provider'

// Create the context with the same type as the useOnboarding hook
const OnboardingContext = createContext<ReturnType<typeof useOnboarding> & {
  positionType: TPositionType
  setPositionType: (positionType: TPositionType) => void
  lendOpportunitiesData: any
  isLoadingLendOpportunitiesData: boolean
  isErrorLendOpportunitiesData: boolean
  refetchLendOpportunitiesData: () => void
  borrowOpportunitiesData: any
  isLoadingBorrowOpportunitiesData: boolean
  isErrorBorrowOpportunitiesData: boolean
  refetchBorrowOpportunitiesData: () => void
} | null>(null)

interface OnboardingProviderProps {
  children: React.ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { logEvent } = useAnalytics()
  const onboardingState = useOnboarding({ logEvent })
  const [positionType, setPositionType] = useState<TPositionType>('lend')


  const {
    data: lendOpportunitiesData,
    isLoading: isLoadingLendOpportunitiesData,
    isError: isErrorLendOpportunitiesData,
    refetch: refetchLendOpportunitiesData
  } = useGetOpportunitiesData({
    type: 'lend',
  })

  const {
    data: borrowOpportunitiesData,
    isLoading: isLoadingBorrowOpportunitiesData,
    isError: isErrorBorrowOpportunitiesData,
    refetch: refetchBorrowOpportunitiesData
  } = useGetOpportunitiesData({
    type: 'borrow',
  })

  return (
    <OnboardingContext.Provider value={{
      ...onboardingState,
      positionType,
      setPositionType,
      lendOpportunitiesData,
      isLoadingLendOpportunitiesData,
      isErrorLendOpportunitiesData,
      refetchLendOpportunitiesData,
      borrowOpportunitiesData,
      isLoadingBorrowOpportunitiesData,
      isErrorBorrowOpportunitiesData,
      refetchBorrowOpportunitiesData
    }}>
      <AppleFarmRewardsProvider>
        {children}
        <OnboardingDialog />
      </AppleFarmRewardsProvider>
    </OnboardingContext.Provider>
  )
}
// Custom hook to use the onboarding context
export const useOnboardingContext = (): ReturnType<typeof useOnboarding> & {
  positionType: TPositionType
  setPositionType: (positionType: TPositionType) => void
  lendOpportunitiesData: any
  isLoadingLendOpportunitiesData: boolean
  isErrorLendOpportunitiesData: boolean
  refetchLendOpportunitiesData: () => void
  borrowOpportunitiesData: any
  isLoadingBorrowOpportunitiesData: boolean
  isErrorBorrowOpportunitiesData: boolean
  refetchBorrowOpportunitiesData: () => void
} => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider')
  }
  return context
} 