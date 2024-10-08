"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { BodyText, Label } from "./typography";
import React from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown } from "lucide-react";
import InfoTooltip from "../tooltips/InfoTooltip";
import { Button } from "./button";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filters: string
    setFilters: React.Dispatch<React.SetStateAction<string>>
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filters,
    setFilters
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            globalFilter: filters
        },
        onGlobalFilterChange: setFilters,
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <div className="bg-white bg-opacity-40 rounded-xl border border-transparent overflow-hidden">
            <Table>
                <TableHeader className="[&_tr]:border-0">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="max-w-[200px]">
                                        <div className="flex items-center  gap-[8px]">
                                            <BodyText level="body2" weight="normal" className="text-gray-800 select-none">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </BodyText>
                                            {
                                                header.column.getCanSort() && (
                                                    <ChevronsUpDown
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="w-4 h-4 cursor-pointer hover:scale-[1.2] active:scale-[1] transition-transform"
                                                    />
                                                )
                                            }
                                            {header.column.getIsSorted() === 'asc' &&
                                                <InfoTooltip
                                                    size="sm"
                                                    label={<ArrowUpWideNarrow className="w-4 h-4" />}
                                                    content={header.column.getIsSorted()}
                                                />
                                            }
                                            {header.column.getIsSorted() === 'desc' &&
                                                <InfoTooltip
                                                    size="sm"
                                                    label={<ArrowDownWideNarrow className="w-4 h-4" />}
                                                    content={header.column.getIsSorted()}
                                                />
                                            }
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody className="bg-transparent">
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, rowIndex) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="border-0 bg-white"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className={`py-4 min-w-[120px] md:min-w-[100px] max-w-[200px] ${rowIndex == 0 ? "first:rounded-tl-xl last:rounded-tr-xl" : ""} ${rowIndex == table.getRowModel().rows.length - 1 ? "first:rounded-bl-xl last:rounded-br-xl" : ""}`}>
                                        <BodyText level={"body2"} weight={"medium"} className="">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </BodyText>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Pagination STARTS */}
            <div className="pagination-container flex items-center justify-end sm:justify-between gap-5 flex-wrap p-4">
                <div className="pagination-stats">
                    <Label size="medium" weight="medium">
                        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} pages
                    </Label>
                </div>
                <div className="pagination-controls flex items-center justify-end space-x-2 flex-1 shrink-0 ml-16">
                    <Label size="medium" weight="medium" className="shrink-0">
                        {table.getRowModel().rows.length.toLocaleString()} {" "}
                        of {table.getRowCount().toLocaleString()} rows
                    </Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.firstPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.lastPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            {/* Pagination ENDS */}
        </div>
    )
}
