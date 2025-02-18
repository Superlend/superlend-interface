'use client'

import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyText } from '@/components/ui/typography'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    cn,
    getLowestDisplayValue,
} from '@/lib/utils'
import { TPlatform, TPositionType } from '@/types'
import { PlatformType, TPlatformAsset } from '@/types/platform'
import { LoaderCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConfirmationDialog, handleSmallestValue } from '@/components/dialogs/TxDialog'
import ImageWithDefault from '@/components/ImageWithDefault'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import { Button } from '@/components/ui/button'
import {
    CHAIN_ID_MAPPER,
    MORPHO_ETHERSCAN_TUTORIAL_LINK,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
} from '@/constants'
import ConnectWalletButton from '@/components/ConnectWalletButton'

import { AccrualPosition, MarketId } from '@morpho-org/blue-sdk'
import {
    useHolding,
    useMarket,
    usePosition,
    useUser,
    useVault,
    useVaultUser,
} from '@morpho-org/blue-sdk-wagmi'
import { formatUnits } from 'viem'
import CustomAlert from '@/components/alerts/CustomAlert'
import ExternalLink from '@/components/ExternalLink'
import { TLendTx, TTxContext, useTxContext } from '@/context/tx-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'

export default function MorphoTxWidget({
    isLoading: isLoadingPlatformData,
    platformData
}: {
    isLoading: boolean
    platformData: TPlatform
}) {
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || 1
    const { walletAddress, handleSwitchChain } = useWalletConnection()

    const isFluidProtocol = platformData?.platform?.protocol_type === PlatformType.FLUID
    const isFluidLend = isFluidProtocol && !platformData?.platform?.isVault
    const isFluidVaults = isFluidProtocol && platformData?.platform?.isVault

    // Switch chain
    useEffect(() => {
        if (!!walletAddress) {
            handleSwitchChain(Number(chain_id))
        }
    }, [walletAddress, Number(chain_id)])

    if (!isFluidLend && !isFluidVaults) {
        return null
    }

    // Fluid Lend
    if (isFluidLend) {
        return (
            <FluidLend
                platformData={platformData}
                walletAddress={walletAddress as `0x${string}`}
            />
        )
    }

    // Fluid Vaults
    // if (isFluidVaults) {
    //     return (
    //         <FluidVaults
    //             platformData={platformData}
    //             walletAddress={walletAddress as `0x${string}`}
    //             isLoadingPlatformData={isLoadingPlatformData}
    //         />
    //     )
    // }

    return null;
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}

