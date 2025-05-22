'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { BodyText } from './ui/typography'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Add initial delay before showing the banner
        const timer = setTimeout(() => {
            setIsVisible(true)
            document.documentElement.classList.add('banner-visible')
        }, 1000)

        return () => {
            clearTimeout(timer)
            document.documentElement.classList.remove('banner-visible')
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        document.documentElement.classList.remove('banner-visible')
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 44 }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed top-0 left-0 w-full bg-gradient-to-r from-[#E5F3FF] via-[#F0F9FF] to-[#E5F3FF] border-b border-[#D1E9FF] z-[60] overflow-hidden"
                    style={{
                        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)'
                    }}
                >
                    <motion.div 
                        className="max-w-[1200px] h-full mx-auto px-4 flex items-center justify-between relative"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {/* Content */}
                        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2">
                            <motion.div
                                animate={{ rotate: [0, 35, 50, 0] }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 2
                                }}
                            >
                                🚀
                            </motion.div>
                            <BodyText level="body2" className="text-gray-800 text-center sm:text-left">
                                Maximize your USDC returns with SuperFund - Earn up to <span className="text-secondary-500 font-semibold">8% APY</span> across trusted lending protocols
                            </BodyText>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button 
                                    variant="secondaryOutline" 
                                    size="sm"
                                    className="whitespace-nowrap hidden sm:flex relative group overflow-hidden bg-white"
                                    onClick={() => window.open('https://funds.superlend.xyz', '_blank')}
                                >
                                    <span className="relative z-10 text-secondary-500">Launch SuperFund</span>
                                    <motion.div 
                                        className="absolute inset-0 bg-secondary-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                                        initial={false}
                                        whileHover={{ scale: 1.2 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </Button>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 hover:bg-white/50 rounded-full"
                                    onClick={handleClose}
                                >
                                    <X className="h-4 w-4 text-gray-500 hover:text-gray-800 transition-colors duration-200" />
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 