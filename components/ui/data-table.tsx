"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { BodyText } from "./typography";
import React from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronsUpDown, SortAscIcon } from "lucide-react";
import InfoTooltip from "../tooltips";

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
                                                    label={<ArrowUpWideNarrow className="w-4 h-4" />}
                                                    content={header.column.getIsSorted()}
                                                />
                                            }
                                            {header.column.getIsSorted() === 'desc' &&
                                                <InfoTooltip
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
        </div>
    )
}
