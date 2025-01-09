import { FC, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { Card } from '../ui/card'
import Image from 'next/image'
import useDimensions from '@/hooks/useDimensions'
import { BodyText, HeadingText, Label } from '../ui/typography'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { copyToClipboard, hasLowestDisplayValuePrefix } from '@/lib/utils'
import { getLowestDisplayValue } from '@/lib/utils'
import { isLowestValue } from '@/lib/utils'
import { abbreviateNumber } from '@/lib/utils'
import { Button } from '../ui/button'
import { TChain } from '@/types/chain'
import { Check, Copy, LoaderCircle, LogOut } from 'lucide-react'

interface TokenDetails {
    symbol: string
    address: string
    positionAmount: string
    positionAmountInUsd: string
    logo: string
    apy: number
    price_usd: number
}

interface NetworkDetails {
    name: string
    logo: string
    chainId: number
}

interface ProfileMenuDropdownProps {
    open: boolean
    setOpen: (open: boolean) => void
    chains: TChain[]
    tokens: TokenDetails[]
    displayText: string
    logout: () => Promise<void>
    walletAddress: string
}

export const ProfileMenuDropdown: FC<ProfileMenuDropdownProps> = ({
    open,
    setOpen,
    chains,
    tokens,
    displayText,
    walletAddress,
    logout,
}) => {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const [addressIsCopied, setAddressIsCopied] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    function handleAddressCopy() {
        copyToClipboard(walletAddress)
        setAddressIsCopied(true)
        setTimeout(() => {
            setAddressIsCopied(false)
        }, 1000)
    }

    function handleLogout() {
        setIsLoggingOut(true)
        logout()
            .then(() => {
                setOpen(false)
            }).finally(() => {
                setIsLoggingOut(false)
            })
    }

    const triggerButton = (
        <Button
            variant='default'
            size="lg"
            className="rounded-4 py-2 capitalize w-full"
            onClick={() => setOpen(!open)}
        >
            {displayText}
        </Button>
    )

    // const content = (
    //     <Card className="w-full pt-6 pb-1.5 border-0 shadow-none bg-white bg-opacity-100 divide-y divide-gray-200">
    //         <div className="flex items-center gap-2 mb-6 px-6">
    //             <Button
    //                 variant={'outline'}
    //                 className="capitalize rounded-4 py-2 border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25"
    //                 size={'lg'}
    //             >
    //                 All Chains
    //             </Button>
    //             <ScrollArea className="w-full h-[200px] whitespace-nowrap">
    //                 <div className="flex gap-2">
    //                     {chains.map((chain: any) => (
    //                         <Button
    //                             key={chain.name}
    //                             variant={'outline'}
    //                             className={`px-3 py-2 rounded-4 flex items-center justify-center border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25`}
    //                         >
    //                             <Image
    //                                 src={chain.logo}
    //                                 alt={chain.name}
    //                                 width={28}
    //                                 height={28}
    //                                 className="rounded-full"
    //                             />
    //                         </Button>
    //                     ))}
    //                     <ScrollBar orientation="horizontal" />
    //                 </div>
    //             </ScrollArea>
    //         </div>
    //         <ScrollArea className="max-h-[60vh] h-[60vh] w-full pb-0">
    //             <div className="space-y-2 px-4">
    //                 {tokens.map((token: any, index: number) => (
    //                     <div
    //                         key={index}
    //                         className="flex items-center justify-between py-2 pl-2 pr-6 hover:bg-gray-200 hover:rounded-4"
    //                     >
    //                         <div className="flex items-center gap-3 select-none">
    //                             <div
    //                                 className={`w-8 h-8 rounded-full flex items-center justify-center`}
    //                             >
    //                                 <Image
    //                                     src={token.logo}
    //                                     alt={token.symbol}
    //                                     width={28}
    //                                     height={28}
    //                                     className="rounded-full"
    //                                 />
    //                             </div>
    //                             <div>
    //                                 <BodyText level="body2" weight="medium">
    //                                     {token.symbol}
    //                                 </BodyText>
    //                                 <Label className="text-gray-700">{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</Label>
    //                             </div>
    //                         </div>
    //                         <div className="text-right select-none">
    //                             <BodyText
    //                                 level="body2"
    //                                 weight="medium"
    //                             >{`${hasLowestDisplayValuePrefix(Number(token.positionAmount))} ${formatAmountToDisplay(token.positionAmount)}`}</BodyText>
    //                             <Label className="text-gray-700">{`${hasLowestDisplayValuePrefix(Number(token.positionAmountInUsd))} $${formatAmountToDisplay(token.positionAmountInUsd)}`}</Label>
    //                         </div>
    //                     </div>
    //                 ))}
    //             </div>
    //         </ScrollArea>
    //     </Card>
    // )

    const content = (
        <div className='flex flex-col gap-8 md:gap-4'>
            <div className="flex items-center justify-center">
                <BodyText level={isDesktop ? "body2" : "body1"} weight="bold">
                    {displayText}
                </BodyText>
                <Button variant="ghost" size="icon" onClick={handleAddressCopy} className={`p-0 ${addressIsCopied ? 'select-none' : ''}`}>
                    {addressIsCopied ? <Check className="w-4 h-4 stroke-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>
            <Button
                variant="outline"
                size="lg"
                className="rounded-4 py-3 md:py-2 capitalize w-full flex items-center justify-center gap-2 hover:border-red-500 hover:text-red-500"
                onClick={handleLogout}
                disabled={isLoggingOut}
            >
                {isLoggingOut ? "Disconnecting..." : "Disconnect"}
                {isLoggingOut ? <LoaderCircle className="text-primary w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </Button>
        </div>
    )

    if (isDesktop) {
        return (
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    {triggerButton}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-full rounded-7 p-4 bg-opacity-40 min-w-[300px]">
                    {content}
                </DropdownMenuContent>
            </DropdownMenu>

        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {triggerButton}
            </DrawerTrigger>
            <DrawerContent className="w-full p-4">
                <DrawerHeader>
                    {/* <DrawerTitle>Token Balances</DrawerTitle> */}
                    <DrawerDescription>
                        <VisuallyHidden.Root asChild>
                            View connected wallet details
                        </VisuallyHidden.Root>
                    </DrawerDescription>
                </DrawerHeader>
                {content}
            </DrawerContent>
        </Drawer>
    )
}

function formatAmountToDisplay(amount: string) {
    if (isLowestValue(Number(amount ?? 0))) {
        return getLowestDisplayValue(Number(amount ?? 0))
    } else {
        return abbreviateNumber(Number(amount ?? 0))
    }
}