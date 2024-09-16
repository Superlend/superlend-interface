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

export default function GraphDropdown() {
    const [position, setPosition] = React.useState("bottom")
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="w-fit data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800">
                    Graph Dropdown Menu
                    <ChevronDownIcon className={`w-4 h-4 ml-2 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                    <DropdownMenuRadioItem value="top" className="cursor-pointer hover:bg-gray-200">Top</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="bottom" className="cursor-pointer hover:bg-gray-200">Bottom</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="right" className="cursor-pointer hover:bg-gray-200">Right</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
