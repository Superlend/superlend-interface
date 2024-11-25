"use client"

import React, { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from '../ui/button';
import { ChevronDownIcon, Circle } from 'lucide-react';
import useDimensions from '@/hooks/useDimensions';
import { Badge } from '../ui/badge';
import InfoTooltip from '../tooltips/InfoTooltip';

export default function RadioGroupDropdown({
    triggerLabel,
    defaultValue,
    listData,
    value,
    onValueChange,
    disableFilterOptions
}: any) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { width: screenWidth } = useDimensions();
    const isDesktop = screenWidth > 768;

    useEffect(() => {
        if (disableFilterOptions.includes(value.value) && listData.length > 0) {
            onValueChange((state: any) => {
                const updatedField = listData?.find((option: any) => !disableFilterOptions?.includes(option.value))
                return updatedField || listData[0]
            })
            return
        }
        return
    }, [disableFilterOptions.length])

    function handleValueChange(value: any) {
        return () => {
            onValueChange(value);
            setIsOpen(false);
        }
    }

    if (isDesktop) {
        return (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button size="lg" className="w-fit data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800">
                        <span className="font-medium">{value.label || "Filter by"}</span>
                        <ChevronDownIcon className={`w-4 h-4 ml-2 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
                        {listData.map((item: any) => (
                            <DropdownMenuRadioItem
                                key={item.value}
                                value={item}
                                title={item.label}
                                className="cursor-pointer hover:bg-gray-200 flex items-center justify-between gap-2"
                                disabled={disableFilterOptions.includes(item.value)}
                            >
                                <span className="block max-w-[250px]">{item.label}</span>
                                {disableFilterOptions.includes(item.value) && <Badge className='border border-gray-500'>N/A</Badge>}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button size="lg" className="w-fit data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800">
                    {value.label || "Filter by"}
                    <ChevronDownIcon className={`w-4 h-4 ml-2 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <ul className="flex flex-col overflow-y-auto pb-8">
                    {listData.map((item: any) => (
                        <li
                            key={item.value}
                            onClick={disableFilterOptions.includes(item.value) ? undefined : handleValueChange(item)}
                            className={`flex items-center justify-between gap-2 py-2 px-4 hover:bg-gray-200 rounded-2 ${disableFilterOptions.includes(item.value) ? "opacity-50 select-none cursor-not-allowed" : "cursor-pointer"}`}
                            aria-disabled={disableFilterOptions.includes(item.value)}
                        >
                            <div className="flex items-center gap-2 ">
                                <Circle className={`${item.value === value.value ? "h-3 w-3 text-secondary-500 ring-1 ring-secondary-100 ring-offset-2" : "h-4 w-4 text-gray-400"} fill-current rounded-full`} />
                                <span className="">{item.label}</span>
                            </div>
                            {disableFilterOptions.includes(item.value) && <Badge className='border border-gray-500'>N/A</Badge>}
                        </li>
                    ))}
                </ul>
            </DrawerContent>
        </Drawer>
    )
}
