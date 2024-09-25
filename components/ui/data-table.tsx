"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
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
        onGlobalFilterChange: setFilters
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
                                        <BodyText level="body2" weight="normal" className="text-gray-800">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </BodyText>
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
                                    <TableCell key={cell.id} className={`py-4 max-w-[200px] ${rowIndex == 0 ? "first:rounded-tl-xl last:rounded-tr-xl" : ""} ${rowIndex == table.getRowModel().rows.length - 1 ? "first:rounded-bl-xl last:rounded-br-xl" : ""}`}>
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
