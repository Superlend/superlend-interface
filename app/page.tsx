import React from 'react'
import HomePageComponents from './home/page-components'
import PortfolioProvider from '@/context/portfolio-provider'

export default async function HomePage() {
    return (
        <PortfolioProvider>
            <HomePageComponents />
        </PortfolioProvider>
    )
}
