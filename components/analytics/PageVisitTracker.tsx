'use client'

import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export const PageVisitTracker = () => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { trackEvent } = useAnalytics()

    useEffect(() => {
        // Function to convert search params to object
        function stringToObject(str: string): { [key: string]: any } {
            const obj: { [key: string]: any } = {}
            str.split('&').forEach((pair) => {
                if (pair) {
                    const [k, v] = pair.split('=')
                    obj[k.trim()] = v.trim()
                }
            })
            return obj
        }
        // Convert search params to object
        const searchParamsObject = stringToObject(searchParams?.toString() || '')
        // Log the object
        trackEvent('page_visit', { pathname, ...searchParamsObject })
    }, [trackEvent, pathname, searchParams])

    return null
}
