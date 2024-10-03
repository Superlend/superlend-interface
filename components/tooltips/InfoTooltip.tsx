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
import InfoCircleIcon from '../icons/info-circle-icon';

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


export default function InfoTooltip({ label, content, size = "md", hide, iconWidth = 24, iconHeight = 24 }: TProps) {
    const [open, setOpen] = useState<boolean>(false);

    function handleTooltipToggle(state: boolean) {

        return () => {
            if (hide) return;
            setOpen(state)
        }
    }

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
                        className='w-fit inline-block'
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
