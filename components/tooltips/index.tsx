"use client"

import React, { useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { Label } from '../ui/typography';

type TProps = {
    label?: any;
    content?: any;
}


export default function InfoTooltip({ label, content }: TProps) {
    const [open, setOpen] = useState<boolean>(false);

    function handleTooltipToggle(state: boolean) {
        return () => setOpen(state)
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip open={open}>
                <TooltipTrigger asChild>
                    <motion.div
                        // Tool tip triggers
                        onHoverStart={handleTooltipToggle(true)}
                        onClick={handleTooltipToggle(true)}
                        onMouseEnter={handleTooltipToggle(true)}
                        onHoverEnd={handleTooltipToggle(false)}
                        onMouseLeave={handleTooltipToggle(false)}
                    >
                        {!label &&
                            <img
                                src="/icons/info-circle-icon.svg" alt="info"
                                width={16}
                                height={16}
                                className='object-contain shrink-0 inline-block sleect-none'
                            />}
                        {label && label}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent sideOffset={15} className='max-w-[280px] py-[16px] px-[20px]'>
                    <Label>{content}</Label>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    )
}
