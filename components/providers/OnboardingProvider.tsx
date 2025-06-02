'use client'

import React, { createContext, useContext } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingDialog } from '@/components/onboarding'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

// Create the context with the same type as the useOnboarding hook
const OnboardingContext = createContext<ReturnType<typeof useOnboarding> | null>(null)

interface OnboardingProviderProps {
  children: React.ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { logEvent } = useAnalytics()
  const onboardingState = useOnboarding({ logEvent })

  return (
    <OnboardingContext.Provider value={onboardingState}>
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