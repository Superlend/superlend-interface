import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Coins, ArrowRight, DollarSign, BookOpen, Info, Shield } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'

export const EarnFlowStep: React.FC = () => {
  const { setPath, setStep } = useOnboardingContext()

  const handleStartLearningPath = () => {
    console.log('🎓 Starting Learning Path from Earn Flow')
    setPath('learn')
    setStep('learn-flow')
  }

  const steps = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Choose Yield Strategy",
      description: "Compare APYs across different lending protocols and filter from the best options"
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Select Your Assets",
      description: "Choose from USDC, ETH, BTC and other supported cryptocurrencies"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Start Earning",
      description: "Deposit your assets and watch your yield grow automatically"
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          How to Earn on Crypto
        </h2>
        <p className="text-base text-gray-600 max-w-xl mx-auto">
          Discover how Superlend helps you maximize your crypto yields through intelligent
          protocol aggregation and yield optimization strategies.
        </p>
      </motion.div>

      {/* Steps Flow */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-4 p-6 border border-primary/20 text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <div className="text-primary">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {step.description}
                  </p>
                </div>

                {/* Improved Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="bg-white rounded-full p-1 shadow-sm border border-primary/20">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Educational Tips - Moved from EarnAssetsStep */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-12 space-y-6"
      >
        {/* Section Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-gray-500 font-medium">Ready to Learn More?</span>
          </div>
        </div>

        {/* Quick Tips Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 text-sm mb-2">What is APY?</h4>
            <p className="text-xs text-blue-700">
              Annual Percentage Yield - your yearly return including compound interest
            </p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-green-50 border border-green-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-green-300 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-900 text-sm mb-2">Start Safe</h4>
            <p className="text-xs text-green-700">
              Begin with low-risk stablecoins to learn before exploring higher yields
            </p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-purple-300 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-purple-900 text-sm mb-2">Diversify</h4>
            <p className="text-xs text-purple-700">
              Spread your funds across multiple assets and protocols to reduce risk
            </p>
          </motion.div>
        </div>

        {/* Enhanced Learn More Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-amber-300 transition-all duration-300"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-lg mb-2">Deep Dive into DeFi Strategies</h4>
              <p className="text-amber-800 mb-4 leading-relaxed">
                Want comprehensive understanding? Our Learn path covers everything from DeFi fundamentals 
                to advanced risk management strategies. Plus, explore our blog for the latest insights.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                  💡 DeFi Basics
                </span>
                <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                  📈 Earning Strategies  
                </span>
                <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                  🛡️ Risk Management
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleStartLearningPath}
                  className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors duration-200"
                >
                  <span>Start Learning Path</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                
                <a 
                  href="https://blog.superlend.xyz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-white border-2 border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-amber-50 transition-colors duration-200"
                >
                  <span>Read Our Blog</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Commented out for now - Why Choose Superlend section */}
      {/* 
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-4 p-5 border border-primary/20"
      >
        <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
          Why Choose Superlend for Earning?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>Automatically find the highest yields across multiple protocols</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>Real-time yield optimization and auto-compounding</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>Low gas fees through smart contract batching</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>Detailed analytics and performance tracking</span>
          </div>
        </div>
      </motion.div>
      */}
    </div>
  )
} 