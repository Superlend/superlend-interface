import React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/data/table/top-apy-opportunities';
import { ColumnDef } from '@tanstack/react-table'
import { getOpportunitiesData } from '@/queries/opportunities-api'
import { TOpportunity, TOpportunityType } from '@/types'

type TTopApyOpportunitiesProps = {
    tableData: TOpportunity[];
    columns: ColumnDef<TOpportunity>[];
}

type TProps = {
    opportunityType: TOpportunityType
}

export default async function TopApyOpportunitiesTable({ opportunityType }: TProps) {
    const data = await getOpportunitiesData({ type: opportunityType });

    // return (
    //     <DataTable columns={columns} data={data} />
    // )
}