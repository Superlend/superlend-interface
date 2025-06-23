import React, { FC, useEffect, useState } from 'react'
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
import { Button } from '../ui/button'
import ImageWithBadge from '../ImageWithBadge'
import { Skeleton } from '../ui/skeleton'
import { useAssetsDataContext } from '@/context/data-provider'
import ImageWithDefault from '../ImageWithDefault'
import { ArrowLeft, ChevronDown, ChevronRight, SearchX, X } from 'lucide-react'
import SearchInput from '../inputs/SearchInput'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { Badge } from '../ui/badge'
import { STABLECOINS_NAMES_LIST } from '@/constants'

interface TokenDetails {
    symbol: string
    address: string
    tokenAmount: string
    price_usd: string
    logo: string
    apy: number
    decimals: number
    chain_id?: number
    chain_logo?: string
    chain_name?: string
    balance?: string
}

interface TokenGroup {
    mainnetAddress: string
    symbol: string
    logo: string
    tokenCount: number
    tokens: TokenDetails[]
}

interface NetworkDetails {
    name: string
    logo: string
    chainId: number
}

interface ChainDetails {
    chain_id: number
    logo: string
}

interface SelectTokenByChainProps {
    open: boolean
    setOpen: (open: boolean) => void
    tokens: TokenDetails[]
    onSelectToken: (token: any) => void
    isLoading?: boolean
    filterByChain?: boolean
    showChainBadge?: boolean
    positionType?: 'lend' | 'borrow' | 'loop'
}

