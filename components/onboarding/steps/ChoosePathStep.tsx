import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, CreditCard, GraduationCap, ArrowRight } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import type { OnboardingPath } from '@/hooks/useOnboarding'
import { Button } from '@/components/ui/button'

interface PathCardProps {
  path: OnboardingPath
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  borderColor: string
  iconBg: string
  isSelected: boolean
  onClick: () => void
}

const PathCard: React.FC<PathCardProps> = ({
  path,
  title,
  description,
  icon,
  gradient,
  borderColor,
  iconBg,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className={`
        relative rounded-4 p-4 sm:p-6 border-2 transition-all duration-300 cursor-pointer group
        ${isSelected 
          ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg ring-2 ring-primary/30' 
          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-100/50 hover:shadow-md'
        }
      `}
      onClick={() => {
        console.log('Direct onClick triggered for:', title)
        onClick()
      }}
    >
      <div className="space-y-3 sm:space-y-4 pointer-events-none">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-3 flex items-center justify-center ${
          isSelected ? 'bg-primary/20' : 'bg-gray-100'
        }`}>
          {icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center text-primary text-sm font-medium">
          <span>Explore this path</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>

      {/* Backup button for debugging */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Backup button clicked for:', title)
          onClick()
        }}
        aria-label={`Select ${title} path`}
      />

      {isSelected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center shadow-lg pointer-events-none">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
        </div>
      )}
    </div>
  )
}

export const ChoosePathStep: React.FC = () => {
  const { selectedPath, setPath } = useOnboardingContext()

  // Debug function to ensure clicks are working
  const handlePathSelect = (path: OnboardingPath, pathTitle: string) => {
    console.log('Path selected:', path, pathTitle)
    setPath(path)
  }

  const paths = [
    {
      path: 'earn' as OnboardingPath,
      title: 'Earn on Crypto',
      description: 'Learn how to maximize yields on your digital assets through various DeFi protocols and lending platforms.',
      icon: <TrendingUp className="w-7 h-7 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-accent-lightBlue/20 to-accent-darkBlue/10',
      borderColor: 'border-accent-lightBlue',
      iconBg: 'bg-accent-lightBlue',
    },
    {
      path: 'borrow' as OnboardingPath,
      title: 'Borrow Crypto',
      description: 'Discover how to access liquidity while keeping your assets, understanding collateral and risk management.',
      icon: <CreditCard className="w-7 h-7 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-accent-lightGreen/20 to-accent-darkGreen/10',
      borderColor: 'border-accent-lightGreen',
      iconBg: 'bg-accent-lightGreen',
    },
    {
      path: 'learn' as OnboardingPath,
      title: 'Learn about DeFi',
      description: 'Get a comprehensive introduction to decentralized finance, from basics to advanced concepts.',
      icon: <GraduationCap className="w-7 h-7 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-accent-cream/40 to-accent-cream/20',
      borderColor: 'border-accent-cream',
      iconBg: 'bg-accent-cream',
    },
  ]

  // Debug log current state
  console.log('Current selectedPath:', selectedPath)

  return (
    <div className="flex flex-col h-full px-4 sm:px-0">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 sm:mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
          Choose Your DeFi Journey
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
          Select the path that interests you most. We'll customize your experience 
          and show you exactly how Superlend can help you achieve your goals.
        </p>
      </motion.div>

      {/* Path Selection */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl">
          {paths.map((pathData, index) => (
            <motion.div
              key={pathData.path}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full"
            >
              <PathCard
                {...pathData}
                isSelected={selectedPath === pathData.path}
                onClick={() => handlePathSelect(pathData.path, pathData.title)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Helper Text */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center mt-6 sm:mt-8 px-4"
      >
        <p className="text-sm text-gray-500">
          {selectedPath 
            ? `Great choice! Click 'Continue' to dive deeper into your selected path.`
            : "Select a path above to continue with your personalized tour."
          }
        </p>
      </motion.div>
    </div>
  )
} 