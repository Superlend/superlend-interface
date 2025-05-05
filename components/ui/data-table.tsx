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
import { BodyText, Label } from './typography'
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
import { Button } from './button'
import { ScrollArea, ScrollBar } from './scroll-area'
import { TOpportunityTable } from '@/types'
import useDimensions from '@/hooks/useDimensions'

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filters: string
    setFilters: React.Dispatch<React.SetStateAction<string>>
    handleRowClick?: any
    columnVisibility?: VisibilityState
    setColumnVisibility?: any
    initialState?: any
    sorting?: SortingState
    setSorting?: React.Dispatch<React.SetStateAction<SortingState>>
    pagination: PaginationState
    setPagination: any
    totalPages: number
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filters,
    setFilters,
    handleRowClick,
    columnVisibility,
    setColumnVisibility,
    initialState,
    sorting,
    setSorting,
    pagination,
    setPagination,
    totalPages,
}: DataTableProps<TData, TValue>) {
    const { width: screenWidth } = useDimensions()

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            globalFilter: filters,
            columnVisibility,
            sorting,
            pagination,
        },
        initialState: {
            ...initialState,
            columnPinning: {
                left: ['tokenSymbol'],
            },
        },
        onGlobalFilterChange: setFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        onPaginationChange: setPagination,
        pageCount: Math.ceil(data.length / pagination.pageSize),
        manualPagination: false,
    })

    const rows = table.getRowModel().rows
    const totalRowCount = table.getFilteredRowModel()?.rows?.length || 0
    const calculatedPages = pagination?.pageSize ? Math.ceil(totalRowCount / pagination.pageSize) : 0

    const handleFirstPage = () => {
        if (!pagination) return;
        setPagination({ ...pagination, pageIndex: 0 })
    }

    const handlePreviousPage = () => {
        if (!pagination) return;
        setPagination({
            ...pagination,
            pageIndex: Math.max(0, pagination.pageIndex - 1),
        })
    }

    const handleNextPage = () => {
        if (!pagination) return;
        setPagination({
            ...pagination,
            pageIndex: Math.min((totalPages || 1) - 1, pagination.pageIndex + 1),
        })
    }

    const handleLastPage = () => {
        if (!pagination) return;
        setPagination({ ...pagination, pageIndex: (totalPages || 1) - 1 })
    }

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
        <div className="bg-white bg-opacity-40 rounded-6 border border-transparent overflow-hidden">
            <ScrollArea className="h-[calc(100vh-250px)] max-h-[500px]">
                <Table>
                    <TableHeader className="[&_tr]:border-0">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
                                {headerGroup.headers.map((header) => {
                                    const { column } = header
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="pt-6 pb-3 pl-5"
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
                                                    className="text-gray-700 select-none truncate"
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
                                            : () => {
                                                try {
                                                    if (!row.original) {
                                                        console.warn('Row original data is undefined');
                                                        return;
                                                    }
                                                    handleRowClick(row.original);
                                                } catch (error) {
                                                    console.error('Error in handleRowClick:', error);
                                                }
                                            }
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const { column } = cell
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={`max-w-[100px] md:max-w-[200px] py-4 pl-5 max-md:pr-0 ${rowIndex == 0 ? 'first:rounded-tl-5 last:rounded-tr-5' : ''} ${rowIndex == rows.length - 1 ? 'first:rounded-bl-5 last:rounded-br-5' : ''} ${!!handleRowClick ? 'cursor-pointer' : ''}`}
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
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
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
            {/* Pagination STARTS */}
            {!!data.length && (
                <div className="pagination-container flex items-center justify-end sm:justify-between gap-5 flex-wrap py-4 px-4 sm:px-8">
                    <div className="pagination-stats">
                        <Label
                            size="medium"
                            weight="medium"
                            className="text-gray-700"
                        >
                            Page {pagination?.pageIndex !== undefined ? pagination.pageIndex + 1 : 1} of {calculatedPages || 1}
                        </Label>
                    </div>
                    <div className="pagination-controls flex items-center justify-end space-x-2 flex-1 shrink-0 ml-16">
                        <Label
                            size="medium"
                            weight="medium"
                            className="hidden lg:block shrink-0 text-gray-700"
                        >
                            Showing {rows.length} row{rows.length > 1 ? 's' : ''}
                        </Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFirstPage}
                            disabled={pagination?.pageIndex === undefined || pagination.pageIndex === 0}
                            aria-label="First Page"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={pagination?.pageIndex === undefined || pagination.pageIndex === 0}
                            aria-label="Previous Page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={
                                pagination?.pageIndex === undefined || pagination.pageIndex >= (calculatedPages - 1 || 0)
                            }
                            aria-label="Next Page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLastPage}
                            disabled={
                                pagination?.pageIndex === undefined || pagination.pageIndex >= (calculatedPages - 1 || 0)
                            }
                            aria-label="Last Page"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}
            {/* Pagination ENDS */}
        </div>
    )
}
