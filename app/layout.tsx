import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'
import ContextProvider from '@/context'
import Footer from '@/components/Footer'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import ScrollToTop from '@/components/ScrollToTop'
import { Meta } from '@/components/Meta'
import { Toaster } from 'react-hot-toast'
import EasterEgg from '@/components/EasterEgg'
import { ShowAllMarketsProvider } from '@/context/show-all-markets-provider'
import MarketsBanner from '@/components/MarketsBanner'
// import { Inter } from "next/font/google";

// const inter = Inter({ subsets: ["latin"] });

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
    title: 'Superlend - Lend & Borrow Aggregator',
    description:
        'Lend, Borrow, Earn & level up your DeFi experience with best lending & borrowing aggregator with over 100+ markets.',
    icons: [
        { url: '/images/logos/favicon-16x16.png', sizes: '16x16' },
        { url: '/images/logos/favicon-32x32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
    ],
    openGraph: {
        type: 'website',
        url: 'https://app.superlend.xyz/',
        title: 'Superlend - Lend & Borrow Aggregator',
        description:
            'Lend, Borrow, Earn & level up your DeFi experience with best lending & borrowing aggregator with over 100+ markets.',
        siteName: 'Superlend - Lend & Borrow Aggregator',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    twitter: {
        title: 'Superlend - Lend & Borrow Aggregator',
        description:
            'Lend, Borrow, Earn & level up your DeFi experience with best lending & borrowing aggregator with over 100+ markets.',
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
                <ContextProvider>
                    <Toaster />
                    <EasterEgg />
                    <Header />
                    <MarketsBanner />
                    {children}
                    {/* <Footer /> */}
                </ContextProvider>
            </body>
        </html>
    )
}