function FluidLend({
    platformData,
    walletAddress
}: {
    platformData: TPlatform
    walletAddress: `0x${string}`
}) {
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || '1'
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [selectedAssetTokenDetails, setSelectedAssetTokenDetails] =
        useState<TPlatformAsset | null>(null)
    const { lendTx, setLendTx, borrowTx, isLendBorrowTxDialogOpen, setIsLendBorrowTxDialogOpen } = useTxContext() as TTxContext
    const { isWalletConnected } = useWalletConnection()
    const [amount, setAmount] = useState('')
    const positionTypeParam: TPositionType = 'lend'

    useEffect(() => {
        setPositionType(positionTypeParam)
    }, [positionTypeParam])

    useEffect(() => {
        if (platformData?.assets[0]) {
            setSelectedAssetTokenDetails(platformData?.assets[0])
        }
    }, [platformData, setSelectedAssetTokenDetails])

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (lendTx.status === 'view' && !isLendBorrowTxDialogOpen) {
            setIsRefreshingErc20TokensBalanceData(true)
        }

        if (borrowTx.status === 'view' && !isLendBorrowTxDialogOpen) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [
        lendTx.status,
        borrowTx.status,
        isLendBorrowTxDialogOpen,
    ])

    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[
            (selectedAssetTokenDetails?.token?.address?.toLowerCase() ?? '').toLowerCase()
        ]?.balanceFormatted ?? 0
    ).toString()

    const isLoading = isLoadingErc20TokensBalanceData

    // console.log("Selected asset token details", selectedAssetTokenDetails)

    // console.log("User token balances data", balance)

    function getMaxDecimalsToDisplay(): number {
        return selectedAssetTokenDetails?.token?.symbol
            .toLowerCase()
            .includes('btc') ||
            selectedAssetTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('eth')
            ? 6
            : 2
    }

    const isDisabledMaxBtn = () => {
        return (
            Number(amount) === Number(balance) ||
            !isWalletConnected ||
            isLoadingErc20TokensBalanceData ||
            Number(balance) <= 0
        )
    }

    const toManyDecimals = useMemo(() => {
        if (selectedAssetTokenDetails) {
            return checkDecimalPlaces(
                amount,
                selectedAssetTokenDetails?.token?.decimals ?? 0
            )
        }
        return false
    }, [selectedAssetTokenDetails, amount])

    const lendErrorMessage = useMemo(() => {
        if (amount === '') {
            return null
        }
        if (Number(amount) > Number(balance) || Number(balance) <= 0) {
            return 'You do not have enough balance'
        } else if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        } else {
            return null
        }
    }, [amount, balance, toManyDecimals])

    const disabledButton: boolean = useMemo(
        () =>
            Number(amount) > Number(balance) ||
            Number(amount) <= 0 ||
            toManyDecimals,
        [amount, balance, toManyDecimals]
    )

    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="medium"
                        className="capitalize text-black/90"
                    >
                        Lend
                    </BodyText>
                    {isWalletConnected && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal:{' '}
                            {isLoadingErc20TokensBalanceData ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(balance ?? 0),
                                            getMaxDecimalsToDisplay()
                                        )
                                    ),
                                    getMaxDecimalsToDisplay()
                                )
                            )}
                            <span className="inline-block truncate max-w-[70px]">
                                {selectedAssetTokenDetails?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div
                        className={cn(
                            isLendPositionType(positionType)
                                ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
                                : 'border-t rounded-t-5',
                            'border-gray-200 py-[12px] px-[16px] flex items-center gap-[12px]'
                        )}
                    >
                        {isLoading && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {/* Lend position type - Selected token image */}
                        {/* {(isLoading ||
                            !selectedAssetTokenDetails?.token?.address) &&
                            isLendPositionType(positionType) && (
                                <LoaderCircle className="text-primary w-[60px] h-[34px] animate-spin" />
                            )} */}
                        {!isLoading &&
                            !!selectedAssetTokenDetails?.token?.address && (
                                <ImageWithDefault
                                    src={
                                        selectedAssetTokenDetails?.token
                                            ?.logo || ''
                                    }
                                    alt={
                                        selectedAssetTokenDetails?.token
                                            ?.symbol || ''
                                    }
                                    className="shrink-0 w-[24px] h-[24px] rounded-full"
                                    width={24}
                                    height={24}
                                />
                            )}
                        <div className="flex flex-1 flex-col gap-[4px]">
                            <CustomNumberInput
                                key={positionType}
                                amount={amount}
                                setAmount={(amount) => setAmount(amount)}
                            />
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium ml-auto"
                            onClick={() => setAmount(balance ?? '0')}
                            disabled={isDisabledMaxBtn()}
                        >
                            max
                        </Button>
                    </div>
                    {isWalletConnected && (
                        <div className="card-content-bottom px-5 py-3">
                            {(isLoading || !lendErrorMessage) && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="mx-auto w-full text-gray-500 text-center max-w-[250px]"
                                >
                                    {isLoading && 'Loading balance...'}
                                    {!lendErrorMessage &&
                                        !isLoading &&
                                        'Enter amount to proceed with supplying to vault'}
                                </BodyText>
                            )}
                            {lendErrorMessage && !isLoading && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-center text-destructive-foreground"
                                >
                                    {lendErrorMessage}
                                </BodyText>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!isWalletConnected && <ConnectWalletButton />}
                    {isWalletConnected && !isLoading && (
                        <div className="flex flex-col gap-[12px] w-full">
                            <ConfirmationDialog
                                disabled={disabledButton}
                                positionType={positionType}
                                assetDetails={{
                                    asset: selectedAssetTokenDetails,
                                    ...platformData?.platform,
                                }}
                                amount={amount}
                                balance={balance}
                                // TODO: Get max borrow amount
                                maxBorrowAmount={'0.0'}
                                setAmount={setAmount}
                                // TODO: Get health factor values
                                healthFactorValues={{
                                    healthFactor: 0.0,
                                    newHealthFactor: 0.0,
                                }}
                                isVault={true}
                                open={isLendBorrowTxDialogOpen}
                                setOpen={setIsLendBorrowTxDialogOpen}
                            />
                        </div>
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

function FluidVaults({
    platformData,
    walletAddress,
    isLoadingPlatformData,
}: {
    platformData: TPlatform
    walletAddress: `0x${string}`
    isLoadingPlatformData: boolean
}) {
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || '1'
    const positionTypeParam: TPositionType =
        (searchParams.get('position_type') as TPositionType) || 'lend'
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [selectedAssetTokenDetails, setSelectedAssetTokenDetails] =
        useState<TPlatformAsset | null>(null)
    const { lendTx, borrowTx, withdrawTx, repayTx, isLendBorrowTxDialogOpen, setIsLendBorrowTxDialogOpen } = useTxContext() as TTxContext
    const [refresh, setRefresh] = useState(false)
    const { isWalletConnected } = useWalletConnection()
    const [amount, setAmount] = useState('')

    const fluidLendTokenDetails = platformData?.assets.find(
        (asset) => asset.borrow_enabled === false
    )

    const fluidBorrowTokenDetails = platformData?.assets?.find(
        (asset) => asset.borrow_enabled === true
    )

    useEffect(() => {
        const isRefresh =
            (lendTx.status === 'view' && lendTx.isConfirmed) ||
            (borrowTx.status === 'view' && borrowTx.isConfirmed) ||
            (withdrawTx.status === 'view' && withdrawTx.isConfirmed) ||
            (repayTx.status === 'view' && repayTx.isConfirmed)
        if (isRefresh) {
            setRefresh(true)
        }
    }, [
        lendTx.status,
        lendTx.isConfirmed,
        borrowTx.status,
        borrowTx.isConfirmed,
        withdrawTx.status,
        withdrawTx.isConfirmed,
        repayTx.status,
        repayTx.isConfirmed,
    ])

    useEffect(() => {
        if (refresh) {
            setTimeout(() => {
                setRefresh(false)
            }, 30000)
        }
    }, [refresh])

    // Refresh balance when view(success) UI after supplying/borrowing an asset
    useEffect(() => {
        if (
            (lendTx.status === 'view' || borrowTx.status === 'view') &&
            !isLendBorrowTxDialogOpen
        ) {
            setIsRefreshingErc20TokensBalanceData(true)
        }
    }, [
        lendTx.status,
        borrowTx.status,
        isLendBorrowTxDialogOpen,
    ])

    const [maxBorrowAmount, setMaxBorrowAmount] = useState('0')
    const [isLoadingMaxBorrowingAmount, setIsLoadingMaxBorrowingAmount] =
        useState(true)

    const [hasCollateral, setHasCollateral] = useState(false)
    const [canBorrow, setCanBorrow] = useState(false)

    const [doesMarketHasLiquidity, setDoesMarketHasLiquidity] = useState(true)

    // health factor
    const [healthFactor, setHealthFactor] = useState(0)

    const getUpdatedHealthFactor = (
        position: any,
        morphoMarketData: any,
        selectedAssetTokenDetails: any,
        fluidBorrowTokenDetails: any,
        amount: string
    ) => {
        if (
            !position ||
            !morphoMarketData ||
            !selectedAssetTokenDetails ||
            !fluidBorrowTokenDetails
        ) {
            return 0.0
        }

        const accrualPosition: AccrualPosition = new AccrualPosition(
            position,
            morphoMarketData
        )
        const currentBorrowAssets = accrualPosition.borrowAssets ?? BigInt(0)

        const collNormalizeValue = Number(
            formatUnits(
                accrualPosition.collateral ?? BigInt(0),
                selectedAssetTokenDetails?.token?.decimals ?? 0
            )
        )
        const borrowNormalizeValue =
            currentBorrowAssets == BigInt(0)
                ? 0
                : Number(
                    formatUnits(
                        currentBorrowAssets,
                        fluidBorrowTokenDetails?.token?.decimals ?? 0
                    )
                )
        const borrowNormalizeValueWithAmount =
            borrowNormalizeValue + Number(amount)

        const collUsdValue =
            collNormalizeValue *
            (selectedAssetTokenDetails?.token?.price_usd ?? 0)
        const borrowUsdValue =
            borrowNormalizeValueWithAmount *
            (fluidBorrowTokenDetails?.token?.price_usd ?? 0)

        if (fluidBorrowTokenDetails?.ltv) {
            const lltv = (fluidBorrowTokenDetails?.ltv ?? 1) / 100
            const healthFactor = (collUsdValue * lltv) / borrowUsdValue
            return healthFactor
        }
        return 0.0
    }

    const isLoading = isLoadingPlatformData
    // || isLoadingMaxBorrowingAmount

    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    useEffect(() => {
        if (fluidLendTokenDetails) {
            setSelectedAssetTokenDetails(fluidLendTokenDetails)
        }
    }, [fluidLendTokenDetails, setSelectedAssetTokenDetails])

    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[
            (selectedAssetTokenDetails?.token?.address ?? '').toLowerCase()
        ]?.balanceFormatted ?? 0
    ).toString()

    // TODO: Loading helper text add support for borrow
    const isLoadingHelperText = isLendPositionType(positionType)
        ? isLoadingErc20TokensBalanceData
        : false

    const toManyDecimals = useMemo(() => {
        if (selectedAssetTokenDetails) {
            return checkDecimalPlaces(
                amount,
                isLendPositionType(positionType)
                    ? (selectedAssetTokenDetails?.token?.decimals ?? 0)
                    : (fluidBorrowTokenDetails?.token?.decimals ?? 0)
            )
        }
        return false
    }, [selectedAssetTokenDetails, amount])

    const lendErrorMessage = useMemo(() => {
        if (Number(amount) > Number(balance) || Number(balance) <= 0) {
            return 'You do not have enough balance'
        } else if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        } else {
            return null
        }
    }, [amount, balance, toManyDecimals])

    const borrowErrorMessage = useMemo(() => {
        if (toManyDecimals) {
            return TOO_MANY_DECIMALS_VALIDATIONS_TEXT
        }
        if (!hasCollateral) {
            return 'You do not have any collateral'
        }
        if (!canBorrow || Number(amount) > Number(maxBorrowAmount ?? 0)) {
            return 'You do not have any borrow limit'
        }
        return null
    }, [hasCollateral, canBorrow, amount, maxBorrowAmount, toManyDecimals])

    const errorMessage = useMemo(() => {
        if (amount === '') {
            return null
        }
        return isLendPositionType(positionType)
            ? lendErrorMessage
            : borrowErrorMessage
    }, [positionType, lendErrorMessage, borrowErrorMessage, amount])

    function getLoadingHelperText() {
        return isLendPositionType(positionType)
            ? 'Loading balance...'
            : 'Loading borrow limit...'
    }

    const disabledButton: boolean = useMemo(
        () =>
            Number(amount) >
            Number(
                isLendPositionType(positionType) ? balance : maxBorrowAmount
            ) ||
            (isLendPositionType(positionType) ? false : !hasCollateral) ||
            Number(amount) <= 0 ||
            toManyDecimals ||
            (!isLendPositionType(positionType) && !doesMarketHasLiquidity),
        [
            amount,
            balance,
            maxBorrowAmount,
            toManyDecimals,
            hasCollateral,
            positionType,
            doesMarketHasLiquidity,
        ]
    )

    function getMaxDecimalsToDisplay(): number {
        return isLendPositionType(positionType)
            ? fluidLendTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                fluidLendTokenDetails?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 6
                : 2
            : fluidBorrowTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                fluidBorrowTokenDetails?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 6
                : 2
    }

    const isDisabledMaxBtn = () => {
        if (isLendPositionType(positionType)) {
            return (
                Number(amount) === Number(balance) ||
                !isWalletConnected ||
                isLoadingErc20TokensBalanceData ||
                Number(balance) <= 0
            )
        }

        // TODO: Get max borrow amount
        return (
            Number(amount) === Number(maxBorrowAmount) ||
            !isWalletConnected ||
            isLoadingMaxBorrowingAmount ||
            isLoadingErc20TokensBalanceData ||
            Number(maxBorrowAmount) <= 0 ||
            !doesMarketHasLiquidity
        )
    }

    return (
        <section className="collateral-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <ToggleTab
                type={positionType === "lend" ? "tab1" : "tab2"}
                handleToggle={(positionType: TTypeToMatch) => {
                    setAmount('')
                    setPositionType(positionType === "tab1" ? "lend" : "borrow")
                }}
                title={{
                    tab1: 'Add Collateral',
                }}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {isLendPositionType(positionType)
                            ? 'add collateral'
                            : `borrow ${fluidBorrowTokenDetails?.token?.symbol || ''}`}
                    </BodyText>

                    {isWalletConnected && isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal:{' '}
                            {isLoadingErc20TokensBalanceData ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(balance ?? 0),
                                            getMaxDecimalsToDisplay()
                                        )
                                    ),
                                    getMaxDecimalsToDisplay()
                                )
                            )}
                            <span className="inline-block truncate max-w-[70px]">
                                {isLendPositionType(positionType)
                                    ? selectedAssetTokenDetails?.token?.symbol
                                    : fluidBorrowTokenDetails?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                    {/* TODO: Borrow limit */}
                    {isWalletConnected && !isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit:{' '}
                            {isLoadingMaxBorrowingAmount ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                handleSmallestValue(
                                    maxBorrowAmount,
                                    getMaxDecimalsToDisplay()
                                )
                            )}
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div
                        className={cn(
                            isLendPositionType(positionType)
                                ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
                                : 'border-t rounded-t-5',
                            'border-gray-200 py-[12px] px-[16px] flex items-center gap-[12px]'
                        )}
                    >
                        {(isLoading) && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {/* Lend position type - Selected token image */}
                        {/* {(isLoading ||
                            !selectedAssetTokenDetails?.token?.address) &&
                            isLendPositionType(positionType) && (
                                <LoaderCircle className="text-primary w-[60px] h-[34px] animate-spin" />
                            )} */}
                        {!isLoading &&
                            !!selectedAssetTokenDetails?.token?.address &&
                            isLendPositionType(positionType) && (
                                <ImageWithDefault
                                    src={
                                        selectedAssetTokenDetails?.token
                                            ?.logo || ''
                                    }
                                    alt={
                                        selectedAssetTokenDetails?.token
                                            ?.symbol || ''
                                    }
                                    className="shrink-0 w-[24px] h-[24px] rounded-full"
                                    width={24}
                                    height={24}
                                />
                            )}
                        {/* Borrow position type - Select token dropdown */}
                        {!isLoading && !isLendPositionType(positionType) && (
                            <ImageWithDefault
                                src={
                                    fluidBorrowTokenDetails?.token?.logo || ''
                                }
                                alt={
                                    fluidBorrowTokenDetails?.token?.symbol ||
                                    ''
                                }
                                className="shrink-0 w-[24px] h-[24px] rounded-full"
                                width={24}
                                height={24}
                            />
                        )}
                        <div className="flex flex-1 flex-col gap-[4px]">
                            <CustomNumberInput
                                key={positionType}
                                amount={amount}
                                setAmount={(amount) => setAmount(amount)}
                            />
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium ml-auto"
                            onClick={() =>
                                setAmount(
                                    isLendPositionType(positionType)
                                        ? (balance ?? '0')
                                        : maxBorrowAmount
                                )
                            }
                            disabled={isDisabledMaxBtn()}
                        >
                            max
                        </Button>
                    </div>
                    {isWalletConnected && (
                        <div className="card-content-bottom px-5 py-3">
                            {isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="mx-auto w-full text-gray-500 text-center max-w-[250px]"
                                >
                                    {getLoadingHelperText()}
                                </BodyText>
                            )}
                            {!errorMessage && !isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="mx-auto w-full text-gray-500 text-center max-w-[250px]"
                                >
                                    {isLendPositionType(positionType) &&
                                        positionTypeParam === 'lend' && (
                                            <>
                                                Adding collateral to Morpho
                                                Markets does not yield.
                                            </>
                                        )}
                                    {isLendPositionType(positionType) &&
                                        positionTypeParam === 'borrow' &&
                                        'Enter amount to proceed with supplying collateral for this position'}
                                    {!isLendPositionType(positionType) &&
                                        doesMarketHasLiquidity &&
                                        'Enter the amount you want to borrow from this position'}
                                </BodyText>
                            )}
                            {!errorMessage &&
                                !isLoadingHelperText &&
                                !isLendPositionType(positionType) &&
                                !doesMarketHasLiquidity && (
                                    <CustomAlert
                                        variant="info"
                                        hasPrefixIcon={false}
                                        description={
                                            <BodyText
                                                level="body3"
                                                weight="normal"
                                                className="text-secondary-500 flex-inline"
                                            >
                                                {
                                                    <span className="flex-inline">
                                                        Superlend doesn&apos;t
                                                        support borrowing from
                                                        this market, as
                                                        there&apos;s not enough
                                                        liquidity. Try{' '}
                                                        <span className="mr-1">
                                                            using
                                                        </span>
                                                        <ExternalLink href="https://morpho.org">
                                                            morpho website
                                                        </ExternalLink>
                                                        <span className="ml-1">
                                                            for
                                                        </span>{' '}
                                                        the same
                                                    </span>
                                                }
                                            </BodyText>
                                        }
                                    />
                                )}
                            {errorMessage &&
                                !isLoadingHelperText &&
                                !isLoading && (
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-center text-destructive-foreground"
                                    >
                                        {errorMessage}
                                    </BodyText>
                                )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!isWalletConnected && <ConnectWalletButton />}
                    {isWalletConnected && !isLoading && (
                        <div className="flex flex-col gap-[12px] w-full">
                            <ConfirmationDialog
                                disabled={disabledButton}
                                open={isLendBorrowTxDialogOpen}
                                setOpen={setIsLendBorrowTxDialogOpen}
                                positionType={positionType}
                                assetDetails={{
                                    asset: selectedAssetTokenDetails,
                                    ...platformData?.platform,
                                }}
                                amount={amount}
                                balance={balance}
                                // TODO: Get max borrow amount
                                maxBorrowAmount={maxBorrowAmount}
                                setAmount={setAmount}
                                // TODO: Get health factor values
                                healthFactorValues={{
                                    healthFactor: healthFactor ?? 0,
                                    newHealthFactor: 0
                                }}
                                setActionType={setPositionType}
                            />
                        </div>
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}
