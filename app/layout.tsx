import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'
import ContextProvider from '@/context'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import ScrollToTop from '@/components/ScrollToTop'
import { Toaster } from 'react-hot-toast'
import EasterEgg from '@/components/EasterEgg'
// import { DebugPortfolioTools } from '@/components/debug/DebugPortfolioTools'
// import { ShowAllMarketsProvider } from '@/context/show-all-markets-provider'
import MarketsBanner from '@/components/MarketsBanner'
import Script from 'next/script'
// import { DebugPortfolioTools } from '@/components/debug/DebugPortfolioTools'

export const metadata: Metadata = {
    metadataBase: new URL('https://app.superlend.xyz'),
    alternates: {
        canonical: '/',
        languages: {
            'en-US': '/en-US',
        },
    },
    keywords: [
        'DeFi',
        'Lend',
        'Borrow',
        'Money Markets',
        'Aggregator',
        'DeFi rates',
        'Earn in DeFi',
        'Borrow USDC',
        'Earn USDC',
    ],
    title: 'Superlend | Lending & Borrowing Aggregator for Maximum Yield',
    description:
        'Lend, Borrow, and Earn across 150+ DeFi markets with Superlend — the top aggregator for Lending & Borrowing.',
    icons: [
        { url: '/images/logos/favicon-16x16.png', sizes: '16x16' },
        { url: '/images/logos/favicon-32x32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
    ],
    openGraph: {
        type: 'website',
        url: 'https://app.superlend.xyz/',
        title: 'Superlend | Lending & Borrowing Aggregator for Maximum Yield',
        description:
            'Lend, Borrow, and Earn across 150+ DeFi markets with Superlend — the top aggregator for Lending & Borrowing.',
        siteName: 'Superlend | Lending & Borrowing Aggregator for Maximum Yield',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    twitter: {
        title: 'Superlend | Lending & Borrowing Aggregator for Maximum Yield',
        description:
            'Lend, Borrow, and Earn across 150+ DeFi markets with Superlend — the top aggregator for Lending & Borrowing.',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    verification: {
        google: '0j8SKqrdLCo956fdCB-_rUdpg8wEPmuU3TTlvbei_ro',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookies = headers().get('cookie')
    const GTM_ID = process.env.NEXT_GTM_ID || ''
    const GA_ID = process.env.NEXT_GA_ID || ''

    return (
        <html lang="en">
            <body className={`bg-[#B4E2FB] font-sans max-md:pb-[50px]`}>
                <ScrollToTop />
                <GoogleTagManager gtmId={GTM_ID} />
                <GoogleAnalytics gaId={GA_ID} />
                
                {/* Zoho SalesIQ Integration */}
                <Script id="zoho-salesiq-setup" strategy="afterInteractive">
                    {`window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`}
                </Script>
                <Script 
                    id="zsiqscript" 
                    src="https://salesiq.zohopublic.in/widget?wc=siq13bbfecd288b79f4b1f8f420e104879a33497d7b38eeeaf9861740a9e168479d" 
                    strategy="afterInteractive"
                />
                
                <ContextProvider>
                    <Toaster />
                    <EasterEgg />
                    <Header />
                    <MarketsBanner />
                    {children}
                    {/* <Footer /> */}
                    {/* <DebugPortfolioTools /> */}
                </ContextProvider>
            </body>
        </html>
    )
}
