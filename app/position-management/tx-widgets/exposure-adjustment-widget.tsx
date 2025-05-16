'use client'

import { FC, useState, useEffect, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
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
import {
    cn,
    abbreviateNumber,
    getLowestDisplayValue,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import {
    ConfirmationDialog,
    getMaxDecimalsToDisplay,
    handleSmallestValue,
} from '@/components/dialogs/TxDialog'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { useAaveV3Data } from '../../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'

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
    portfolioData,
}) => {
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

    const { lendTx, isLendBorrowTxDialogOpen, setIsLendBorrowTxDialogOpen } =
        useTxContext() as TTxContext

    const [availableLongTokens, setAvailableLongTokens] = useState<Token[]>([])
    const [availableShortTokens, setAvailableShortTokens] = useState<Token[]>([])
    const [selectedLongToken, setSelectedLongToken] = useState<Token>(
        availableLongTokens[0]
    )
    const [selectedShortToken, setSelectedShortToken] = useState<Token>(
        availableShortTokens[0]
    )
    const [longAmount, setLongAmount] = useState<string>('')
    const [shortAmount, setShortAmount] = useState<string>('0.00')
    const [leverage, setLeverage] = useState<number>(1)
    const [healthFactor, setHealthFactor] = useState<number>(0)
    const {
        getMaxLeverage,
        getBorrowTokenAmountForLeverage,
        providerStatus,
    } = useAaveV3Data()
    const [maxLeverage, setMaxLeverage] = useState<Record<
        string,
        Record<string, number>
    > | null>(null)
    // console.log('selectedLongToken', selectedLongToken)
    // console.log('selectedShortToken', selectedShortToken)
    // console.log('maxLeverage', maxLeverage?.[selectedLongToken?.address]?.[selectedShortToken?.address])
    const [borrowTokenAmountForLeverage, setBorrowTokenAmountForLeverage] =
        useState<{
            amount: string
            amountFormatted: string
            healthFactor: string
        }>({
            amount: '0',
            amountFormatted: '0',
            healthFactor: '0',
        })

    // Token balances
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    // Setup tokens when platform data is available
    useEffect(() => {
        if (platformData?.assets?.length > 0) {
            const longTokens = platformData.assets.filter((asset: any) => !asset.borrow_enabled).map((asset: any) => asset.token)
            const shortTokens = platformData.assets.filter((asset: any) => asset.borrow_enabled).map((asset: any) => asset.token)
            // Select the first token by default
            const defaultLongToken =
                longTokens.find(
                    (token: Token) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || longTokens[0]

            const defaultShortToken =
                shortTokens.find(
                    (token: Token) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || shortTokens[0]

            setAvailableLongTokens(longTokens)
            setAvailableShortTokens(shortTokens)
            setSelectedLongToken(defaultLongToken)
            setSelectedShortToken(defaultShortToken)
        }
    }, [platformData, tokenAddress])

    // Calculate health factor whenever long amount or leverage changes
    // useEffect(() => {
    //     if (selectedLongToken && longAmount && Number(longAmount) > 0) {
    //         setHealthFactor(Math.max(0.5, Math.min(10, 0)))
    //     } else {
    //         setHealthFactor(0)
    //     }
    // }, [selectedLongToken, longAmount, leverage])

    useEffect(() => {
        if (providerStatus.isReady) {
            getMaxLeverage(
                42793,
                '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
                '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec'
            ).then((results) => {
                setMaxLeverage(results as any)
            })

            getBorrowTokenAmountForLeverage(
                42793,
                '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
                '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec',
                '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb', // WXTZ
                BigNumber.from('1').mul(BigNumber.from(10).pow(18)).toString(),
                2.1,
                '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC
                '0x0e9852b16ae49c99b84b0241e3c6f4a5692c6b05' // some random wallet address with money
            ).then((result) => {
                setBorrowTokenAmountForLeverage(result)
            })
        }
    }, [providerStatus.isReady])

    // Get balance for selected token
    const getTokenBalance = (token: Token | null) => {
        if (!token || !isWalletConnected) return '0'

        return (
            erc20TokensBalanceData[Number(chain_id)]?.[
                token.address.toLowerCase()
            ]?.balanceFormatted ?? '0'
        ).toString()
    }

    const selectedLongTokenBalance = getTokenBalance(selectedLongToken)
    const selectedShortTokenBalance = getTokenBalance(selectedShortToken)

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
        if (selectedLongToken && Number(selectedLongTokenBalance) > 0) {
            setLongAmount(selectedLongTokenBalance)
        }
    }

    const handleLongTokenSelect = (token: Token) => {
        setSelectedLongToken(token)
        setLongAmount('')
    }

    const handleShortTokenSelect = (token: Token) => {
        setSelectedShortToken(token)
        setShortAmount('0.00')
    }

    // Handle adjust exposure button click
    const handleAdjustExposure = () => {
        setIsLendBorrowTxDialogOpen(true)
    }

    // Check if button should be disabled
    const isButtonDisabled =
        !isWalletConnected ||
        !selectedLongToken ||
        !longAmount ||
        Number(longAmount) <= 0 ||
        Number(longAmount) > Number(selectedLongTokenBalance)

    return (
        <section className="exposure-adjustment-widget flex flex-col gap-3">
            <Card className="flex flex-col gap-3 p-4">
                <CardHeader className="p-0 pl-3">
                    <CardTitle className="text-lg font-medium text-gray-800">
                        Adjust Exposure
                    </CardTitle>
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
                                Balance:{' '}
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedLongTokenBalance,
                                        selectedLongToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedLongToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-1 px-4 flex items-center gap-3 bg-gray-100">
                            {/* Token Dropdown */}
                            <TokenSelector
                                selectedToken={selectedLongToken}
                                availableTokens={availableLongTokens}
                                handleTokenSelect={handleLongTokenSelect}
                            />

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
                                    setAmount={(amount) =>
                                        setLongAmount(amount)
                                    }
                                    maxDecimals={
                                        selectedLongToken?.decimals || 18
                                    }
                                />
                            </div>

                            {/* Max Button */}
                            <Button
                                variant="link"
                                className="uppercase text-[14px] font-medium"
                                onClick={handleMaxClick}
                                disabled={
                                    !isWalletConnected ||
                                    Number(selectedLongTokenBalance) <= 0
                                }
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
                                Balance:{' '}
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedShortTokenBalance,
                                        selectedShortToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedShortToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-2 px-4 flex items-center gap-3 bg-gray-100">
                            {/* Single Token */}
                            {/* <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedLongToken?.logo || ''}
                                    alt={selectedLongToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    {selectedLongToken?.symbol || 'Select token'}
                                </BodyText>
                            </div> */}
                            {/* Token Selector */}
                            <TokenSelector
                                selectedToken={selectedShortToken}
                                availableTokens={availableShortTokens}
                                handleTokenSelect={handleShortTokenSelect}
                            />

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            <div className="flex flex-col flex-1 gap-[4px]">
                                <BodyText
                                    level="custom"
                                    weight="medium"
                                    className="text-gray-400 text-[24px]"
                                >
                                    {shortAmount}
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Leverage Slider */}
                    <div className="space-y-2 px-4">
                        <div className="flex justify-between items-center">
                            <Label size="medium">Leverage</Label>
                            <Badge variant="secondary">{leverage}x</Badge>
                        </div>

                        <div className="px-2">
                            <Slider
                                value={[leverage]}
                                min={1}
                                max={maxLeverage?.[selectedLongToken?.address]?.maxLeverage || 10}
                                step={0.1}
                                onValueChange={(values) =>
                                    setLeverage(values[0])
                                }
                                disabled={!isWalletConnected}
                            />
                            <div className="flex justify-between mt-3">
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
                                'text-gray-800',
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

function TokenSelector({
    selectedToken,
    availableTokens,
    handleTokenSelect,
}: {
    selectedToken: Token
    availableTokens: Token[]
    handleTokenSelect: (token: Token) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="group flex items-center gap-1 text-gray-800 p-0 h-auto"
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={selectedToken?.logo || ''}
                            alt={selectedToken?.symbol || ''}
                            width={24}
                            height={24}
                            className="rounded-full max-w-[24px] max-h-[24px]"
                        />
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800"
                        >
                            {selectedToken?.symbol || 'Select token'}
                        </BodyText>
                        <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                    </div>
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
                                selectedToken?.address === token.address &&
                                'bg-gray-400'
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
    )
}

export default ExposureAdjustmentWidget
