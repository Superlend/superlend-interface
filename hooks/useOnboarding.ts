import { useState, useEffect, useCallback } from 'react'

export type OnboardingPath = 'earn' | 'borrow' | 'learn' | null
export type OnboardingStep = 
  | 'welcome'
  | 'choose-path'
  | 'earn-flow'
  | 'earn-assets'
  | 'earn-risk'
  | 'borrow-flow'
  | 'borrow-assets'
  | 'borrow-collateral'
  | 'learn-flow'
  | 'learn-quiz'
  | 'final'

interface SelectedAsset {
  tokenAddress: string
  tokenSymbol: string
  chainId: string
  protocolIdentifier: string
  positionType: 'lend' | 'borrow'
}

interface OnboardingState {
  isOpen: boolean
  currentStep: OnboardingStep
  selectedPath: OnboardingPath
  selectedAsset: SelectedAsset | null
  completedSteps: OnboardingStep[]
  hasSeenOnboarding: boolean
}

const STORAGE_KEY = 'superlend_onboarding_completed'

export const useOnboarding = ({
  logEvent,
}: {
  logEvent?: (event: string, properties?: Record<string, any>) => void
}) => {
  const [state, setState] = useState<OnboardingState>({
    isOpen: false,
    currentStep: 'welcome',
    selectedPath: null,
    selectedAsset: null,
    completedSteps: [],
    hasSeenOnboarding: false,
  })

  // Debug state changes
  useEffect(() => {
    // console.log('🔄 State updated:', state)
    logEvent?.('onboarding_state_update', { state })
  }, [state])

  // Check if user has seen onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY) === 'true'
    console.log('📱 Initial localStorage check:', { hasCompleted })
    setState(prev => ({ 
      ...prev, 
      hasSeenOnboarding: hasCompleted,
      isOpen: !hasCompleted // Auto-open for first-time users
    }))
  }, [])

  const openOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }))
  }, [])

  const closeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const setStep = useCallback((step: OnboardingStep) => {
    console.log('📍 setStep called:', step)
    setState(prev => {
      console.log('📍 setStep - prev state:', prev.currentStep, '-> new step:', step)
      return {
        ...prev, 
        currentStep: step,
        completedSteps: prev.completedSteps.includes(step) 
          ? prev.completedSteps 
          : [...prev.completedSteps, step]
      }
    })
  }, [])

  const setPath = useCallback((path: OnboardingPath) => {
    setState(prev => ({ ...prev, selectedPath: path }))
  }, [])

  const setSelectedAsset = useCallback((asset: SelectedAsset) => {
    setState(prev => ({ ...prev, selectedAsset: asset }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => {
      const stepFlow: Record<OnboardingStep, OnboardingStep | null> = {
        'welcome': 'choose-path',
        'choose-path': prev.selectedPath === 'earn' ? 'earn-flow' 
                     : prev.selectedPath === 'borrow' ? 'borrow-flow'
                     : prev.selectedPath === 'learn' ? 'learn-flow'
                     : null, // Don't allow progression without path selection
        'earn-flow': 'earn-risk', // Risk education comes first
        'earn-risk': 'earn-assets', // Asset selection as final CTA
        'earn-assets': 'final',
        'borrow-flow': 'borrow-assets',
        'borrow-assets': 'borrow-collateral',
        'borrow-collateral': 'final',
        'learn-flow': 'learn-quiz',
        'learn-quiz': 'final',
        'final': null,
      }

      const next = stepFlow[prev.currentStep]
      if (next) {
        return {
          ...prev,
          currentStep: next,
          completedSteps: prev.completedSteps.includes(next) 
            ? prev.completedSteps 
            : [...prev.completedSteps, next]
        }
      }
      return prev
    })
  }, [])

  const previousStep = useCallback(() => {
    setState(prev => {
      const reverseStepFlow: Record<OnboardingStep, OnboardingStep | null> = {
        'welcome': null,
        'choose-path': 'welcome',
        'earn-flow': 'choose-path',
        'earn-risk': 'earn-flow', // Risk comes after flow
        'earn-assets': 'earn-risk', // Assets comes after risk
        'borrow-flow': 'choose-path',
        'borrow-assets': 'borrow-flow',
        'borrow-collateral': 'borrow-assets',
        'learn-flow': 'choose-path',
        'learn-quiz': 'learn-flow',
        'final': prev.selectedPath === 'earn' ? 'earn-assets'
                : prev.selectedPath === 'borrow' ? 'borrow-collateral'
                : prev.selectedPath === 'learn' ? 'learn-quiz'
                : 'choose-path',
      }

      const previous = reverseStepFlow[prev.currentStep]
      if (previous) {
        return {
          ...prev,
          currentStep: previous
        }
      }
      return prev
    })
  }, [])

  const resetOnboarding = useCallback(() => {
    setState({
      isOpen: true,
      currentStep: 'welcome',
      selectedPath: null,
      selectedAsset: null,
      completedSteps: [],
      hasSeenOnboarding: false,
    })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const getStepProgress = useCallback(() => {
    const totalSteps = state.selectedPath === 'earn' ? 5
                     : state.selectedPath === 'borrow' ? 5
                     : state.selectedPath === 'learn' ? 4
                     : 2 // welcome + choose-path

    const stepNumbers: Record<OnboardingStep, number> = {
      'welcome': 1,
      'choose-path': 2,
      'earn-flow': 3,
      'earn-risk': 4, // Risk is now step 4
      'earn-assets': 5, // Assets is now step 5 (final CTA)
      'borrow-flow': 3,
      'borrow-assets': 4,
      'borrow-collateral': 5,
      'learn-flow': 3,
      'learn-quiz': 4,
      'final': totalSteps,
    }

    return {
      current: stepNumbers[state.currentStep] || 1,
      total: totalSteps,
      percentage: ((stepNumbers[state.currentStep] || 1) / totalSteps) * 100
    }
  }, [state.currentStep, state.selectedPath])

  return {
    ...state,
    openOnboarding,
    closeOnboarding,
    setStep,
    setPath,
    setSelectedAsset,
    nextStep,
    previousStep,
    resetOnboarding,
    getStepProgress,
    canGoBack: state.currentStep !== 'welcome',
    canGoNext: (() => {
      // Can't go next from final step
      if (state.currentStep === 'final') {
        console.log('canGoNext: false (final step)')
        return false
      }
      
      // Can't go next from choose-path without selecting a path
      if (state.currentStep === 'choose-path' && !state.selectedPath) {
        console.log('canGoNext: false (choose-path without selection)', { selectedPath: state.selectedPath })
        return false
      }
      
      // Can't go next from earn-assets without selecting an asset
      if (state.currentStep === 'earn-assets' && !state.selectedAsset) {
        console.log('canGoNext: false (earn-assets without asset selection)', { selectedAsset: state.selectedAsset })
        return false
      }
      
      // Can't go next from borrow-assets without selecting an asset
      if (state.currentStep === 'borrow-assets' && !state.selectedAsset) {
        console.log('canGoNext: false (borrow-assets without asset selection)', { selectedAsset: state.selectedAsset })
        return false
      }
      
      // All other cases can proceed
      console.log('canGoNext: true', { currentStep: state.currentStep, selectedPath: state.selectedPath, selectedAsset: state.selectedAsset })
      return true
    })(),
  }
} 