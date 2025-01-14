import { FC } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
import { hasLowestDisplayValuePrefix } from '@/lib/utils'
import { getLowestDisplayValue } from '@/lib/utils'
import { isLowestValue } from '@/lib/utils'
import { abbreviateNumber } from '@/lib/utils'

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

interface SelectTokenByChainProps {
    open: boolean
    setOpen: (open: boolean) => void
    networks: NetworkDetails[]
    tokens: TokenDetails[]
    onSelectToken: (token: any) => void
}

export const SelectTokenByChain: FC<SelectTokenByChainProps> = ({
    open,
    setOpen,
    networks,
    tokens,
    onSelectToken,
}: SelectTokenByChainProps) => {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    const content = (
        <Card className="w-full py-2 border-0 shadow-none bg-white bg-opacity-100 divide-y divide-gray-200">
            {/* <div className="flex items-center gap-2 mb-6 px-6">
                <Button
                    variant={'outline'}
                    className="capitalize rounded-4 py-2 border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25"
                    size={'lg'}
                >
                    All Networks
                </Button>
                <ScrollArea className="w-full h-fit whitespace-nowrap">
                    <div className="flex gap-2">
                        {networks.map((network: any) => (
                            <Button
                                key={network.name}
                                variant={'outline'}
                                className={`px-3 py-2 rounded-4 flex items-center justify-center border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25`}
                            >
                                <Image
                                    src={network.logo}
                                    alt={network.name}
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                />
                            </Button>
                        ))}
                        <ScrollBar orientation="horizontal" />
                    </div>
                </ScrollArea>
            </div> */}
            <ScrollArea className="max-h-[60vh] w-full">
                <div className="space-y-2 px-4">
                    {tokens.map((token: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4"
                            onClick={() => onSelectToken(token)}
                        >
                            <div className="flex items-center gap-3 select-none">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center`}
                                >
                                    <Image
                                        src={token.logo}
                                        alt={token.symbol}
                                        width={28}
                                        height={28}
                                        className="rounded-full"
                                    />
                                </div>
                                <div>
                                    <BodyText level="body2" weight="medium">
                                        {token.symbol}
                                    </BodyText>
                                    <Label className="text-gray-700">{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</Label>
                                </div>
                            </div>
                            <div className="text-right select-none">
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                >{`${hasLowestDisplayValuePrefix(Number(token.positionAmount))} ${formatAmountToDisplay(token.positionAmount)}`}</BodyText>
                                <Label className="text-gray-700">{`${hasLowestDisplayValuePrefix(Number(token.positionAmountInUsd))} $${formatAmountToDisplay(token.positionAmountInUsd)}`}</Label>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[436px] w-full pt-4 pb-2 px-2">
                    <DialogHeader className="pt-2 pl-6 select-none">
                        <HeadingText level="h5" weight="medium">
                            Select Token
                        </HeadingText>
                        <VisuallyHidden.Root asChild>
                            <DialogDescription>
                                Select a token by chain
                            </DialogDescription>
                        </VisuallyHidden.Root>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Select Token</DrawerTitle>
                    <DrawerDescription>
                        <VisuallyHidden.Root asChild>
                            Select a token by chain
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
