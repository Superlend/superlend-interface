import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Coins, ArrowRight, DollarSign } from 'lucide-react'

export const EarnFlowStep: React.FC = () => {
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