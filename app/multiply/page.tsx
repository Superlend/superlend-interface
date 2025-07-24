'use client'

import MainContainer from "@/components/MainContainer"
import { DataTable } from "@/components/ui/data-table"
import { useGetLoopPairs } from "@/hooks/useGetLoopPairs"
import { columns as columnsForLoops } from '@/data/table/loop-opportunities'
import { useState } from "react"

export default function MultiplyPage() {
    const { pairs: loopPairs, isLoading: isLoadingLoopPairs } = useGetLoopPairs()
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    return (
        <MainContainer>
            <DataTable
                columns={columnsForLoops}
                data={loopPairs}
                pagination={pagination}
                setPagination={setPagination}
                totalPages={Math.ceil(loopPairs.length / 10)}
                filters={''}
                setFilters={() => { }}
            />
        </MainContainer>
    )
}