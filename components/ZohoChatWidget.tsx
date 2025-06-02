'use client'

import Script from 'next/script'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import useDimensions from '@/hooks/useDimensions'
import { useMemo, useEffect } from 'react'

// TypeScript declaration for Zoho SalesIQ
declare global {
    interface Window {
        $zoho?: {
            salesiq?: {
                chat?: {
                    visibility?: (action: 'show' | 'hide') => void
                }
            }
        }
    }
}

export default function ZohoChatWidget() {
    const { isOpen: isOnboardingOpen } = useOnboardingContext()
    const { width: screenWidth } = useDimensions()
    const isMobile = useMemo(() => screenWidth > 0 && screenWidth <= 768, [screenWidth])
    
    // Hide chat widget if onboarding is open on mobile
    const shouldHideChat = isOnboardingOpen && isMobile

    useEffect(() => {
        // Control Zoho widget visibility
        if (typeof window !== 'undefined' && window.$zoho && window.$zoho.salesiq) {
            if (shouldHideChat) {
                // Hide the chat widget
                if (window.$zoho.salesiq.chat && window.$zoho.salesiq.chat.visibility) {
                    window.$zoho.salesiq.chat.visibility('hide')
                }
            } else {
                // Show the chat widget
                if (window.$zoho.salesiq.chat && window.$zoho.salesiq.chat.visibility) {
                    window.$zoho.salesiq.chat.visibility('show')
                }
            }
        }
    }, [shouldHideChat])

    return (
        <>
            {/* Zoho SalesIQ Integration */}
            <Script id="zoho-salesiq-setup" strategy="afterInteractive">
                {`window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`}
            </Script>
            <Script 
                id="zsiqscript" 
                src="https://salesiq.zohopublic.in/widget?wc=siq13bbfecd288b79f4b1f8f420e104879a33497d7b38eeeaf9861740a9e168479d" 
                strategy="afterInteractive"
            />
            
            {/* Additional styling to hide chat widget when needed */}
            {shouldHideChat && (
                <style jsx global>{`
                    #zsiqwidget, 
                    .zsiq-float,
                    #siq-container,
                    [id*="zsiq"],
                    [class*="zsiq"] {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }
                `}</style>
            )}
        </>
    )
} 