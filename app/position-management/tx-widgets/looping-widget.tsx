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
import { ChainId } from '@/types/chain'
import { TToken } from '@/types'
import { useIguanaDexData } from '@/hooks/protocols/useIguanaDexData'
import { parseUnits } from 'viem'

interface LoopingWidgetProps {
    isLoading?: boolean
    platformData?: any
    portfolioData?: any
}

const LoopingWidget: FC<LoopingWidgetProps> = ({
    isLoading = false,
    platformData,
    portfolioData,
}) => {
    const searchParams = useSearchParams() || new URLSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const [isLoopTxDialogOpen, setIsLoopTxDialogOpen] = useState(false)

    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()

    const { getTradePath } = useIguanaDexData()
    const [isLoadingTradePath, setIsLoadingTradePath] = useState<boolean>(false)

    // const { lendTx, isLendBorrowTxDialogOpen, setIsLendBorrowTxDialogOpen } =
    //     useTxContext() as TTxContext

    const [availableLendTokens, setAvailableLendTokens] = useState<TToken[]>([])
    const [availableBorrowTokens, setAvailableBorrowTokens] = useState<
        TToken[]
    >([])
    const [selectedLendToken, setSelectedLendToken] = useState<TToken>(
        availableLendTokens[0]
    )
    const [selectedBorrowToken, setSelectedBorrowToken] = useState<TToken>(
        availableBorrowTokens[0]
    )
    const [lendAmount, setLendAmount] = useState<string>('0')
    const [lendAmountRaw, setLendAmountRaw] = useState<string>('0')
    const [borrowAmount, setBorrowAmount] = useState<string>('0')
    const [borrowAmountRaw, setBorrowAmountRaw] = useState<string>('0')
    const [leverage, setLeverage] = useState<number>(1)
    const [healthFactor, setHealthFactor] = useState<number>(0)
    const [flashLoanAmount, setFlashLoanAmount] = useState<string>('0')
    const [pathTokens, setPathTokens] = useState<string[]>([])
    const [pathFees, setPathFees] = useState<string[]>([])
    const { getMaxLeverage, getBorrowTokenAmountForLeverage, providerStatus } =
        useAaveV3Data()
    const [maxLeverage, setMaxLeverage] = useState<Record<
        string,
        Record<string, number>
    > | null>(null)

    // Token balances
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    // Setup tokens when platform data is available
    useEffect(() => {
        if (platformData?.assets?.length > 0) {
            const lendTokens = platformData.assets
                .filter((asset: any) => true)
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })
            const borrowTokens = platformData.assets
                .filter((asset: any) => asset.borrow_enabled)
                .map((asset: any) => {
                    return {
                        ...asset.token,
                        chain_id: platformData.platform.chain_id,
                        chain_name: ChainId[platformData.platform.chain_id],
                    }
                })
            // Select the first token by default
            const defaultLendToken =
                lendTokens.find(
                    (token: TToken) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || lendTokens[0]

            const defaultBorrowToken =
                borrowTokens.find(
                    (token: TToken) =>
                        token.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                ) || borrowTokens[0]

            setAvailableLendTokens(lendTokens)
            setAvailableBorrowTokens(borrowTokens)
            setSelectedLendToken(defaultLendToken)
            setSelectedBorrowToken(defaultBorrowToken)
        }
    }, [!!platformData, !!tokenAddress])

    useEffect(() => {
        if (providerStatus.isReady) {
            getMaxLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress:
                    '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
                lendingPoolAddressProvider:
                    '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec',
            }).then((results) => {
                setMaxLeverage(results as any)
            })

            getBorrowTokenAmountForLeverage({
                chainId: ChainId.Etherlink,
                uiPoolDataProviderAddress:
                    '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
                lendingPoolAddressProvider:
                    '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec',
                supplyToken: selectedLendToken?.address || '',
                supplyTokenAmount: parseUnits(lendAmount, selectedLendToken?.decimals || 18).toString(),
                leverage: leverage,
                borrowToken: selectedBorrowToken?.address || '',
                _walletAddress: walletAddress, // 0x0e9852b16ae49c99b84b0241e3c6f4a5692c6b05
            }).then((result) => {
                console.log('Borrow token amount for leverage result', result)
                setHealthFactor(Number(result?.healthFactor ?? 0))
                setBorrowAmount(result.amountFormatted)
                setBorrowAmountRaw(result.amount)
                setFlashLoanAmount(result.flashLoanAmountFormatted ?? '0')
            })
        }
    }, [providerStatus.isReady, selectedLendToken?.address, lendAmount, selectedBorrowToken?.address, leverage])

    useEffect(() => {
        if (!!selectedBorrowToken && !!selectedLendToken && !!Number(borrowAmountRaw)) {
            setIsLoadingTradePath(true)
            getTradePath(selectedBorrowToken?.address, selectedLendToken?.address, borrowAmountRaw)
                .then((result: any) => {
                    console.log('Trade path result', result)
                    const pathTokens: string[] = result.routes[0].path.map((path: any) => path.address) // [Borrow token address, Lend token address]
                    const pathFees: string[] = result.routes[0].pools.map((pool: any) => pool.fee.toString())
                    setPathTokens(pathTokens)
                    setPathFees(pathFees)
                })
                .catch((error) => {
                    console.error('Error fetching trade path\n', error)
                })
                .finally(() => {
                    setIsLoadingTradePath(false)
                })
        }
    }, [selectedBorrowToken?.address, selectedLendToken?.address, borrowAmountRaw, lendAmount])

    // Get balance for selected token
    const getTokenBalance = (token: TToken | null) => {
        if (!token || !isWalletConnected) return '0'

        return (
            erc20TokensBalanceData[Number(chain_id)]?.[
                token.address.toLowerCase()
            ]?.balanceFormatted ?? '0'
        ).toString()
    }

    // @Shreyas:
    /**
     * Even before all this
     * 1. Extract all the data pipeline to a different hook or function.
     * 2. Update useEffect etc to be dynamic, rn it's hard coded
     * TLDR : Cache the aave data hook based on chain id.
     *
     * Fetching data
     * 1. Get trade path using useIguanaDexData => getTradePath(borrowToken, lendToken, borrowAmount) => swap path token, swap path fees
     * 2. Get flash loan amount using useAaveV3Data
     *
     * Approvals
     * 1. Give approval to looping leverage sc of Lend token for lend amount => refer useIguanaDexData => loopingApproval => Params : SupplyToken, supplyTokenAmount
     * 2. Give approval to looping leverage sc of Credit delegation => refer useIguanaDexData => delegationCallApproval => Params : BorrowToken
     *
     * Call
     * 1. Smart contract call => refer useIguanaDexData => loopingCall => Params : supplyToken, borrowToken, supplyTokenAmount, flashLoanAmount, pathTokens, pathFees
     */

    const selectedLendTokenBalance = getTokenBalance(selectedLendToken)
    const selectedBorrowTokenBalance = getTokenBalance(selectedBorrowToken)

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
        if (selectedLendToken && Number(selectedLendTokenBalance) > 0) {
            setLendAmount(selectedLendTokenBalance)
        }
    }

    const handleLendTokenSelect = (token: TToken) => {
        setSelectedLendToken(token)
        setLendAmount('')
    }

    const handleBorrowTokenSelect = (token: TToken) => {
        setSelectedBorrowToken(token)
        setBorrowAmount('0.00')
    }
    // Check if button should be disabled
    const diableActionButton =
        !isWalletConnected ||
        !selectedLendToken ||
        !lendAmount ||
        (Number(lendAmount) <= 0) ||
        (Number(lendAmount) > Number(selectedLendTokenBalance)) || 
        isLoadingTradePath || 
        Number(borrowAmount) <= 0

    // looping-widget
    return (
        <section className="looping-widget flex flex-col gap-3">
            <Card className="flex flex-col gap-3 p-4">
                <CardHeader className="p-0 pl-3">
                    <CardTitle className="text-lg font-medium text-gray-800">
                        Create New Loop Position
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {/* Lend Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-2">
                            <Label size="medium">Lend</Label>
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
                                        selectedLendTokenBalance,
                                        selectedLendToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedLendToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText>
                        </div>

                        <div className="border rounded-5 border-gray-200 py-1 px-4 flex items-center gap-3 bg-gray-100">
                            {/* Token Dropdown */}
                            <TokenSelector
                                selectedToken={selectedLendToken}
                                availableTokens={availableLendTokens}
                                handleTokenSelect={handleLendTokenSelect}
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
                                    amount={lendAmount}
                                    setAmount={(amount) =>
                                        setLendAmount(amount)
                                    }
                                    maxDecimals={
                                        selectedLendToken?.decimals || 18
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
                                    Number(selectedLendTokenBalance) <= 0
                                }
                            >
                                max
                            </Button>
                        </div>
                    </div>

                    {/* Borrow Position Section */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1 px-2">
                            <Label size="medium">Borrow</Label>
                            {/* <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Balance:{' '}
                                {isLoadingErc20TokensBalanceData ? (
                                    <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                ) : (
                                    handleSmallestValue(
                                        selectedBorrowTokenBalance,
                                        selectedBorrowToken
                                            ? getMaxDecimalsToDisplay(
                                                selectedBorrowToken.symbol
                                            )
                                            : 2
                                    )
                                )}
                            </BodyText> */}
                        </div>

                        <div className="border rounded-5 border-gray-200 py-2 px-4 flex items-center gap-3 bg-gray-100 max-w-full">
                            {/* Single Token */}
                            {/* <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={selectedLendToken?.logo || ''}
                                    alt={selectedLendToken?.symbol || ''}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <BodyText
                                    level="body2"
                                    weight="medium"
                                    className="text-gray-800"
                                >
                                    {selectedLendToken?.symbol || 'Select token'}
                                </BodyText>
                            </div> */}
                            {/* Token Selector */}
                            <TokenSelector
                                selectedToken={selectedBorrowToken}
                                availableTokens={availableBorrowTokens}
                                handleTokenSelect={handleBorrowTokenSelect}
                            />

                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>

                            <div className="flex flex-col flex-1 gap-[4px] max-w-full">
                                <BodyText
                                    level="custom"
                                    weight="medium"
                                    className={cn(
                                        'text-[24px] cursor-not-allowed hover:text-gray-500 select-none truncate max-w-[180px]',
                                        borrowAmount === '0.00'
                                            ? 'text-gray-500'
                                            : 'text-gray-800'
                                    )}
                                >
                                    {isLoadingTradePath ? (
                                        <LoaderCircle className="text-primary w-4 h-4 animate-spin inline" />
                                    ) : (
                                        borrowAmount
                                    )}
                                </BodyText>
                            </div>
                        </div>
                    </div>

                    {/* Leverage Slider */}
                    <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                            <Label size="medium">Leverage</Label>
                            <Badge variant="secondary">{leverage}x</Badge>
                        </div>

                        <div className="">
                            <Slider
                                value={[leverage]}
                                min={1}
                                max={
                                    Number(
                                        abbreviateNumber(
                                            maxLeverage?.[
                                            selectedLendToken?.address
                                            ]?.[selectedBorrowToken?.address] ??
                                            1,
                                            1
                                        )
                                    ) || 1
                                }
                                step={0.1}
                                onValueChange={(values) =>
                                    setLeverage(values[0])
                                }
                                disabled={
                                    !isWalletConnected ||
                                    Number(lendAmount) <= 0 ||
                                    (maxLeverage?.[
                                        selectedLendToken?.address
                                    ]?.[selectedBorrowToken?.address] ?? 0) <= 1
                                }
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
                                    {abbreviateNumber(
                                        maxLeverage?.[
                                        selectedLendToken?.address
                                        ]?.[selectedBorrowToken?.address] ?? 1,
                                        1
                                    )}
                                    x
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
                                Number(lendAmount) > 0 && getHealthFactorColor()
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
                            ${selectedLendToken && lendAmount ? (Number(lendAmount) * selectedLendToken.price_usd).toFixed(2) : '0.00'}
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
                            ${selectedLendToken && lendAmount ? (Number(lendAmount) * selectedLendToken.price_usd * (leverage - 1)).toFixed(2) : '0.00'}
                        </BodyText>
                    </div> */}
                </CardContent>

                <CardFooter className="p-0 pt-2">
                    {!isWalletConnected ? (
                        <ConnectWalletButton />
                    ) : (
                        <ConfirmationDialog
                            disabled={diableActionButton}
                            positionType="loop"
                            loopAssetDetails={{
                                supplyAsset: {
                                    token: selectedLendToken,
                                    borrow_enabled: false,
                                    ltv: 0,
                                    remaining_borrow_cap: 0,
                                    remaining_supply_cap: 0,
                                    stable_borrow_apy: 0,
                                    supply_apy: 0,
                                    variable_borrow_apy: 0,
                                },
                                borrowAsset: {
                                    token: selectedBorrowToken,
                                    borrow_enabled: true,
                                    ltv: 0,
                                    remaining_borrow_cap: 0,
                                    remaining_supply_cap: 0,
                                },
                                pathTokens,
                                pathFees,
                                ...platformData?.platform,
                            }}
                            lendAmount={lendAmount}
                            borrowAmount={borrowAmount}
                            flashLoanAmount={flashLoanAmount}
                            balance={selectedLendTokenBalance}
                            maxBorrowAmount={{
                                maxToBorrow: '0',
                                maxToBorrowFormatted: '0',
                                maxToBorrowSCValue: '0',
                                user: {},
                            }}
                            setAmount={setLendAmount}
                            healthFactorValues={{
                                healthFactor: null,
                                newHealthFactor: healthFactor,
                            }}
                            open={isLoopTxDialogOpen}
                            setOpen={setIsLoopTxDialogOpen}
                            leverage={leverage}
                        />
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

function TokenSelector({
    selectedToken,
    availableTokens,
    handleTokenSelect,
}: {
    selectedToken: TToken
    availableTokens: TToken[]
    handleTokenSelect: (token: TToken) => void
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
                    {availableTokens.map((token: TToken) => (
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

export default LoopingWidget
