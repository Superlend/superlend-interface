import React from 'react'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { getTokensData } from '@/queries/tokens-api'
import HomePageComponents from './page-components'

export default async function HomePage() {
    const queryClient = new QueryClient()

    await queryClient.prefetchQuery({
        queryKey: ['tokens'],
        queryFn: getTokensData,
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <HomePageComponents />
        </HydrationBoundary>
    )
}
