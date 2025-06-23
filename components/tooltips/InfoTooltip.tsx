'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { motion } from 'framer-motion'
import { Label } from '../ui/typography'
import InfoCircleIcon from '../icons/info-circle-icon'
import useDimensions from '@/hooks/useDimensions'
import { Button } from '../ui/button'
import { DialogTitle } from '@radix-ui/react-dialog'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

type TProps = {
    label?: any
    content?: any
    size?: string
    hide?: boolean
    iconWidth?: number
    iconHeight?: number
    side?: 'top' | 'bottom' | 'left' | 'right'
    className?: string
    classNameLabel?: string
    isResponsive?: boolean
}

const sizes: any = {
    lg: 'py-[18px] px-[22px]',
    md: 'py-[12px] px-[16px]',
    sm: 'py-[6px] px-[12px]',
    none: 'py-0 px-0',
}

export default function InfoTooltip({
    label,
    content,
    size = 'md',
    hide = false,
    iconWidth = 16,
    iconHeight = 16,
    side,
    className,
    classNameLabel,
    isResponsive = true,
}: TProps) {
    const [open, setOpen] = useState<boolean>(false)
    const { width: screenWidth } = useDimensions()
    const isDesktop = useMemo(() => screenWidth > 768, [screenWidth])
    const closeTimeoutRef = useRef<NodeJS.Timeout>()

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
        }
        setOpen(true)
    }

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setOpen(false)
        }, 100) // Small delay to allow mouse movement between elements
    }

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current)
            }
        }
    }, [])

    if (hide) return label;

    if (isDesktop || !isResponsive) {
        return (
            <TooltipPrimitive.Provider>
                <TooltipPrimitive.Root open={open}>
                    <TooltipPrimitive.Trigger asChild>
                        <motion.span
                            onClick={() => setOpen(!open)}
                            onMouseEnter={isResponsive ? handleMouseEnter : undefined}
                            onMouseLeave={isResponsive ? handleMouseLeave : undefined}
                            className={`w-fit inline-block shrink-0 ${classNameLabel}`}
                        >
                            {!label && (
                                <InfoCircleIcon
                                    width={iconWidth}
                                    height={iconHeight}
                                    weight="1.5"
                                />
                            )}
                            {label && label}
                        </motion.span>
                    </TooltipPrimitive.Trigger>
                    <TooltipPrimitive.Portal>
                        <TooltipPrimitive.Content
                            side={side}
                            sideOffset={5}
                            collisionPadding={16}
                            forceMount
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className={`z-[9999] select-none pointer-events-auto bg-white rounded-4 border shadow-md ${className?.includes('max-w') ? '' : 'max-w-[280px] text-wrap'} ${sizes[size]}`}
                        >
                            <motion.span
                                className="w-fit inline-block shrink-0"
                            >
                                {typeof content === 'string' && (
                                    <Label className="w-fit">{content}</Label>
                                )}
                                {typeof content !== 'string' && content}
                            </motion.span>
                            <TooltipPrimitive.Arrow className="fill-white" />
                        </TooltipPrimitive.Content>
                    </TooltipPrimitive.Portal>
                </TooltipPrimitive.Root>
            </TooltipPrimitive.Provider>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <span
                    onClick={() => setOpen(true)}
                    className={`w-fit inline-block shrink-0 ${classNameLabel}`}
                >
                    {!label && (
                        <InfoCircleIcon
                            width={iconWidth}
                            height={iconHeight}
                            weight="1.5"
                        />
                    )}
                    {label && label}
                </span>
            </DrawerTrigger>
            <DrawerContent>
                <div className="p-4 pb-8">
                    {typeof content === 'string' && (
                        <Label className="w-fit">{content}</Label>
                    )}
                    {typeof content !== 'string' && content}
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button
                            size={'lg'}
                            variant="outline"
                            className="w-full"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}