// import { shouldBeDefined } from '@lib/utils/assert/shouldBeDefined'
// import { ChildrenProp } from '@lib/ui/props'
import { AmplitudeAnalyticsProvider } from './amplitude-analytics-provider'
import { LocalAnalyticsProvider } from './local-analytics-provider'
import { ReactNode } from 'react'

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
    if (process.env.NODE_ENV === 'production') {
        return (
            <AmplitudeAnalyticsProvider
                apiKey={shouldBeDefined(
                    process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
                )}
            >
                {children}
            </AmplitudeAnalyticsProvider>
        )
    }

    return <LocalAnalyticsProvider>{children}</LocalAnalyticsProvider>
}

export function shouldBeDefined<T>(
    value: T | undefined,
    valueName: string = 'value'
): T {
    if (value === undefined) {
        throw new Error(`${valueName} is undefined`)
    }

    return value
}
