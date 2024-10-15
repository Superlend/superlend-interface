"use client"

import React, { useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { motion } from "framer-motion"
import { Label } from '../ui/typography';
import InfoCircleIcon from '../icons/info-circle-icon';
import useDimensions from '@/hooks/useDimensions';
import { Button } from '../ui/button';

type TProps = {
    label?: any;
    content?: any;
    size?: string;
    hide?: boolean;
    iconWidth?: number;
    iconHeight?: number;
}

const sizes: any = {
    lg: "py-[18px] px-[22px]",
    md: "py-[12px] px-[16px]",
    sm: "py-[6px] px-[12px]"
}


export default function InfoTooltip({ label, content, size = "md", hide = false, iconWidth = 16, iconHeight = 16 }: TProps) {
    const [open, setOpen] = useState<boolean>(false);
    const { width: screenWidth } = useDimensions();
    const isDesktop = screenWidth > 768;

    function handleTooltipToggle(state: boolean) {
        return () => {
            setOpen(state)
        }
    }

    if (isDesktop) {
        return (
            <TooltipProvider delayDuration={200}>
                <Tooltip open={open}>
                    <TooltipTrigger asChild>
                        <motion.span
                            // Tool tip triggers
                            onHoverStart={handleTooltipToggle(true)}
                            onClick={handleTooltipToggle(true)}
                            onMouseEnter={handleTooltipToggle(true)}
                            onHoverEnd={handleTooltipToggle(false)}
                            onMouseLeave={handleTooltipToggle(false)}
                            className='w-fit inline-block shrink-0 cursor-help'
                        >
                            {!label &&
                                <InfoCircleIcon width={iconWidth} height={iconHeight} weight='1.5' />
                            }
                            {label && label}
                        </motion.span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={15} className={`max-w-[280px] ${sizes[size]}`}>
                        {typeof content === "string" && <Label className='w-fit'>{content}</Label>}
                        {typeof content !== "string" && content}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

        )
    }

    return (
        <Drawer open={open}>
            <DrawerTrigger asChild>
                <motion.span
                    // Tool tip triggers
                    onHoverStart={handleTooltipToggle(true)}
                    onClick={handleTooltipToggle(true)}
                    onMouseEnter={handleTooltipToggle(true)}
                    onHoverEnd={handleTooltipToggle(false)}
                    onMouseLeave={handleTooltipToggle(false)}
                    className='w-fit inline-block shrink-0'
                >
                    {!label &&
                        <InfoCircleIcon width={iconWidth} height={iconHeight} weight='1.5' />
                    }
                    {label && label}
                </motion.span>
            </DrawerTrigger>
            <DrawerContent>
                <div className="p-4 pb-8">
                    {typeof content === "string" && <Label className='w-fit'>{content}</Label>}
                    {typeof content !== "string" && content}
                </div>
                <DrawerFooter>
                    <DrawerClose className='w-full'>
                        <Button size={'lg'} variant="outline" className='w-full'>Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>

    )
}
