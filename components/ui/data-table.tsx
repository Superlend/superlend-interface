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
    RefreshCw,
} from 'lucide-react'
import InfoTooltip from '../tooltips/InfoTooltip'
import { Button } from './button'
import { ScrollArea, ScrollBar } from './scroll-area'
import { TOpportunityTable } from '@/types'
import useDimensions from '@/hooks/useDimensions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Utility function to format time difference
const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) {
        return `${days} day${days === 1 ? '' : 's'} ago`
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`
    } else if (minutes > 0) {
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`
    } else {
        return 'Just now'
    }
}

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
    onRefresh?: () => void
    lastRefreshTime?: number
    isRefreshing?: boolean
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
    onRefresh,
    lastRefreshTime,
    isRefreshing,
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

    // Calculate dynamic height based on rows and content
    const calculateTableHeight = React.useMemo(() => {
        if (!rows || rows.length === 0) {
            return 400 // Default height for empty table
        }
        
        const headerHeight = 60 // Approximate header height
        const paginationHeight = 80 // Approximate pagination height
        const baseRowHeight = 64 // Base row height for simple content (py-4 = 16px top + 16px bottom + content)
        const complexRowHeight = 88 // Height for rows with complex content (avatars, stacked icons, multi-line text)
        
        // Determine if we have complex content that needs more height
        const hasComplexContent = rows.some(row => {
            const cells = row.getVisibleCells()
            return cells.some(cell => {
                const columnId = cell.column.id
                // Check for columns that typically have complex content
                return columnId === 'collateral_tokens' || 
                       columnId === 'collateral_exposure' || 
                       columnId === 'tokenSymbol' ||
                       columnId === 'platformName' ||
                       columnId === 'apy_current' ||
                       columnId === 'maxAPY'
            })
        })
        
        const rowHeight = hasComplexContent ? complexRowHeight : baseRowHeight
        const contentHeight = headerHeight + (rows.length * rowHeight) + paginationHeight
        
        // Set reasonable min and max heights with responsive adjustments
        const minHeight = screenWidth < 768 ? 400 : 500 // Smaller minimum on mobile
        const maxHeight = screenWidth < 768 ? 700 : 900 // Smaller maximum on mobile
        
        return Math.max(minHeight, Math.min(maxHeight, contentHeight))
    }, [rows, screenWidth])

    return (
        <div className="bg-white bg-opacity-40 rounded-6 border border-transparent overflow-hidden">
            <ScrollArea className="h-auto" style={{ maxHeight: `${calculateTableHeight}px` }}>
                <Table>
                    <TableHeader className="[&_tr]:border-0">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent relative"
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
                                {onRefresh && lastRefreshTime && (
                                    <TableHead className={`${screenWidth < 768 ? 'w-[50px] min-w-[50px]' : 'w-[60px] min-w-[60px]'} pt-6 pb-3 pr-5 text-right pl-0 shrink-0`}>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <button
                                                        onClick={onRefresh}
                                                        disabled={isRefreshing}
                                                        className={`flex items-center justify-center ${screenWidth < 768 ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto`}
                                                    >
                                                        <RefreshCw 
                                                            size={screenWidth < 768 ? 16 : 20} 
                                                            className={`transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} 
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent 
                                                    side="bottom" 
                                                    align="end"
                                                    className="z-50"
                                                >
                                                    <p>{isRefreshing ? 'Refreshing...' : `Last updated ${formatTimeAgo(lastRefreshTime)}`}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableHead>
                                )}
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
                                    {onRefresh && lastRefreshTime && (
                                        <TableCell className={`${screenWidth < 768 ? 'w-[50px] min-w-[50px]' : 'w-[60px] min-w-[60px]'} py-4 pr-5 shrink-0`}>
                                            {/* Empty cell to match header structure */}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (onRefresh && lastRefreshTime ? 1 : 0)}
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
