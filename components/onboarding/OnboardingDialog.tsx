'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import useDimensions from '@/hooks/useDimensions'

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'

// Step Components
import { WelcomeStep } from './steps/WelcomeStep'
import { ChoosePathStep } from './steps/ChoosePathStep'
import { EarnFlowStep } from './steps/EarnFlowStep'
import { EarnAssetsStep } from './steps/EarnAssetsStep'
import { EarnRiskStep } from './steps/EarnRiskStep'
import { BorrowFlowStep } from './steps/BorrowFlowStep'
import { BorrowAssetsStep } from './steps/BorrowAssetsStep'
import { BorrowCollateralStep } from './steps/BorrowCollateralStep'
import { LearnFlowStep } from './steps/LearnFlowStep'
import { LearnQuizStep } from './steps/LearnQuizStep'
import { FinalStep } from './steps/FinalStep'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
}

const drawerVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
}

export const OnboardingDialog: React.FC = () => {
  const { width: screenWidth } = useDimensions()
  const isDesktop = useMemo(() => screenWidth > 768, [screenWidth])
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  
  const {
    isOpen,
    currentStep,
    closeOnboarding,
    nextStep,
    previousStep,
    canGoBack,
    canGoNext,
    getStepProgress,
    selectedPath,
  } = useOnboardingContext()

  // Scroll to top when step changes - target the correct container based on platform
  useEffect(() => {
    const scrollContainer = isDesktop ? desktopScrollRef.current : mobileScrollRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [currentStep, isDesktop])

  const progress = getStepProgress()

  const renderStep = () => {
    console.log('🎭 renderStep called with currentStep:', currentStep)
    
    switch (currentStep) {
      case 'welcome':
        console.log('🎭 Rendering WelcomeStep')
        return <WelcomeStep />
      case 'choose-path':
        console.log('🎭 Rendering ChoosePathStep')
        return <ChoosePathStep />
      case 'earn-flow':
        return <EarnFlowStep />
      case 'earn-assets':
        return <EarnAssetsStep />
      case 'earn-risk':
        return <EarnRiskStep />
      case 'borrow-flow':
        return <BorrowFlowStep />
      case 'borrow-assets':
        return <BorrowAssetsStep />
      case 'borrow-collateral':
        return <BorrowCollateralStep />
      case 'learn-flow':
        return <LearnFlowStep />
      case 'learn-quiz':
        return <LearnQuizStep />
      case 'final':
        return <FinalStep />
      default:
        console.log('🎭 Rendering default WelcomeStep for step:', currentStep)
        return <WelcomeStep />
    }
  }

  // Header content shared between desktop and mobile
  const headerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-1 max-w-xs">
          <Progress 
            value={progress.percentage} 
            className="h-2 bg-gray-200"
          />
          <span className="text-xs text-gray-500 mt-1 block">
            Step {progress.current} of {progress.total}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={closeOnboarding}
        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )

  // Navigation footer shared between desktop and mobile
  const navigationFooter = (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={!canGoBack}
        className="flex items-center space-x-2 mobile-onboarding-button"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      <div className="flex items-center space-x-3">
        {(() => {
          const shouldShowContinue = canGoNext || (currentStep === 'choose-path' && selectedPath);
          console.log('🔲 Continue button logic:', {
            canGoNext,
            currentStep,
            selectedPath,
            shouldShowContinue
          });
          
          return shouldShowContinue && (
            <Button
              variant="primary"
              onClick={nextStep}
              className="flex items-center space-x-2 mobile-onboarding-button"
            >
              <span>
                {currentStep === 'choose-path' ? 'Continue' : 'Next'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          );
        })()}
      </div>
    </div>
  )

  // Main content area shared between desktop and mobile
  const mainContent = (
    <div className="flex-1 overflow-y-auto mobile-onboarding-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full mobile-onboarding-content"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )

  if (!isOpen) return null

  // Desktop version using Dialog
  if (isDesktop) {
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={() => {}}>
            <motion.div
              className="fixed inset-0 z-50"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
            >
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dialogVariants}
                  className="relative"
                >
                  <DialogContent 
                    className="max-w-6xl w-full h-[85vh] bg-background/95 backdrop-blur-xl border border-gray-200 shadow-2xl p-0 overflow-hidden"
                    showCloseButton={false}
                  >
                    {/* Header with Progress and Close */}
                    <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 bg-background/50">
                      {headerContent}
                    </DialogHeader>

                    {/* Main Content Area */}
                    <div 
                      ref={desktopScrollRef}
                      className="flex-1 overflow-y-auto px-8 py-4"
                    >
                      {mainContent}
                    </div>

                    {/* Footer with Navigation */}
                    <div className="px-8 py-4 border-t border-gray-200 bg-background/50">
                      {navigationFooter}
                    </div>
                  </DialogContent>
                </motion.div>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    )
  }

  // Mobile version using Drawer
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Drawer open={isOpen} dismissible={false}>
          <motion.div
            className="fixed inset-0 bg-black/25 z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
          >
            <div className="fixed inset-0 flex justify-center">
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={drawerVariants}
                className="w-full h-full flex flex-col"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <DrawerContent className="w-full h-full flex flex-col p-0 dismissible-false rounded-t-0 mt-0">
                  {/* Header with Progress and Close */}
                  <DrawerHeader className="px-4 pt-6 pb-4 border-b border-gray-200 bg-background/50 flex-shrink-0">
                    {headerContent}
                  </DrawerHeader>

                  {/* Main Content Area - takes remaining space */}
                  <div 
                    ref={mobileScrollRef}
                    className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
                  >
                    {mainContent}
                  </div>

                  {/* Footer with Navigation - Enhanced for mobile */}
                  <div className="px-4 border-t border-gray-200 bg-background/50 flex-shrink-0 safe-area-bottom mobile-onboarding-footer">
                    {navigationFooter}
                  </div>
                </DrawerContent>
              </motion.div>
            </div>
          </motion.div>
        </Drawer>
      )}
    </AnimatePresence>
  )
} 