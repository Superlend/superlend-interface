'use client'

import { FC, useState, useEffect, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
import { PortfolioContext } from '@/context/portfolio-provider'
import ImageWithDefault from '@/components/ImageWithDefault'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { LoaderCircle } from 'lucide-react'
import { cn, abbreviateNumber, getLowestDisplayValue, hasLowestDisplayValuePrefix } from '@/lib/utils'
import { ConfirmationDialog, getMaxDecimalsToDisplay, handleSmallestValue } from '@/components/dialogs/TxDialog'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'

// Define token type
interface Token {
    address: string
    symbol: string
    logo: string
    name: string
    decimals: number
    price_usd: number
}

interface ExposureAdjustmentWidgetProps {
    isLoading?: boolean
    platformData?: any
    portfolioData?: any
}

const ExposureAdjustmentWidget: FC<ExposureAdjustmentWidgetProps> = ({
    isLoading = false,
    platformData,
    portfolioData
}) => {
    const { portfolioData: portfolioContextData } = useContext(PortfolioContext)
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''

    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()

    const {
        lendTx,
        isLendBorrowTxDialogOpen,
        setIsLendBorrowTxDialogOpen,
    } = useTxContext() as TTxContext

    // Available tokens for Long position (example, should be fetched from API or props)
    const [availableTokens, setAvailableTokens] = useState<Token[]>([])
    const [selectedLongToken, setSelectedLongToken] = useState<Token | null>(null)
    const [longAmount, setLongAmount] = useState<string>('')
    const [leverage, setLeverage] = useState<number>(1)
    const [healthFactor, setHealthFactor] = useState<number>(0)

    // Token balances
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    // Setup tokens when platform data is available
    useEffect(() => {
        if (platformData?.assets?.length > 0) {
            const tokens = platformData.assets.map((asset: any) => asset.token)
            setAvailableTokens(tokens)
            // Select the first token by default or the one from URL
            const defaultToken = tokens.find((token: Token) =>
                token.address.toLowerCase() === tokenAddress.toLowerCase()
            ) || tokens[0]

            setSelectedLongToken(defaultToken)
        }
    }, [platformData, tokenAddress])

    // Add mock tokens if no tokens are available from platformData
    useEffect(() => {
        if (!availableTokens.length) {
            const mockTokens: Token[] = [
                {
                    address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
                    symbol: 'XTZ',
                    logo: 'https://cryptologos.cc/logos/tezos-xtz-logo.png',
                    name: 'Tezos',
                    decimals: 18,
                    price_usd: 1.05
                },
                {
                    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                    symbol: 'BTC',
                    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
                    name: 'Bitcoin',
                    decimals: 8,
                    price_usd: 68250.43
                },
                {
                    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    symbol: 'ETH',
                    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
                    name: 'Ethereum',
                    decimals: 18,
                    price_usd: 3468.92
                },
                {
                    address: '0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4',
                    symbol: 'SOL',
                    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
                    name: 'Solana',
                    decimals: 9,
                    price_usd: 145.78
                },
                {
                    address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402',
                    symbol: 'DOT',
                    logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
                    name: 'Polkadot',
                    decimals: 10,
                    price_usd: 6.23
                },
                {
                    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                    symbol: 'UNI',
                    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
                    name: 'Uniswap',
                    decimals: 18,
                    price_usd: 10.57
                },
                {
                    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                    symbol: 'LINK',
                    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
                    name: 'Chainlink',
                    decimals: 18,
                    price_usd: 15.89
                }
            ];

            setAvailableTokens(mockTokens);
            setSelectedLongToken(mockTokens[0]); // Set XTZ as default
        }
    }, [availableTokens.length]);

    // Calculate health factor whenever long amount or leverage changes
    useEffect(() => {
        if (selectedLongToken && longAmount && Number(longAmount) > 0) {
            // This is a simplified calculation - in a real app, you'd use a more complex formula
            // based on actual protocol risk parameters
            const calculatedHF = 10 / (Number(longAmount) * leverage / 100)
            setHealthFactor(Math.max(0.5, Math.min(10, calculatedHF)))
        } else {
            setHealthFactor(0)
        }
    }, [selectedLongToken, longAmount, leverage])

    // Get balance for selected token
    const getTokenBalance = (token: Token | null) => {
        if (!token || !isWalletConnected) return '0'

        return (
            erc20TokensBalanceData[Number(chain_id)]?.[token.address.toLowerCase()]
                ?.balanceFormatted ?? '0'
        ).toString()
    }

    const selectedTokenBalance = getTokenBalance(selectedLongToken)

    // Format health factor for display
    const getHealthFactorDisplay = () => {
        if (healthFactor === 0) return 'N/A'
        if (healthFactor > 10) return '∞'
        return healthFactor.toFixed(2)
    }

    // Get color for health factor
    const getHealthFactorColor = () => {
        if (healthFactor < 1.5) return 'text-danger-500'
        if (healthFactor < 3) return 'text-warning-500'
        return 'text-success-500'
    }

    // Handle max button click
    const handleMaxClick = () => {
        if (selectedLongToken && Number(selectedTokenBalance) > 0) {
            setLongAmount(selectedTokenBalance)
        }
    }

    // Handle token selection
    const handleTokenSelect = (token: Token) => {
        setSelectedLongToken(token)
        setLongAmount('')
    }

    // Handle adjust exposure button click
    const handleAdjustExposure = () => {
        setIsLendBorrowTxDialogOpen(true)
    }

    // Check if button should be disabled
    const isButtonDisabled = !isWalletConnected ||
        !selectedLongToken ||
        !longAmount ||
        Number(longAmount) <= 0 ||
        Number(longAmount) > Number(selectedTokenBalance)

    return (
        <section className="exposure-adjustment-widget flex flex-col gap-3">
            <Card className="flex flex-col gap-3 p-4">
                <CardHeader className="p-0 pl-3">
                    <CardTitle className="text-lg font-medium text-gray-800">Adjust Exposure</CardTitle>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {/* Long Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-4">
                            <Label size="medium">Long</Label>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Balance: {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedTokenBalance,
                                        selectedLongToken ? getMaxDecimalsToDisplay(selectedLongToken.symbol) : 2
                                    )
                                )}
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-2 px-4 flex items-center gap-3 bg-gray-100">
                            {/* Token Dropdown */}
                            <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedLongToken?.logo || ''}
                                    alt={selectedLongToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="group flex items-center gap-1 text-gray-800 p-0 h-auto"
                                        >
                                            <span>{selectedLongToken?.symbol || 'Select'}</span>
                                            <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                                        <div className="h-full max-h-[200px] overflow-y-auto">
                                            {availableTokens.map((token: Token) => (
                                                <DropdownMenuItem
                                                    key={token.address}
                                                    onClick={() => handleTokenSelect(token)}
                                                    className={cn(
                                                        'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                                                        selectedLongToken?.address === token.address && 'bg-gray-400'
                                                    )}
                                                >
                                                    <ImageWithDefault
                                                        src={token.logo || ''}
                                                        alt={token.symbol || ''}
                                                        width={24}
                                                        height={24}
                                                        className="rounded-full max-w-[24px] max-h-[24px]"
                                                    />
                                                    <BodyText
                                                        level="body2"
                                                        weight="medium"
                                                        className="text-gray-800"
                                                    >
                                                        {token.symbol || ''}
                                                    </BodyText>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            {/* Amount Input */}
                            <div className="flex flex-col flex-1 gap-[4px]">
                                <CustomNumberInput
                                    amount={longAmount}
                                    setAmount={(amount) => setLongAmount(amount)}
                                    maxDecimals={selectedLongToken?.decimals || 18}
                                />
                            </div>

                            {/* Max Button */}
                            <Button
                                variant="link"
                                className="uppercase text-[14px] font-medium w-fit text-orange-400 hover:text-orange-500"
                                onClick={handleMaxClick}
                                disabled={!isWalletConnected || Number(selectedTokenBalance) <= 0}
                            >
                                max
                            </Button>
                        </div>
                    </div>

                    {/* Short Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-4">
                            <Label size="medium">Short</Label>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Balance: 0
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-3 px-4 flex items-center gap-3 bg-gray-100">
                            <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedLongToken?.logo || ''}
                                    alt={selectedLongToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <span>{selectedLongToken?.symbol || 'Select token'}</span>
                            </div>

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            <div className="flex flex-col flex-1 gap-[4px]">
                                <BodyText
                                    level="body1"
                                    weight="medium"
                                    className="text-gray-400"
                                >
                                    0.00
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Leverage Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label size="medium">Leverage</Label>
                            <Badge variant="secondary">
                                {leverage}x
                            </Badge>
                        </div>

                        <div className="px-2">
                            <Slider
                                value={[leverage]}
                                min={1}
                                max={10}
                                step={0.1}
                                onValueChange={(values) => setLeverage(values[0])}
                                disabled={!isWalletConnected}
                            />
                            <div className="flex justify-between mt-1">
                                <BodyText
                                    level="body3"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    1x
                                </BodyText>
                                <BodyText
                                    level="body3"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    10x
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Health Factor */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-200 lg:bg-white rounded-5">
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600"
                        >
                            Health Factor
                        </BodyText>
                        <BodyText
                            level="body2"
                            weight="medium"
                            className={cn(
                                "text-gray-800",
                                Number(longAmount) > 0 && getHealthFactorColor()
                            )}
                        >
                            {getHealthFactorDisplay()}
                        </BodyText>
                    </div>

                    {/* USD Information */}
                    {/* <div className="flex items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5">
                        <div className="flex items-center gap-2">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                deposit in USD
                            </BodyText>
                        </div>
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800"
                        >
                            ${selectedLongToken && longAmount ? (Number(longAmount) * selectedLongToken.price_usd).toFixed(2) : '0.00'}
                        </BodyText>
                    </div> */}

                    {/* <div className="flex items-center justify-between px-6 py-2 bg-gray-200 lg:bg-white rounded-5">
                        <div className="flex items-center gap-2">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                borrow in USD
                            </BodyText>
                        </div>
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800"
                        >
                            ${selectedLongToken && longAmount ? (Number(longAmount) * selectedLongToken.price_usd * (leverage - 1)).toFixed(2) : '0.00'}
                        </BodyText>
                    </div> */}
                </CardContent>

                <CardFooter className="p-0 pt-2">
                    {!isWalletConnected ? (
                        <ConnectWalletButton />
                    ) : (
                        <Button
                            onClick={handleAdjustExposure}
                            disabled={isButtonDisabled}
                            variant="primary"
                            className="w-full py-3 rounded-4"
                        >
                            Adjust Exposure
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Confirmation Dialog */}
            {/* {selectedLongToken && (
                <ConfirmationDialog
                    disabled={isButtonDisabled}
                    positionType="lend"
                    assetDetails={{
                        asset: {
                            token: selectedLongToken,
                        },
                        protocol_type: platformData?.platform?.protocol_type,
                        name: platformData?.platform?.name,
                        chain_id: chain_id,
                    }}
                    amount={longAmount}
                    balance={selectedTokenBalance}
                    maxBorrowAmount={{
                        maxToBorrow: '0',
                        maxToBorrowFormatted: '0',
                        maxToBorrowSCValue: '0',
                        user: {},
                    }}
                    setAmount={setLongAmount}
                    healthFactorValues={{
                        healthFactor: healthFactor,
                        newHealthFactor: healthFactor,
                    }}
                    open={isLendBorrowTxDialogOpen}
                    setOpen={setIsLendBorrowTxDialogOpen}
                />
            )} */}
        </section>
    )
}

export default ExposureAdjustmentWidget 