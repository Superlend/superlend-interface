'use client'

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    VisibilityState,
    SortingState,
    PaginationState,
    Column,
} from '@tanstack/react-table'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { BodyText } from '../ui/typography'
import React, { CSSProperties } from 'react'
import {
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
} from 'lucide-react'
import InfoTooltip from '../tooltips/InfoTooltip'
import { Button } from '../ui/button'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { TOpportunityTable } from '@/types'
import useDimensions from '@/hooks/useDimensions'
import Link from 'next/link'

interface OpportunitiesDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    // filters: string
    // setFilters: React.Dispatch<React.SetStateAction<string>>
    handleRowClick?: any
    columnVisibility?: VisibilityState
    setColumnVisibility?: any
    // initialState?: any
    // sorting?: SortingState
    // setSorting?: React.Dispatch<React.SetStateAction<SortingState>>
    // pagination: PaginationState
    // setPagination: any
    // totalPages: number
}

export function OpportunitiesDataTable<TData, TValue>({
    columns,
    data,
    handleRowClick,
    columnVisibility,
    setColumnVisibility,
    // initialState,
    // sorting,
    // setSorting,
}: OpportunitiesDataTableProps<TData, TValue>) {
    const { width: screenWidth } = useDimensions()

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            columnVisibility,
            // sorting,
        },
        initialState: {
            // ...initialState,
            columnPinning: {
                left: ['tokenSymbol'],
            },
        },
        onColumnVisibilityChange: setColumnVisibility,
        // onSortingChange: setSorting,
        enableSortingRemoval: false,
        manualPagination: true,
    })

    const rows = table.getRowModel().rows

    const getCommonPinningStyles = (
        column: Column<TOpportunityTable>,
        {
            isHeader,
        }: {
            isHeader?: boolean
        }
    ): CSSProperties => {
        const isPinned = column.getIsPinned()
        const isLastLeftPinnedColumn =
            isPinned === 'left' && column.getIsLastColumn('left')
        const isFirstRightPinnedColumn =
            isPinned === 'right' && column.getIsFirstColumn('right')

        if (screenWidth < 768) {
            return {
                left:
                    isPinned === 'left'
                        ? `${column.getStart('left')}px`
                        : undefined,
                right:
                    isPinned === 'right'
                        ? `${column.getAfter('right')}px`
                        : undefined,
                // opacity: isPinned ? 0.95 : 1,
                backgroundColor: isPinned && isHeader ? '#d2eefd' : 'inherit',
                position: isPinned ? 'sticky' : 'relative',
                width: column.getSize(),
                zIndex: isPinned ? 1 : 0,
            }
        }

        return {}
    }

    return (
        <div className="bg-white bg-opacity-40 rounded-6 p-3 pt-0 border border-transparent overflow-hidden">
            <ScrollArea className="h-[50vh]">
                <Table>
                    <TableHeader className="[&_tr]:border-0">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent rounded-4 overflow-hidden"
                            >
                                {headerGroup.headers.map((header) => {
                                    const { column } = header
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="h-auto py-3 pl-8"
                                            style={{
                                                ...getCommonPinningStyles(
                                                    column as unknown as Column<
                                                        TOpportunityTable,
                                                        unknown
                                                    >,
                                                    {
                                                        isHeader: true,
                                                    }
                                                ),
                                            }}
                                        >
                                            <div className="flex items-center gap-[8px]">
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="text-gray-700 select-none"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                </BodyText>
                                                {header.column.getCanSort() && (
                                                    <ChevronsUpDown
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="w-4 h-4 cursor-pointer hover:scale-[1.2] active:scale-[1] transition-transform"
                                                    />
                                                )}
                                                {!!header.column.getIsSorted() && (
                                                    <InfoTooltip
                                                        size="sm"
                                                        side="bottom"
                                                        label={
                                                            header.column.getIsSorted() ===
                                                                'asc' ? (
                                                                <ArrowUpWideNarrow className="w-4 h-4" />
                                                            ) : (
                                                                <ArrowDownWideNarrow className="w-4 h-4" />
                                                            )
                                                        }
                                                        content={
                                                            header.column.getIsSorted() ===
                                                                'asc'
                                                                ? 'Lowest to Highest'
                                                                : 'Highest to Lowest'
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="bg-transparent">
                        {rows?.length ? (
                            rows.map((row, rowIndex) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    className="border-0 bg-white"
                                    onClick={
                                        !handleRowClick || screenWidth < 768
                                            ? undefined
                                            : () => handleRowClick(row.original)
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const { column } = cell
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={`py-4 w-[150px] min-w-[150px] max-w-[200px] pl-[32px] ${rowIndex == 0 ? 'first:rounded-tl-5 last:rounded-tr-5' : ''} ${rowIndex == rows.length - 1 ? 'first:rounded-bl-5 last:rounded-br-5' : ''} ${!!handleRowClick ? 'cursor-pointer' : ''}`}
                                                style={{
                                                    ...getCommonPinningStyles(
                                                        column as unknown as Column<
                                                            TOpportunityTable,
                                                            unknown
                                                        >,
                                                        {
                                                            isHeader: false,
                                                        }
                                                    ),
                                                }}
                                            >
                                                {/* <Link
                                                    href={{
                                                        pathname: 'position-management',
                                                        query: {
                                                            token: row.original.token,
                                                            chain_id: row.original.chain_id,
                                                            protocol_identifier: row.original.protocol_identifier,
                                                            position_type: row.original.position_type,
                                                        },
                                                    }}
                                                > */}
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                                {/* </Link> */}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
