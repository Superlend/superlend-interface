import React from 'react'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { getTokensData } from '@/queries/tokens-api'
import HomeComponents from './home-components'

export default async function HomePage() {
    const queryClient = new QueryClient()

    await queryClient.prefetchQuery({
        queryKey: ['tokens'],
        queryFn: getTokensData,
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <HomeComponents />
        </HydrationBoundary>
    )
}