export const SelectTokenByChain: FC<SelectTokenByChainProps> = ({
    open,
    setOpen,
    tokens,
    onSelectToken,
    isLoading,
    filterByChain = true,
    showChainBadge = true,
    positionType = 'lend',
}: SelectTokenByChainProps) => {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const maxChainsToShow = isDesktop ? 4 : 3
    const { allChainsData } = useAssetsDataContext()
    const [selectedChains, setSelectedChains] = useState<string[]>([])
    const [showAllChains, setShowAllChains] = useState(false)
    const [keywords, setKeywords] = useState<string>('')
    const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set())
    const { isWalletConnected } = useWalletConnection()

    // Helper function to get canonical identifier for a token
    function getTokenIdentifier(token: TokenDetails): string {
        // Use the token symbol as the identifier for all tokens
        // This will group all tokens with the same symbol across different chains
        return token.symbol.toLowerCase();
    }

    // Function to group tokens by their canonical identity
    function groupTokensByIdentity(tokens: TokenDetails[]): TokenGroup[] {
        // First, create a mapping of token identities to their instances
        const groupedByIdentity = tokens.reduce((acc, token) => {
            const identifier = getTokenIdentifier(token);
            
            if (!acc[identifier]) {
                acc[identifier] = [];
            }
            acc[identifier].push(token);
            return acc;
        }, {} as Record<string, TokenDetails[]>);
        
        // Convert to array format for easier rendering
        return Object.entries(groupedByIdentity).map(([identifier, tokens]) => {
            // Use the Ethereum mainnet token as the primary token if available
            const primaryToken = tokens.find(t => t.chain_id === 1) || tokens[0];
            
            return {
                mainnetAddress: identifier, // Using the symbol as the group identifier
                symbol: primaryToken.symbol,
                logo: primaryToken.logo,
                tokenCount: tokens.length,
                tokens: tokens.sort((a, b) => {
                    // Sort by chain ID to ensure consistent ordering
                    if (a.chain_id === 1) return -1;
                    if (b.chain_id === 1) return 1;
                    return sortTokensByBalance(a, b);
                })
            };
        }).sort((a, b) => {
            // Sort groups to show stablecoins first, then by token count
            const aIsStablecoin = STABLECOINS_NAMES_LIST.includes(a.symbol);
            const bIsStablecoin = STABLECOINS_NAMES_LIST.includes(b.symbol);
            
            if (aIsStablecoin && !bIsStablecoin) return -1;
            if (!aIsStablecoin && bIsStablecoin) return 1;
            if (aIsStablecoin && bIsStablecoin) {
                return STABLECOINS_NAMES_LIST.indexOf(a.symbol) - STABLECOINS_NAMES_LIST.indexOf(b.symbol);
            }
            
            // For non-stablecoins, sort by token count (most chains first)
            return b.tokenCount - a.tokenCount;
        });
    }

    function toggleTokenExpansion(address: string) {
        setExpandedTokens(prev => {
            const newSet = new Set(prev);
            if (newSet.has(address)) {
                newSet.delete(address);
            } else {
                newSet.add(address);
            }
            return newSet;
        });
    }

    function isTokenExpanded(address: string) {
        return expandedTokens.has(address);
    }

    useEffect(() => {
        if (open) {
            setKeywords('')
            setSelectedChains([])
            setShowAllChains(false)
            setExpandedTokens(new Set())
        }
    }, [open])

    useEffect(() => {
        setKeywords('')
    }, [showAllChains])

    function handleKeywordChange(e: any) {
        setKeywords(e.target.value)
    }

    function handleClearSearch() {
        setKeywords('')
    }

    const chains = allChainsData
        .map((chain: any) => ({
            name: chain.name,
            logo: chain.logo,
            chainId: chain.chain_id,
        }))
        .sort((a, b) => {
            const order = [1, 8453, 42161, 137, 42793, 10, 534352, 43114, 56, 100, 1088, 59144];
            return order.indexOf(a.chainId) - order.indexOf(b.chainId);
        });

    const handleSelectChain = (chainId: number) => {
        setSelectedChains((prev) => {
            if (prev.includes(chainId.toString())) {
                return prev.filter((id) => id !== chainId.toString())
            } else {
                return [...prev, chainId.toString()]
            }
        })
    }

    function isChainSelected(chainId: number) {
        return selectedChains.includes(chainId.toString())
    }

    function handleSelectChainClick(chainId: number) {
        handleSelectChain(chainId)
        setShowAllChains(false)
    }

    function sortTokensByBalance(a: any, b: any) {
        if (!isWalletConnected) {
            const aIndex = STABLECOINS_NAMES_LIST.indexOf(a.symbol)
            const bIndex = STABLECOINS_NAMES_LIST.indexOf(b.symbol)

            // If both tokens are stablecoins, sort by their order in the list
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex
            }
            // If only a is a stablecoin, it should come first
            if (aIndex !== -1) return -1
            // If only b is a stablecoin, it should come first
            if (bIndex !== -1) return 1
            // If neither are stablecoins, maintain original order
            return 0
        }
        return (b.balance || 0) - (a.balance || 0)
    }

    const filteredTokens = (
        selectedChains.length > 0 && filterByChain
            ? tokens.filter((token: TokenDetails) => {
                const matchesChain = selectedChains.includes(token.chain_id?.toString() || '');
                const matchesSearch = 
                    token?.symbol?.toLowerCase().includes(keywords.toLowerCase()) ||
                    token?.address?.toLowerCase().includes(keywords.toLowerCase());
                // For loop position type, only show Etherlink tokens (chain_id: 42793)
                const matchesPositionType = positionType === 'loop' ? token.chain_id === 42793 : true;
                return matchesChain && matchesSearch && matchesPositionType;
            })
            : tokens.filter((token: TokenDetails) => {
                const matchesSearch = 
                    token?.symbol?.toLowerCase().includes(keywords.toLowerCase()) ||
                    token?.address?.toLowerCase().includes(keywords.toLowerCase());
                // For loop position type, only show Etherlink tokens (chain_id: 42793)
                const matchesPositionType = positionType === 'loop' ? token.chain_id === 42793 : true;
                return matchesSearch && matchesPositionType;
            })
    ).sort(sortTokensByBalance);

    // Group tokens by identity after filtering
    const groupedTokens = groupTokensByIdentity(filteredTokens);

    const filteredChains = chains?.filter((chain: any) =>
        chain.name.toLowerCase().includes(keywords.toLowerCase())
    )

    const noFilteredChainsFound = filteredChains?.length === 0
    const noFilteredTokensFound =
        tokens.length === 0 || groupedTokens.length === 0

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = (
        <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.3rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    )

    // SUB_COMPONENT: Back button to close the dialog
    const backButton = (
        <Button
            variant="ghost"
            onClick={() => setShowAllChains(false)}
            className="h-6 w-6 flex items-center justify-center absolute left-6 top-[1.5rem] rounded-full bg-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <ArrowLeft strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Back</span>
        </Button>
    )

    const selectedMoreChainsCount = selectedChains.reduce((count, chainId) => {
        const chainIndex = chains.findIndex(
            (chain) => Number(chain.chainId) === Number(chainId)
        )
        return chainIndex >= maxChainsToShow ? count + 1 : count
    }, 0)

    // SUB_COMPONENT: Content
    const content = (
        <Card
            className={`w-full py-2 border-0 shadow-none bg-white bg-opacity-100 ${showAllChains ? '' : 'divide-y divide-gray-200'}`}
        >
            {/* UI: Filter with chains */}
            {filterByChain && !showAllChains && (
                <div className="my-4 md:my-6 pl-6">
                    <div className="flex flex-wrap items-center gap-2 md:gap-1">
                        <Button
                            variant={'outline'}
                            className={`capitalize rounded-4 py-3 border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25 ${selectedChains.length === 0 ? 'border-secondary-300 bg-secondary-100/15' : ''}`}
                            size={'lg'}
                            onClick={() => setSelectedChains([])}
                        >
                            All Chains
                        </Button>
                        {chains.slice(0, maxChainsToShow).map((chain: any) => (
                            <Button
                                key={chain.name}
                                variant={'outline'}
                                className={`px-3 py-2 rounded-4 flex items-center justify-center border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25 ${isChainSelected(chain.chainId) ? 'border-secondary-300 bg-secondary-100/15' : ''}`}
                                onClick={() => handleSelectChain(chain.chainId)}
                            >
                                <ImageWithDefault
                                    src={chain.logo}
                                    alt={chain.name}
                                    width={28}
                                    height={28}
                                    className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                />
                            </Button>
                        ))}
                        <Button
                            onClick={() => setShowAllChains(true)}
                            variant={'outline'}
                            className={`relative px-4 py-3 rounded-4 flex items-center justify-center border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25`}
                        >
                            <BodyText level="body2" weight="semibold">
                                +{chains.length - maxChainsToShow}
                            </BodyText>
                            {selectedMoreChainsCount > 0 && (
                                <Badge
                                    variant={'blue'}
                                    className="px-1.5 absolute right-[-7px] -top-2 rounded-full bg-opacity-50 backdrop-blur-sm"
                                >
                                    {selectedMoreChainsCount}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            {showAllChains && backButton}
            {/* UI: List of tokens / chains */}
            <ScrollArea className="h-[300px] lg:h-full w-full max-h-[400px]">
                {/* Search bar UI */}
                <div className="sticky -top-0.5 left-0 right-0 z-10 px-5 py-2 bg-white">
                    <SearchInput
                        onChange={handleKeywordChange}
                        onClear={handleClearSearch}
                        value={keywords}
                        placeholder={`Search by ${showAllChains ? 'chain name' : 'token name'}`}
                        className="bg-gray-200"
                    />
                </div>
                <div className="space-y-2 px-4">
                    {/* UI when loading */}
                    {isLoading &&
                        Array.from({ length: 5 }).map((_, index) => (
                            <LoadingBalanceItemSkeleton key={index} />
                        ))}
                    {/* UI when does not have tokens */}
                    {!isLoading &&
                        ((!showAllChains && noFilteredTokensFound) ||
                            (showAllChains && noFilteredChainsFound)) && (
                            <div className="flex items-center justify-center gap-2 h-full py-10">
                                <SearchX className="w-6 h-6 text-gray-500" />
                                <BodyText
                                    level="body1"
                                    weight="semibold"
                                    className="text-gray-500"
                                >
                                    No {showAllChains ? 'chains' : 'tokens'}{' '}
                                    found
                                </BodyText>
                            </div>
                        )}
                    {/* Tokens List */}
                    {!isLoading &&
                        groupedTokens.length > 0 &&
                        !showAllChains && (
                        selectedChains.length > 0 || isWalletConnected
                        ? // When specific chains are selected or wallet is connected, show expanded tokens
                          filteredTokens.map((token) => (
                            <div
                                key={`${token.address}-${token.chain_id}`}
                                className="flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4"
                                onClick={() => onSelectToken(token)}
                            >
                                <div className="flex items-center gap-1 select-none">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                        {showChainBadge && token.chain_logo && (
                                            <ImageWithBadge
                                                mainImg={token.logo || ''}
                                                badgeImg={token.chain_logo}
                                                mainImgAlt={token.symbol}
                                                badgeImgAlt={token.chain_id?.toString()}
                                            />
                                        )}
                                        {(showChainBadge && !token.chain_logo) || !showChainBadge && (
                                            <Image
                                                src={token.logo || ''}
                                                alt={token.symbol}
                                                width={28}
                                                height={28}
                                                className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0">
                                        <div className="flex items-center gap-1">
                                            <BodyText level="body2" weight="medium" className="max-w-[120px] truncate">
                                                {token.symbol}
                                            </BodyText>
                                            <Label className="text-gray-500">
                                                on {token.chain_name}
                                            </Label>
                                        </div>
                                        <Label className="text-gray-700">
                                            {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                                        </Label>
                                    </div>
                                </div>
                                {isWalletConnected && (
                                    <div className="text-right select-none flex flex-col gap-0">
                                        <BodyText level="body2" weight="medium">
                                            {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount))} ${formatAmountToDisplay(token.balance ?? token.tokenAmount)}`}
                                        </BodyText>
                                        <Label className="text-gray-700">
                                            {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount) * Number(token.price_usd))} $${formatAmountToDisplay((Number(token.balance ?? token.tokenAmount) * Number(token.price_usd)).toString())}`}
                                        </Label>
                                    </div>
                                )}
                            </div>
                        ))
                        : // When no chains are selected (All Chains) and wallet is not connected, show grouped tokens
                          groupedTokens.map((group) => {
                            // If token exists only on one chain, show expanded view directly
                            if (group.tokenCount === 1) {
                                const token = group.tokens[0];
                                return (
                                    <div
                                        key={`${token.address}-${token.chain_id}`}
                                        className="flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4"
                                        onClick={() => onSelectToken(token)}
                                    >
                                        <div className="flex items-center gap-1 select-none">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                {showChainBadge && token.chain_logo && (
                                                    <ImageWithBadge
                                                        mainImg={token.logo || ''}
                                                        badgeImg={token.chain_logo}
                                                        mainImgAlt={token.symbol}
                                                        badgeImgAlt={token.chain_id?.toString()}
                                                    />
                                                )}
                                                {(showChainBadge && !token.chain_logo) || !showChainBadge && (
                                                    <Image
                                                        src={token.logo || ''}
                                                        alt={token.symbol}
                                                        width={28}
                                                        height={28}
                                                        className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0">
                                                <div className="flex items-center gap-1">
                                                    <BodyText level="body2" weight="medium" className="max-w-[120px] truncate">
                                                        {token.symbol}
                                                    </BodyText>
                                                    <Label className="text-gray-500">
                                                        on {token.chain_name}
                                                    </Label>
                                                </div>
                                                <Label className="text-gray-700">
                                                    {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                                                </Label>
                                            </div>
                                        </div>
                                        {isWalletConnected && (
                                            <div className="text-right select-none flex flex-col gap-0">
                                                <BodyText level="body2" weight="medium">
                                                    {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount))} ${formatAmountToDisplay(token.balance ?? token.tokenAmount)}`}
                                                </BodyText>
                                                <Label className="text-gray-700">
                                                    {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount) * Number(token.price_usd))} $${formatAmountToDisplay((Number(token.balance ?? token.tokenAmount) * Number(token.price_usd)).toString())}`}
                                                </Label>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // For tokens with multiple chains, show group header with expand/collapse
                            if (isTokenExpanded(group.mainnetAddress)) {
                                return (
                                    <div 
                                        key={`${group.mainnetAddress}-expanded`}
                                        className="overflow-hidden transition-all duration-300 ease-in-out"
                                    >
                                        <div className="animate-in fade-in duration-500">
                                            {group.tokens.map((token, index) => (
                                                <div
                                                    key={`${token.address}-${token.chain_id}`}
                                                    className={`flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4
                                                        animate-in slide-in-from-left-4 duration-500
                                                        ${index === 0 ? 'delay-0' : `delay-[${index * 75}ms]`}`}
                                                    style={{
                                                        animationDelay: `${index * 75}ms`,
                                                        animationFillMode: 'both'
                                                    }}
                                                    onClick={() => onSelectToken(token)}
                                                >
                                                    <div className="flex items-center gap-1 select-none">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                            {showChainBadge && token.chain_logo && (
                                                                <ImageWithBadge
                                                                    mainImg={token.logo || ''}
                                                                    badgeImg={token.chain_logo}
                                                                    mainImgAlt={token.symbol}
                                                                    badgeImgAlt={token.chain_id?.toString()}
                                                                />
                                                            )}
                                                            {(showChainBadge && !token.chain_logo) || !showChainBadge && (
                                                                <Image
                                                                    src={token.logo || ''}
                                                                    alt={token.symbol}
                                                                    width={28}
                                                                    height={28}
                                                                    className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-0">
                                                            <div className="flex items-center gap-1">
                                                                <BodyText level="body2" weight="medium" className="max-w-[120px] truncate">
                                                                    {token.symbol}
                                                                </BodyText>
                                                                <Label className="text-gray-500">
                                                                    on {token.chain_name}
                                                                </Label>
                                                            </div>
                                                            <Label className="text-gray-700">
                                                                {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                    {isWalletConnected && (
                                                        <div className="text-right select-none flex flex-col gap-0">
                                                            <BodyText level="body2" weight="medium">
                                                                {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount))} ${formatAmountToDisplay(token.balance ?? token.tokenAmount)}`}
                                                            </BodyText>
                                                            <Label className="text-gray-700">
                                                                {`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.tokenAmount) * Number(token.price_usd))} $${formatAmountToDisplay((Number(token.balance ?? token.tokenAmount) * Number(token.price_usd)).toString())}`}
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // If not expanded, show the group header
                            return (
                                <div
                                    key={group.mainnetAddress}
                                    className={`flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4 transition-all duration-300 ease-in-out ${isTokenExpanded(group.mainnetAddress) ? 'bg-gray-100' : ''}`}
                                    onClick={() => toggleTokenExpansion(group.mainnetAddress)}
                                >
                                    <div className="flex items-center gap-1 select-none">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                            <Image
                                                src={group.logo}
                                                alt={group.symbol}
                                                width={28}
                                                height={28}
                                                className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-0">
                                            <BodyText level="body2" weight="medium" className="max-w-[120px] truncate">
                                                {group.symbol}
                                            </BodyText>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="rounded-full">
                                            {group.tokenCount} {group.tokenCount === 1 ? 'chain' : 'chains'}
                                        </Badge>
                                        <ChevronRight className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isTokenExpanded(group.mainnetAddress) ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {/* Chains List */}
                    {!isLoading &&
                        filterByChain &&
                        showAllChains &&
                        filteredChains.map((chain: any) => (
                            <Button
                                key={chain.name}
                                variant={'ghost'}
                                className={`w-full px-3 py-2 flex gap-2 items-center justify-start border-gray-300 hover:bg-gray-200/90 active:bg-gray-300/25 ${isChainSelected(chain.chainId) ? 'border-secondary-300 bg-secondary-100/15' : ''}`}
                                onClick={() =>
                                    handleSelectChainClick(chain.chainId)
                                }
                            >
                                <ImageWithDefault
                                    src={chain.logo}
                                    alt={chain.name}
                                    width={28}
                                    height={28}
                                    className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                />
                                <BodyText level="body2" weight="medium">
                                    {chain.name}
                                </BodyText>
                            </Button>
                        ))}
                </div>
            </ScrollArea>
        </Card>
    )

    return isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[436px] w-full pt-4 pb-2 px-2">
                <DialogHeader className="pt-2 select-none">
                    <HeadingText
                        level="h5"
                        weight="medium"
                        className={`text-center`}
                    >
                        Select {showAllChains ? 'Chain' : 'Token'}
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
    ) : (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="dismissible-false">
                {closeContentButton}
                <DrawerHeader className="pt-6">
                    <DrawerTitle asChild>
                        <HeadingText level="h5" weight="medium">
                            Select {showAllChains ? 'Chain' : 'Token'}
                        </HeadingText>
                    </DrawerTitle>
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

function LoadingBalanceItemSkeleton() {
    return (
        <div className="flex items-center justify-between py-2 pl-2 pr-6">
            <div className="flex items-center gap-1 select-none">
                <Skeleton className="w-8 h-8 rounded-full bg-stone-200" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="w-24 h-4 rounded-2 bg-stone-200" />
                    <Skeleton className="w-16 h-2 rounded-2 bg-stone-200" />
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Skeleton className="w-24 h-4 rounded-2 bg-stone-200" />
                <Skeleton className="w-16 h-2 rounded-2 bg-stone-200" />
            </div>
        </div>
    )
}
