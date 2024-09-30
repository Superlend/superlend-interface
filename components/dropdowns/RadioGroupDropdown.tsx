"use client"

import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { ChevronDownIcon } from 'lucide-react';

export default function RadioGroupDropdown({ triggerLabel, listData, defaultValue, value, onValueChange }: any) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="w-fit data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800">
                    {value.label || "Filter by"}
                    <ChevronDownIcon className={`w-4 h-4 ml-2 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
                    {listData.map((item: any) => (
                        <DropdownMenuRadioItem key={item.value} value={item} className="cursor-pointer hover:bg-gray-200">
                            {item.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
