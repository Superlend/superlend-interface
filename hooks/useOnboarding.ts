import { useState, useEffect, useCallback } from 'react'
import { useWalletConnection } from './useWalletConnection'

export type OnboardingPath = 'earn' | 'borrow' | 'learn' | null
export type OnboardingStep = 
  | 'welcome'
  | 'choose-path'
  | 'earn-flow'
  | 'earn-assets'
  | 'borrow-flow'
  | 'borrow-assets'
  | 'borrow-collateral'
  | 'learn-flow'
  | 'learn-basics'
  | 'learn-strategies'
  | 'learn-risk'
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
  quizCompleted: boolean
  sessionId: string
  isDismissed: boolean
  dismissalStep: OnboardingStep | null
  stepTimestamps: Record<string, number>
}

const STORAGE_KEY = 'superlend_onboarding_completed'
const STORAGE_KEY_SEEN = 'superlend_onboarding_seen'

// Generate session ID
const generateSessionId = () => {
  return `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useOnboarding = ({
  logEvent,
}: {
  logEvent?: (event: string, properties?: Record<string, any>) => void
}) => {
  const { walletAddress } = useWalletConnection()
  
  const [state, setState] = useState<OnboardingState>({
    isOpen: false,
    currentStep: 'welcome',
    selectedPath: null,
    selectedAsset: null,
    completedSteps: [],
    hasSeenOnboarding: false,
    quizCompleted: false,
    sessionId: generateSessionId(),
    isDismissed: false,
    dismissalStep: null,
    stepTimestamps: {},
  })

  // Helper function to create base event payload
  const createBasePayload = useCallback(() => {
    const now = Date.now()
    const sessionStartTime = Math.min(...Object.values(state.stepTimestamps), now)
    const totalTimeSpentMs = now - sessionStartTime
    
    return {
      // Amplitude-friendly naming conventions
      current_step: state.currentStep,
      selected_path: state.selectedPath,
      session_id: state.sessionId,
      wallet_address: walletAddress || null,
      completed_steps: state.completedSteps,
      completed_steps_count: state.completedSteps.length,
      
      // Time tracking (Amplitude prefers seconds for time durations)
      total_time_spent_seconds: Math.round(totalTimeSpentMs / 1000),
      total_time_spent_ms: totalTimeSpentMs, // Keep milliseconds for precision if needed
      
      // Session context
      session_start_time: sessionStartTime,
      event_timestamp: now,
      
      // User context
      is_wallet_connected: !!walletAddress,
      has_seen_onboarding_before: state.hasSeenOnboarding,
    }
  }, [state, walletAddress])

  // Track step entry with timing
  const trackStepEntry = useCallback((step: OnboardingStep, previousStep?: OnboardingStep) => {
    const stepStartTime = state.stepTimestamps[step] || Date.now()
    const previousStepTime = previousStep ? state.stepTimestamps[previousStep] : null
    const stepDuration = previousStepTime ? stepStartTime - previousStepTime : 0
    
    const payload = {
      ...createBasePayload(),
      step_name: step,
      previous_step: previousStep || null,
      step_duration_seconds: Math.round(stepDuration / 1000),
      step_number: getStepNumber(step),
    }
    logEvent?.('onboarding_step_entered', payload)
  }, [createBasePayload, logEvent, state.stepTimestamps])

  // Helper to get step number for better Amplitude funnel analysis
  const getStepNumber = useCallback((step: OnboardingStep): number => {
    const stepNumbers: Record<OnboardingStep, number> = {
      'welcome': 1,
      'choose-path': 2,
      'earn-flow': 3,
      'earn-assets': 3,
      'borrow-flow': 3,
      'borrow-assets': 3,
      'borrow-collateral': 4,
      'learn-flow': 3,
      'learn-basics': 3,
      'learn-strategies': 4,
      'learn-risk': 5,
      'learn-quiz': 6,
      'final': 7,
    }
    return stepNumbers[step] || 1
  }, [])

  // Track user actions
  const trackUserAction = useCallback((action: string, additionalData?: Record<string, any>) => {
    const payload = {
      ...createBasePayload(),
      action,
      ...additionalData,
    }
    logEvent?.(`onboarding_${action}`, payload)
  }, [createBasePayload, logEvent])

  // Track asset loading states
  const trackAssetLoading = useCallback((
    loadingState: 'start' | 'success' | 'error',
    additionalData?: Record<string, any>
  ) => {
    const payload = {
      ...createBasePayload(),
      loadingState,
      ...additionalData,
    }
    logEvent?.(`onboarding_assets_loading_${loadingState}`, payload)
  }, [createBasePayload, logEvent])

  // Track errors
  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    const payload = {
      ...createBasePayload(),
      error,
      context,
    }
    logEvent?.('onboarding_error', payload)
  }, [createBasePayload, logEvent])

  // Check if user has seen onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY) === 'true'
    const hasSeen = localStorage.getItem(STORAGE_KEY_SEEN) === 'true'
    
    setState(prev => ({ 
      ...prev, 
      hasSeenOnboarding: hasSeen,
      isOpen: !hasCompleted // Auto-open for first-time users
    }))
  }, [])

  const openOnboarding = useCallback(() => {
    setState(prev => {
      const newSessionId = generateSessionId()
      const shouldMarkAsSeen = !prev.hasSeenOnboarding
      
      // Mark as seen immediately when dialog opens for first time
      if (shouldMarkAsSeen) {
        localStorage.setItem(STORAGE_KEY_SEEN, 'true')
      }
      
      return {
        ...prev,
        isOpen: true,
        sessionId: newSessionId,
        hasSeenOnboarding: true,
        isDismissed: false,
        dismissalStep: null,
        stepTimestamps: { [prev.currentStep]: Date.now() },
      }
    })
    
    // Track dialog opened
    trackUserAction('opened', { isFirstTime: !state.hasSeenOnboarding })
    trackStepEntry(state.currentStep)
  }, [trackUserAction, trackStepEntry, state.hasSeenOnboarding, state.currentStep])

  const closeOnboarding = useCallback((isDismissal = false) => {
    setState(prev => {
      // Track dismissal if user clicked X
      if (isDismissal) {
        trackUserAction('dismissed', {
          dismissalStep: prev.currentStep,
          completedSteps: prev.completedSteps,
          selectedPath: prev.selectedPath,
        })
      } else {
        // Track completion
        trackUserAction('completed', {
          finalStep: prev.currentStep,
          completedSteps: prev.completedSteps,
          selectedPath: prev.selectedPath,
        })
      }
      
      return {
        ...prev,
        isOpen: false,
        isDismissed: isDismissal,
        dismissalStep: isDismissal ? prev.currentStep : null,
      }
    })
    
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [trackUserAction])

  const setStep = useCallback((step: OnboardingStep) => {
    setState(prev => {
      const previousStep = prev.currentStep
      
      // Track step change
      trackStepEntry(step, previousStep)
      
      return {
        ...prev, 
        currentStep: step,
        completedSteps: prev.completedSteps.includes(step) 
          ? prev.completedSteps 
          : [...prev.completedSteps, step],
        // Reset quiz completion when navigating to learn-quiz step
        quizCompleted: step === 'learn-quiz' ? false : prev.quizCompleted,
        stepTimestamps: {
          ...prev.stepTimestamps,
          [step]: Date.now()
        }
      }
    })
  }, [trackStepEntry])

  const setPath = useCallback((path: OnboardingPath) => {
    setState(prev => ({ ...prev, selectedPath: path }))
    
    // Track path selection
    trackUserAction('path_selected', { 
      selected_path: path,
      previous_path: state.selectedPath,
      path_selection_step: state.currentStep,
    })
  }, [trackUserAction, state.selectedPath])

  const setSelectedAsset = useCallback((asset: SelectedAsset) => {
    setState(prev => ({ ...prev, selectedAsset: asset }))
    
    // Track asset selection
    trackUserAction('asset_selected', {
      token_address: asset.tokenAddress,
      token_symbol: asset.tokenSymbol,
      chain_id: asset.chainId,
      protocol_identifier: asset.protocolIdentifier,
      position_type: asset.positionType,
      previous_asset: state.selectedAsset?.tokenSymbol || null,
      asset_selection_step: state.currentStep,
    })
  }, [trackUserAction, state.selectedAsset])

  const clearSelectedAsset = useCallback(() => {
    setState(prev => ({ ...prev, selectedAsset: null }))
    
    // Track asset clearing
    trackUserAction('asset_cleared', {
      cleared_asset: state.selectedAsset?.tokenSymbol || null,
      clearing_step: state.currentStep,
    })
  }, [trackUserAction, state.selectedAsset])

  const setQuizCompleted = useCallback((completed: boolean) => {
    setState(prev => ({ ...prev, quizCompleted: completed }))
    
    // Track quiz completion
    if (completed) {
      trackUserAction('quiz_completed', {
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
      })
    }
  }, [trackUserAction, state.currentStep, state.completedSteps])

  const nextStep = useCallback(() => {
    setState(prev => {
      const stepFlow: Record<OnboardingStep, OnboardingStep | null> = {
        'welcome': 'choose-path',
        'choose-path': prev.selectedPath === 'earn' ? 'earn-assets' // Skip earn-flow and go directly to earn-assets
                     : prev.selectedPath === 'borrow' ? 'borrow-assets' // Skip borrow-flow and go directly to borrow-assets
                     : prev.selectedPath === 'learn' ? 'learn-basics' // Skip learn-flow and go directly to learn-basics
                     : null, // Don't allow progression without path selection
        'earn-flow': 'earn-assets',
        'earn-assets': 'final',
        'borrow-flow': 'borrow-assets',
        'borrow-assets': 'final', // Skip borrow-collateral step and go directly to final
        'borrow-collateral': 'final', // Keep this for backwards compatibility but shouldn't be reached
        'learn-flow': 'learn-basics',
        'learn-basics': 'learn-strategies',
        'learn-strategies': 'learn-risk',
        'learn-risk': 'learn-quiz',
        'learn-quiz': 'final',
        'final': null,
      }

      const next = stepFlow[prev.currentStep]
      if (next) {
        // Track navigation
        trackUserAction('navigation_next', {
          from_step: prev.currentStep,
          to_step: next,
          selected_path: prev.selectedPath,
          navigation_direction: 'forward',
        })
        
        // Track new step entry
        trackStepEntry(next, prev.currentStep)
        
        return {
          ...prev,
          currentStep: next,
          completedSteps: prev.completedSteps.includes(next) 
            ? prev.completedSteps 
            : [...prev.completedSteps, next],
          // Reset quiz completion when navigating to learn-quiz step
          quizCompleted: next === 'learn-quiz' ? false : prev.quizCompleted,
          stepTimestamps: {
            ...prev.stepTimestamps,
            [next]: Date.now()
          }
        }
      }
      return prev
    })
  }, [trackUserAction, trackStepEntry])

  const previousStep = useCallback(() => {
    setState(prev => {
      const reverseStepFlow: Record<OnboardingStep, OnboardingStep | null> = {
        'welcome': null,
        'choose-path': 'welcome',
        'earn-flow': 'choose-path',
        'earn-assets': 'choose-path', // Go back to choose-path instead of earn-flow since we skip it
        'borrow-flow': 'choose-path',
        'borrow-assets': 'choose-path', // Go back to choose-path instead of borrow-flow since we skip it
        'borrow-collateral': 'borrow-assets', // Keep this for backwards compatibility but shouldn't be reached
        'learn-flow': 'choose-path',
        'learn-basics': 'choose-path', // Go back to choose-path instead of learn-flow since we skip it
        'learn-strategies': 'learn-basics',
        'learn-risk': 'learn-strategies',
        'learn-quiz': 'learn-risk',
        'final': prev.selectedPath === 'earn' ? 'earn-assets'
                : prev.selectedPath === 'borrow' ? 'borrow-assets'
                : prev.selectedPath === 'learn' ? 'learn-quiz'
                : 'choose-path',
      }

      const previous = reverseStepFlow[prev.currentStep]
      if (previous) {
        // Track navigation
        trackUserAction('navigation_back', {
          from_step: prev.currentStep,
          to_step: previous,
          selected_path: prev.selectedPath,
          navigation_direction: 'backward',
        })
        
        // Track step entry
        trackStepEntry(previous, prev.currentStep)
        
        return {
          ...prev,
          currentStep: previous,
          stepTimestamps: {
            ...prev.stepTimestamps,
            [previous]: Date.now()
          }
        }
      }
      return prev
    })
  }, [trackUserAction, trackStepEntry])

  const resetOnboarding = useCallback(() => {
    setState({
      isOpen: true,
      currentStep: 'welcome',
      selectedPath: null,
      selectedAsset: null,
      completedSteps: [],
      hasSeenOnboarding: false,
      quizCompleted: false,
      sessionId: generateSessionId(),
      isDismissed: false,
      dismissalStep: null,
      stepTimestamps: {},
    })
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY_SEEN)
  }, [])

  const getStepProgress = useCallback(() => {
    const totalSteps = state.selectedPath === 'earn' ? 3 // Reduced from 4 to 3 steps (removed earn-flow)
                     : state.selectedPath === 'borrow' ? 3 // Reduced from 4 to 3 steps (removed borrow-flow)
                     : state.selectedPath === 'learn' ? 6 // Reduced from 7 to 6 steps (removed learn-flow)
                     : 2 // welcome + choose-path

    const stepNumbers: Record<OnboardingStep, number> = {
      'welcome': 1,
      'choose-path': 2,
      'earn-flow': 3, // This won't be used in the new flow but keeping for backwards compatibility
      'earn-assets': 3, // Now step 3 instead of 4
      'borrow-flow': 3, // This won't be used in the new flow but keeping for backwards compatibility
      'borrow-assets': 3, // Now step 3 instead of 4
      'borrow-collateral': 5, // Keep this but it won't be used in normal flow
      'learn-flow': 3, // This won't be used in the new flow but keeping for backwards compatibility
      'learn-basics': 3, // Now step 3 instead of 4
      'learn-strategies': 4, // Now step 4 instead of 5
      'learn-risk': 5, // Now step 5 instead of 6
      'learn-quiz': 6, // Now step 6 instead of 7
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
    clearSelectedAsset,
    nextStep,
    previousStep,
    resetOnboarding,
    getStepProgress,
    setQuizCompleted,
    trackAssetLoading,
    trackError,
    canGoBack: state.currentStep !== 'welcome',
    canGoNext: (() => {
      // Can't go next from final step
      if (state.currentStep === 'final') {
        // console.log('canGoNext: false (final step)')
        return false
      }
      
      // Can't go next from choose-path without selecting a path
      if (state.currentStep === 'choose-path' && !state.selectedPath) {
        // console.log('canGoNext: false (choose-path without selection)', { selectedPath: state.selectedPath })
        return false
      }
      
      // Can't go next from earn-assets without selecting an asset
      if (state.currentStep === 'earn-assets' && !state.selectedAsset) {
        // console.log('canGoNext: false (earn-assets without asset selection)', { selectedAsset: state.selectedAsset })
        return false
      }
      
      // Can't go next from borrow-assets without selecting an asset
      if (state.currentStep === 'borrow-assets' && !state.selectedAsset) {
        // console.log('canGoNext: false (borrow-assets without asset selection)', { selectedAsset: state.selectedAsset })
        return false
      }
      
      // Can't go next from learn-quiz without completing the quiz
      if (state.currentStep === 'learn-quiz' && !state.quizCompleted) {
        // console.log('canGoNext: false (learn-quiz without completion)', { quizCompleted: state.quizCompleted })
        return false
      }
      
      // All other cases can proceed
      // console.log('canGoNext: true', { currentStep: state.currentStep, selectedPath: state.selectedPath, selectedAsset: state.selectedAsset })
      return true
    })(),
  }
} 