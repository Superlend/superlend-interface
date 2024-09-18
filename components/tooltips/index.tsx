"use client"

import React, { useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
// import Image from "next/image";
import { motion } from "framer-motion"
import { Label } from '../ui/typography';

type TProps = {
    content?: string | React.ReactNode
}


export default function InfoTooltip({ content }: TProps) {
    const [open, setOpen] = useState<boolean>(false);

    function handleTooltipToggle(state: boolean) {
        return () => setOpen(state)
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip open={open}>
                <TooltipTrigger asChild>
                    <motion.img
                        src="/icons/info-circle-icon.svg" alt="info"
                        width={16}
                        height={16}
                        className='object-contain'
                        // Tool tip triggers
                        onHoverStart={handleTooltipToggle(true)}
                        onClick={handleTooltipToggle(true)}
                        onMouseEnter={handleTooltipToggle(true)}
                        onHoverEnd={handleTooltipToggle(false)}
                        onMouseLeave={handleTooltipToggle(false)}
                    />
                </TooltipTrigger>
                <TooltipContent className='max-w-[280px] py-[16px] px-[20px]'>
                    {!content &&
                        <Label>Manage your position risks and review position sizes regulary</Label>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    )
}
