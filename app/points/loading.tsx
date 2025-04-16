import React from 'react'
import MainContainer from '@/components/MainContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <MainContainer className="px-0 flex flex-col gap-6">
      {/* Page Header Skeleton */}
      <section className="px-5 mb-4">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </section>
      
      {/* Points Overview Skeleton */}
      <section className="px-5">
        <Card>
          <CardHeader className="bg-gray-100">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-10 w-24 mb-4" />
                  <Skeleton className="h-2 w-full mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                
                <div className="p-4 rounded-md bg-gray-50 border border-gray-100">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-8 w-36" />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-32" />
                </div>
                
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Ways to Earn Skeleton */}
      <section className="px-5 mb-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-md border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </MainContainer>
  )
} 