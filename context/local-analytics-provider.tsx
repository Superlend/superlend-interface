import { ReactNode } from 'react'
import { AnalyticsContext } from './amplitude-analytics-provider'
import { AnalyticsContextState } from './amplitude-analytics-provider'

const localAnalytics: AnalyticsContextState = {
    setUser: (id) => {
        console.log('Set user for analytics: ', id)
    },
    trackEvent: (name, data) => {
        console.log('Track event: ', name, data)
    },
    logEvent: (name, data) => {
        console.log('Log event: ', name, data)
    }
}


export const LocalAnalyticsProvider = ({ children }: { children: ReactNode }) => {
    return (
        <AnalyticsContext.Provider value={localAnalytics}>
            {children}
        </AnalyticsContext.Provider>
    )
}