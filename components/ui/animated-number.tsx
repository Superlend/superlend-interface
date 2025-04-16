'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number | string
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  hasLowestValuePrefix?: boolean
}

export default function AnimatedNumber({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  hasLowestValuePrefix = false
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValueRef = useRef<number>(0)
  const targetValueRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)
  const frameIdRef = useRef<number | null>(null)
  
  // Convert string values to numbers, handling any special prefixes
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
    : value
  
  useEffect(() => {
    // Store the target value
    targetValueRef.current = numericValue
    previousValueRef.current = displayValue
    startTimeRef.current = null
    
    // Cancel any existing animation
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current)
    }
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }
      
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic function
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOut(progress)
      
      const currentValue = previousValueRef.current + 
        (targetValueRef.current - previousValueRef.current) * easedProgress
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        frameIdRef.current = requestAnimationFrame(animate)
      }
    }
    
    frameIdRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [numericValue, duration])
  
  // Format the displayed value
  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  
  return (
    <span className={className}>
      {hasLowestValuePrefix && '< '}
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
} 