import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Brain, Award } from 'lucide-react'

export const LearnQuizStep: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const questions = [
    {
      question: "What does DeFi stand for?",
      options: [
        "Digital Finance",
        "Decentralized Finance",
        "Distributed Finance",
        "Direct Finance"
      ],
      correct: 1,
      explanation: "DeFi stands for Decentralized Finance - financial services without traditional intermediaries."
    },
    {
      question: "What is a smart contract?",
      options: [
        "A digital legal document",
        "Self-executing code on the blockchain",
        "A type of cryptocurrency",
        "A trading algorithm"
      ],
      correct: 1,
      explanation: "Smart contracts are self-executing programs that run on blockchain networks."
    },
    {
      question: "What does APY represent?",
      options: [
        "Annual Percentage Yield",
        "Average Price Year",
        "Automated Payment Yield",
        "Asset Price Yield"
      ],
      correct: 0,
      explanation: "APY (Annual Percentage Yield) shows the real rate of return, including compound interest."
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

  const allAnswered = questions.every((_, index) => selectedAnswers[index] !== undefined)
  const score = getScore()

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
          <Brain className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Quick DeFi Knowledge Check
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Test your understanding with these basic DeFi questions. 
          Don't worry - this is just to gauge your current knowledge level!
        </p>
      </motion.div>

      {/* Quiz Questions */}
      <div className="flex-1 space-y-6">
        {questions.map((question, questionIndex) => (
          <motion.div
            key={questionIndex}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: questionIndex * 0.2 }}
            className="bg-white rounded-4 p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {questionIndex + 1}. {question.question}
            </h3>

            <div className="space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[questionIndex] === optionIndex
                const isCorrect = optionIndex === question.correct
                const showCorrectness = showResults

                return (
                  <div
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                    className={`
                      p-4 rounded-3 border-2 cursor-pointer transition-all duration-300
                      ${!showResults && isSelected 
                        ? 'border-accent-cream bg-accent-cream/10' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${showCorrectness && isCorrect 
                        ? 'border-green-300 bg-green-50' 
                        : ''
                      }
                      ${showCorrectness && isSelected && !isCorrect 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{option}</span>
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
                  </div>
                )
              })}
            </div>

            {/* Explanation */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-3"
              >
                <p className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {question.explanation}
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
                px-8 py-3 rounded-4 font-medium transition-all duration-300
                ${allAnswered
                  ? 'bg-accent-cream text-foreground hover:bg-accent-cream/80'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {allAnswered ? 'Show Results' : 'Answer all questions to continue'}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-accent-cream/10 to-accent-cream/5 rounded-4 p-6 border border-accent-cream/20 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Award className="w-8 h-8 text-accent-cream" />
              <h3 className="text-xl font-semibold text-foreground">
                Quiz Complete!
              </h3>
            </div>
            
            <p className="text-lg text-gray-700 mb-4">
              You scored <strong>{score} out of {questions.length}</strong>
            </p>
            
            <div className="text-sm text-gray-600">
              {score === questions.length && (
                <p>🎉 Perfect score! You have a great foundation in DeFi basics.</p>
              )}
              {score === questions.length - 1 && (
                <p>👏 Excellent work! You're well on your way to DeFi mastery.</p>
              )}
              {score < questions.length - 1 && (
                <p>📚 Great start! Our learning resources will help you dive deeper into DeFi.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 