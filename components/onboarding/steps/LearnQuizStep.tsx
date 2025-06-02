import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Brain, Award, Trophy, ArrowRight } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'

export const LearnQuizStep: React.FC = () => {
  const { setPath, setStep } = useOnboardingContext()
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const questions = [
    {
      question: "What does DeFi stand for and what makes it different from traditional finance?",
      options: [
        "Digital Finance - it uses digital currencies",
        "Decentralized Finance - it operates without traditional intermediaries",
        "Distributed Finance - it spreads risk across multiple banks",
        "Direct Finance - it eliminates transaction fees"
      ],
      correct: 1,
      explanation: "DeFi stands for Decentralized Finance and operates without traditional intermediaries like banks, using smart contracts instead.",
      category: "Basics"
    },
    {
      question: "What is a smart contract in the context of DeFi?",
      options: [
        "A digital legal document stored on blockchain",
        "Self-executing code that automatically enforces agreements",
        "A cryptocurrency designed for contracts",
        "An AI system that negotiates deals"
      ],
      correct: 1,
      explanation: "Smart contracts are self-executing programs that run on blockchain networks and automatically enforce terms without human intervention.",
      category: "Basics"
    },
    {
      question: "What is yield farming in DeFi?",
      options: [
        "Growing crops using blockchain technology",
        "Mining cryptocurrency with farming equipment",
        "Providing liquidity to earn trading fees and token rewards",
        "Investing in agricultural tokens"
      ],
      correct: 2,
      explanation: "Yield farming involves providing liquidity to DeFi protocols to earn both trading fees and additional protocol tokens as rewards.",
      category: "Strategies"
    },
    {
      question: "Which strategy typically offers the lowest risk for DeFi beginners?",
      options: [
        "High-leverage yield farming",
        "Stablecoin lending",
        "Delta neutral strategies",
        "New protocol farming"
      ],
      correct: 1,
      explanation: "Stablecoin lending offers lower risk due to reduced price volatility, making it ideal for beginners to DeFi.",
      category: "Strategies"
    },
    {
      question: "What is the primary purpose of diversification in DeFi?",
      options: [
        "To maximize returns",
        "To reduce gas fees",
        "To spread risk across multiple protocols and assets",
        "To increase liquidity"
      ],
      correct: 2,
      explanation: "Diversification helps spread risk across multiple protocols, chains, and asset types to minimize potential losses.",
      category: "Risk Management"
    },
    {
      question: "What should you do BEFORE investing significant amounts in a new DeFi protocol?",
      options: [
        "Check if it offers the highest APY",
        "Research audits, team background, and community feedback",
        "Invest immediately to get early adopter bonuses",
        "Wait for celebrity endorsements"
      ],
      correct: 1,
      explanation: "Due diligence including checking audits, team backgrounds, and community feedback is crucial before investing in any DeFi protocol.",
      category: "Risk Management"
    }
  ]

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  const handleShowResults = () => {
    setShowResults(true)
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++
      }
    })
    return correct
  }

  const getScoreByCategory = () => {
    const categories = ['Basics', 'Strategies', 'Risk Management']
    const categoryScores: Record<string, { correct: number; total: number }> = {}
    
    categories.forEach(cat => {
      categoryScores[cat] = { correct: 0, total: 0 }
    })

    questions.forEach((question, index) => {
      const category = question.category
      categoryScores[category].total++
      if (selectedAnswers[index] === question.correct) {
        categoryScores[category].correct++
      }
    })

    return categoryScores
  }

  const allAnswered = questions.every((_, index) => selectedAnswers[index] !== undefined)
  const score = getScore()
  const categoryScores = getScoreByCategory()

  const getScoreMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage === 100) {
      return { message: "🎉 Perfect! You're ready to conquer DeFi!", color: "text-green-600", icon: <Trophy className="w-6 h-6 text-yellow-500" /> }
    } else if (percentage >= 80) {
      return { message: "🚀 Excellent! You have a strong DeFi foundation!", color: "text-green-600", icon: <Award className="w-6 h-6 text-green-500" /> }
    } else if (percentage >= 60) {
      return { message: "👍 Good start! Keep learning to build confidence!", color: "text-blue-600", icon: <Brain className="w-6 h-6 text-blue-500" /> }
    } else {
      return { message: "📚 Great effort! Our resources will help you master DeFi!", color: "text-purple-600", icon: <Brain className="w-6 h-6 text-purple-500" /> }
    }
  }

  const scoreMessage = getScoreMessage(score, questions.length)

  const handleStartEarnPath = () => {
    console.log('💰 Starting Earn Path from Learn Quiz')
    setPath('earn')
    setStep('earn-flow')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          DeFi Knowledge Assessment
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Test your understanding of DeFi fundamentals, strategies, and risk management. 
          This will help us tailor your experience and identify areas to explore further.
        </p>
      </motion.div>

      {/* Quiz Questions */}
      <div className="flex-1 space-y-6">
        {questions.map((question, questionIndex) => (
          <motion.div
            key={questionIndex}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: questionIndex * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground pr-4">
                {questionIndex + 1}. {question.question}
              </h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium shrink-0">
                {question.category}
              </span>
            </div>

            <div className="space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[questionIndex] === optionIndex
                const isCorrect = optionIndex === question.correct
                const showCorrectness = showResults

                return (
                  <motion.div
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                      ${!showResults && isSelected 
                        ? 'border-purple-300 bg-purple-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${showCorrectness && isCorrect 
                        ? 'border-green-300 bg-green-50 shadow-lg' 
                        : ''
                      }
                      ${showCorrectness && isSelected && !isCorrect 
                        ? 'border-red-300 bg-red-50 shadow-lg' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{option}</span>
                      {showCorrectness && (
                        <div>
                          {isCorrect && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Explanation */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
              >
                <p className="text-sm text-blue-800 leading-relaxed">
                  <span className="font-semibold">💡 Explanation:</span> {question.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quiz Actions and Results */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8"
      >
        {!showResults ? (
          <div className="text-center">
            <button
              onClick={handleShowResults}
              disabled={!allAnswered}
              className={`
                px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300
                ${allAnswered
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {allAnswered ? 'Show My Results' : `Answer all ${questions.length} questions to continue`}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border-2 border-purple-200 text-center shadow-xl">
              <div className="flex items-center justify-center space-x-3 mb-4">
                {scoreMessage.icon}
                <h3 className="text-2xl font-bold text-foreground">
                  Quiz Complete!
                </h3>
              </div>
              
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {score} / {questions.length}
              </div>
              
              <p className={`text-lg font-medium mb-4 ${scoreMessage.color}`}>
                {scoreMessage.message}
              </p>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {Object.entries(categoryScores).map(([category, scores]) => (
                  <div key={category} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {scores.correct}/{scores.total}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(scores.correct / scores.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
              <h4 className="font-bold text-gray-900 mb-4 text-center">🎯 What&apos;s Next?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/80 rounded-xl p-5 hover:shadow-md transition-all duration-300"
                >
                  <p className="font-semibold text-gray-800 mb-3">Ready to Earn? 💰</p>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Start with our curated low-risk strategies and begin your DeFi journey with confidence.
                  </p>
                  <button 
                    onClick={handleStartEarnPath}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    <span>Start Earning Now</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/80 rounded-xl p-5 hover:shadow-md transition-all duration-300"
                >
                  <p className="font-semibold text-gray-800 mb-3">Want to Learn More? 📚</p>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Explore our comprehensive guides and stay updated with the latest DeFi developments.
                  </p>
                  <a 
                    href="https://blog.superlend.xyz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-4 py-2 bg-white border-2 border-green-300 text-green-800 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200"
                  >
                    <span>Visit Our Blog</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 