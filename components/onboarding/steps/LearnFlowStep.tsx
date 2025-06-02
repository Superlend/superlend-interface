import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Book, Users, Award } from 'lucide-react'

export const LearnFlowStep: React.FC = () => {
  const learningPaths = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "DeFi Fundamentals",
      description: "Smart contracts, protocols, and decentralized applications",
      topics: ["What is DeFi?", "Smart Contracts", "Wallets & Security", "Gas Fees"]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Lending & Borrowing",
      description: "How decentralized lending protocols work and their benefits",
      topics: ["Liquidity Pools", "Interest Rates", "Collateralization", "Liquidation"]
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Advanced Strategies",
      description: "Yield farming, staking, and portfolio optimization",
      topics: ["Yield Farming", "Staking Rewards", "Risk Management", "Portfolio Theory"]
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cream to-accent-cream/80 rounded-full flex items-center justify-center mb-6">
          <GraduationCap className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Learn DeFi with Superlend
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Master decentralized finance with our comprehensive educational resources. 
          From basics to advanced strategies, we'll guide your DeFi journey.
        </p>
      </motion.div>

      {/* Learning Paths */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {learningPaths.map((path, index) => (
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-gradient-to-br from-accent-cream/20 to-accent-cream/10 rounded-4 p-6 border border-accent-cream/30"
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto bg-accent-cream rounded-full flex items-center justify-center mb-4">
                    {path.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {path.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {path.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Key Topics
                  </p>
                  {path.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-accent-cream rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Features */}
      {/* <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 bg-gradient-to-r from-accent-cream/10 to-accent-cream/5 rounded-4 p-6 border border-accent-cream/20"
      >
        <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
          Your Learning Experience
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent-cream rounded-full mt-2 flex-shrink-0" />
            <span>Interactive tutorials and step-by-step guides</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent-cream rounded-full mt-2 flex-shrink-0" />
            <span>Real-world examples and case studies</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent-cream rounded-full mt-2 flex-shrink-0" />
            <span>Weekly market insights and analysis</span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent-cream rounded-full mt-2 flex-shrink-0" />
            <span>Community discussions and expert AMAs</span>
          </div>
        </div>
      </motion.div> */}
    </div>
  )
} 