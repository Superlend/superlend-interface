import React from 'react'
import DiscoverPageComponents from './page-components'
// import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
// import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'

export default async function DiscoverPage() {
    // const queryClient = new QueryClient()

    // await queryClient.prefetchQuery({
    //     queryKey: ['opportunities'],
    //     queryFn: () => useGetOpportunitiesData({ type: "lend" }),
    // })

    return (
        // <HydrationBoundary state={dehydrate(queryClient)}>
        <DiscoverPageComponents />
        //  </HydrationBoundary>
    )
}
