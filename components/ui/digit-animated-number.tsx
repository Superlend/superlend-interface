'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DigitAnimatedNumberProps {
  value: number | string
  className?: string
  prefix?: string
  suffix?: string
  hasLowestValuePrefix?: boolean
  digitClassName?: string
}

// The array of digits in a vertical sequence for the wheel
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

// Component for a single digit wheel
const DigitWheel = ({ 
  digit, 
  className = '' 
}: { 
  digit: string, 
  className?: string 
}) => {
  const digitIndex = parseInt(digit)
  const prevDigitRef = useRef<number>(0)
  const [spinDirection, setSpinDirection] = useState(1) // 1 for up, -1 for down
  
  // Determine spin direction based on current and previous digit
  useEffect(() => {
    // Check if we should use the shorter path (e.g. 9->0 should spin down, not up through all digits)
    if (!isNaN(digitIndex)) {
      const prevDigit = prevDigitRef.current
      
      if (prevDigit === digitIndex) return
      
      // Calculate the shortest direction to spin
      const clockwiseDistance = (digitIndex - prevDigit + 10) % 10
      const counterClockwiseDistance = (prevDigit - digitIndex + 10) % 10
      
      setSpinDirection(clockwiseDistance <= counterClockwiseDistance ? 1 : -1)
      prevDigitRef.current = digitIndex
    }
  }, [digitIndex])

  return (
    <div className={`relative overflow-hidden inline-block text-center ${className}`} 
        //  style={{ width: '0.6em', minWidth: '0.6em' }}
         >
      <motion.div
        key={`wheel-${digit}`}
        initial={{ 
          y: spinDirection > 0 ? '100%' : '-100%' 
        }}
        animate={{ 
          y: 0 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30, 
          mass: 0.8,
          delay: 0.05
        }}
        className="w-full flex justify-center items-center"
      >
        {digit}
      </motion.div>
    </div>
  )
}

// Fixed-width container for consistent spacing
const DigitContainer = ({ children, isSymbol = false }: { children: React.ReactNode, isSymbol?: boolean }) => (
  <span 
    className="inline-block text-center" 
    style={{ 
      width: isSymbol ? 'auto' : 'auto',
      minWidth: isSymbol ? 'auto' : 'auto',
      display: 'inline-flex',
      justifyContent: 'center'
    }}
  >
    {children}
  </span>
)

// Component that splits a number into individual digits and animates each one
export default function DigitAnimatedNumber({
  value,
  className = '',
  prefix: propPrefix = '',
  suffix: propSuffix = '',
  hasLowestValuePrefix = false,
  digitClassName = ''
}: DigitAnimatedNumberProps) {
  const [currentValue, setCurrentValue] = useState<string>('0')
  const [prevValue, setPrevValue] = useState<string>('0')
  const [extractedPrefix, setExtractedPrefix] = useState<string>('')
  const [extractedSuffix, setExtractedSuffix] = useState<string>('')
  
  // Format the number and update it when the value changes
  useEffect(() => {
    setPrevValue(currentValue)
    
    // Handle string values with prefixes and suffixes
    if (typeof value === 'string') {
      // Extract prefix (like $ or < $)
      let formattedValue = value.toString();
      let valuePrefix = '';
      let valueSuffix = '';
      
      // Extract prefix (usually $ or < $)
      const prefixMatch = formattedValue.match(/^[^0-9]*/)
      if (prefixMatch && prefixMatch[0]) {
        valuePrefix = prefixMatch[0];
        formattedValue = formattedValue.substring(valuePrefix.length);
      }
      
      // Extract suffix (like K, M, B)
      const suffixMatch = formattedValue.match(/[A-Za-z]+$/)
      if (suffixMatch && suffixMatch[0]) {
        valueSuffix = suffixMatch[0];
        formattedValue = formattedValue.substring(0, formattedValue.length - valueSuffix.length);
      }
      
      setExtractedPrefix(valuePrefix);
      setExtractedSuffix(valueSuffix);
      
      // Parse the numeric part
      const numericValue = parseFloat(formattedValue.replace(/[^\d.-]/g, ''))
      if (!isNaN(numericValue)) {
        formattedValue = numericValue.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      } else {
        formattedValue = '0'
      }
      
      setCurrentValue(formattedValue)
    } else {
      // Number value
      const formattedValue = value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      setCurrentValue(formattedValue)
      setExtractedPrefix(propPrefix)
      setExtractedSuffix(propSuffix)
    }
  }, [value, propPrefix, propSuffix])

  // Split the value into individual characters (digits, commas, decimals)
  const characters = currentValue.split('')
  
  // Use extracted prefix if available, otherwise use prop prefix
  const displayPrefix = extractedPrefix || propPrefix
  // Use extracted suffix if available, otherwise use prop suffix
  const displaySuffix = extractedSuffix || propSuffix
  
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {hasLowestValuePrefix && <span style={{ marginRight: '0.15em' }}>{'<'}</span>}
      {displayPrefix && <span style={{ marginRight: '0.05em' }}>{displayPrefix}</span>}
      
      <span className="inline-flex">
        {characters.map((char, index) => {
          // Check if the character is a digit or a symbol (comma, decimal point)
          const isDigit = /\d/.test(char)
          
          return (
            <DigitContainer key={`${index}-${char}`} isSymbol={!isDigit}>
              {isDigit ? (
                <DigitWheel 
                  digit={char} 
                  className={digitClassName} 
                />
              ) : (
                // Render symbols without animation
                <span className={digitClassName}>
                   {char}
                </span>
              )}
            </DigitContainer>
          )
        })}
      </span>
      
      {displaySuffix && <span className="inline-block ml-0.5">{displaySuffix}</span>}
    </span>
  )
} 