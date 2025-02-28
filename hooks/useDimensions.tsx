'use client'

import { debounce } from '@/lib/utils'
import { useLayoutEffect, useState } from 'react'

type DimensionsType = {
    width: number
    height: number
}

const dimensionsInit = {
    height: 0,
    width: 0,
}

export default function useDimensions() {
    const [dimensions, setDimensions] = useState<DimensionsType>(dimensionsInit)

    useLayoutEffect(() => {
        const updateDimensions = function () {
            const { innerWidth, innerHeight } = window

            setDimensions((prev) => {
                // Only update if dimensions actually changed
                if (prev.width === innerWidth && prev.height === innerHeight) {
                    return prev
                }
                return { width: innerWidth, height: innerHeight }
            })
        }

        const debouncedUpdate = debounce(updateDimensions, 100)
        updateDimensions()

        window.addEventListener('resize', debouncedUpdate)
        return () => {
            window.removeEventListener('resize', debouncedUpdate)
        }
    }, [])

    return dimensions
}
