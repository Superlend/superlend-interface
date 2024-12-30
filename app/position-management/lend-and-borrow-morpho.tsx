'use client'

import LendBorrowToggle from '@/components/LendBorrowToggle'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyText } from '@/components/ui/typography'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    cn,
    getLowestDisplayValue,
} from '@/lib/utils'
import { TPositionType } from '@/types'
import { TPlatformAsset } from '@/types/platform'
import { LoaderCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConfirmationDialog, handleSmallestValue, SelectTokensDropdown } from './lend-and-borrow'
import ImageWithDefault from '@/components/ImageWithDefault'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import { Button } from '@/components/ui/button'
import { TOO_MANY_DECIMALS_VALIDATIONS_TEXT } from '@/constants'
import ConnectWalletButton from '@/components/ConnectWalletButton'

import { AccrualPosition, MarketId } from '@morpho-org/blue-sdk'
import { useMarket, usePosition } from '@morpho-org/blue-sdk-wagmi'
import { formatUnits } from 'viem'
import { BigNumber } from 'ethers'

export default function LendAndBorrowAssetsMorpho() {
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const positionTypeParam: TPositionType =
        (searchParams.get('position_type') as TPositionType) || 'lend'
    const { address: walletAddress } = useAccount()
    const { switchChainAsync } = useSwitchChain()
    const [amount, setAmount] = useState('')

    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [selectedAssetTokenDetails, setSelectedAssetTokenDetails] =
        useState<TPlatformAsset | null>(null)
    // let { fetchMorphoMarketData, providerStatus } = useMorphoMarketData()

    // let [morphoMarketData, setMorphoMarketData] = useState<any>(null)

    // Set position type, to select lend or borrow tab -
    // - when user navigates to this page with position type param
    useEffect(() => {
        setPositionType(positionTypeParam)
    }, [positionTypeParam])

    // Switch chain
    useEffect(() => {
        if (!!walletAddress) {
            switchChainAsync({ chainId: Number(chain_id) })
        }
    }, [walletAddress, Number(chain_id)])

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData,
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const { data: morphoMarketData } = useMarket({
        marketId: platformData?.platform?.morpho_market_id as MarketId,
    })

    const { data: position } = usePosition({
        marketId: platformData?.platform?.morpho_market_id as MarketId,
        user: walletAddress,
    })

    const [maxBorrowAmount, setMaxBorrowAmount] = useState('0')
    const [isLoadingMaxBorrowingAmount, setIsLoadingMaxBorrowingAmount] = useState(true)

    const [hasCollateral, setHasCollateral] = useState(false)
    const [canBorrow, setCanBorrow] = useState(false)

    const [doesMarketHasLiquidity, setDoesMarketHasLiquidity] = useState(true)

    // health factor
    const [healthFactor, setHealthFactor] = useState(0)
    const [newHealthFactor, setNewHealthFactor] = useState(0)

    useEffect(() => {

        if (position && morphoMarketData) {
            let accrualPosition: AccrualPosition = new AccrualPosition(position, morphoMarketData)
            let borrowAssets = ((accrualPosition.maxBorrowableAssets ?? BigInt(0)) * BigInt(999)) / BigInt(1000)
            let maxBorrowAmount = formatUnits(borrowAssets, morphoBorrowTokenDetails?.token?.decimals ?? 0)

            setMaxBorrowAmount(maxBorrowAmount)
            setIsLoadingMaxBorrowingAmount(false)
            setHasCollateral(accrualPosition.collateralValue ? accrualPosition.collateralValue > 0 : false)
            setCanBorrow(borrowAssets ? borrowAssets > 0 : false)

            // let collUsdValue = (accrualPosition.collateralValue ? Number(formatUnits(accrualPosition.collateralValue, 18)) : 0) * (selectedAssetTokenDetails?.token?.price_usd ?? 0)
            // let borrowUsdValue = (borrowAssets ? Number(formatUnits(borrowAssets, morphoBorrowTokenDetails?.token?.decimals ?? 0)) : 0) * (morphoBorrowTokenDetails?.token?.price_usd ?? 0)
            // let healthFactor = (collUsdValue / borrowUsdValue)

            // if both are same then reallocation is needed
            if (morphoMarketData.totalBorrowAssets === morphoMarketData.totalSupplyAssets) {
                setDoesMarketHasLiquidity(false)
            } else {
                setDoesMarketHasLiquidity(true)
            }

            // TODO: Get health factor values

        } else {
            setMaxBorrowAmount('0')
            setIsLoadingMaxBorrowingAmount(false)
            setHasCollateral(false)
            setCanBorrow(false)
            // setHealthFactor(0)
            // setNewHealthFactor(0)
        }
    }, [position, morphoMarketData, maxBorrowAmount, setMaxBorrowAmount, isLoadingMaxBorrowingAmount, setIsLoadingMaxBorrowingAmount, hasCollateral, setHasCollateral, canBorrow, setCanBorrow, doesMarketHasLiquidity, setDoesMarketHasLiquidity])

    const isLoading = isLoadingPlatformData || isLoadingMaxBorrowingAmount

    const isMorphoMarketsProtocol =
        platformData?.platform?.protocol_type === 'morpho' &&
        !platformData?.platform?.isVault



    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    const morphoLendTokenDetails = platformData?.assets.find(
        (asset) => asset.borrow_enabled === false
    )

    const morphoBorrowTokenDetails = platformData?.assets?.find(
        (asset) => asset.borrow_enabled === true
    )

    useEffect(() => {
        setSelectedAssetTokenDetails(morphoLendTokenDetails || null)
    }, [morphoLendTokenDetails, setSelectedAssetTokenDetails])

    const balance = (
        erc20TokensBalanceData[Number(chain_id)]?.[
            (selectedAssetTokenDetails?.token?.address ?? '').toLowerCase()
        ]?.balanceFormatted ?? 0
    ).toString()



    // useEffect(() => {
    //     setSelectedAssetTokenDetails(morphoLendTokenDetails)
    // }, [morphoLendTokenDetails])

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
                    : (morphoBorrowTokenDetails?.token?.decimals ?? 0)
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
        return isLendPositionType(positionType)
            ? lendErrorMessage
            : borrowErrorMessage
    }, [positionType, lendErrorMessage, borrowErrorMessage])

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
            toManyDecimals || (!isLendPositionType(positionType) && !doesMarketHasLiquidity),
        [
            amount,
            balance,
            maxBorrowAmount,
            toManyDecimals,
            hasCollateral,
            positionType,
            doesMarketHasLiquidity
        ]
    )



    if (!isMorphoMarketsProtocol || searchParams.get('position_type') === 'lend') {
        return null
    }



    function getMaxDecimalsToDisplay(): number {
        return isLendPositionType(positionType)
            ? morphoLendTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                morphoLendTokenDetails?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 6
                : 2
            : morphoBorrowTokenDetails?.token?.symbol
                .toLowerCase()
                .includes('btc') ||
                morphoBorrowTokenDetails?.token?.symbol
                    .toLowerCase()
                    .includes('eth')
                ? 6
                : 2
    }

    const isDisabledMaxBtn = () => {
        if (isLendPositionType(positionType)) {
            return (
                Number(amount) === Number(balance) ||
                !walletAddress ||
                isLoadingErc20TokensBalanceData ||
                Number(balance) <= 0
            )
        }

        // TODO: Get max borrow amount
        return (Number(amount) === Number(maxBorrowAmount)) ||
            !walletAddress ||
            isLoadingMaxBorrowingAmount ||
            isLoadingErc20TokensBalanceData ||
            (Number(maxBorrowAmount) <= 0) ||
            !doesMarketHasLiquidity
    }

    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <LendBorrowToggle
                type={positionType}
                handleToggle={(positionType: TPositionType) => {
                    setAmount('')
                    setPositionType(positionType)
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
                            : `borrow ${morphoBorrowTokenDetails?.token?.symbol || ''}`}
                    </BodyText>

                    {walletAddress && isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
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
                                    : morphoBorrowTokenDetails?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                    {/* TODO: Borrow limit */}
                    {walletAddress && !isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit:{' '}
                            {isLoadingMaxBorrowingAmount ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                handleSmallestValue(maxBorrowAmount, getMaxDecimalsToDisplay())
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
                        {(isLoading || isLoadingMaxBorrowingAmount) && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {/* Lend position type - Selected token image */}
                        {/* {(isLoading ||
                            !selectedAssetTokenDetails?.token?.address) &&
                            isLendPositionType(positionType) && (
                                <LoaderCircle className="text-primary w-[60px] h-[34px] animate-spin" />
                            )} */}
                        {(!isLoading && !isLoadingMaxBorrowingAmount) &&
                            !!selectedAssetTokenDetails?.token?.address &&
                            isLendPositionType(positionType) && (
                                <ImageWithDefault
                                    src={
                                        selectedAssetTokenDetails?.token?.logo || ''
                                    }
                                    alt={
                                        selectedAssetTokenDetails?.token?.symbol ||
                                        ''
                                    }
                                    className="shrink-0 w-[24px] h-[24px] rounded-full"
                                    width={24}
                                    height={24}
                                />
                                // <SelectTokensDropdown
                                //     key={positionType}
                                //     options={morphoLendTokenDetails}
                                //     selectedItemDetails={
                                //         selectedAssetTokenDetails
                                //     }
                                //     setSelectedItemDetails={
                                //         setSelectedAssetTokenDetails
                                //     }
                                // />
                            )}
                        {/* {isLendPositionType(positionType) && (
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>
                        )} */}
                        {/* Borrow position type - Select token dropdown */}
                        {!isLoading && !isLendPositionType(positionType) && (
                            <ImageWithDefault
                                src={
                                    morphoBorrowTokenDetails?.token?.logo || ''
                                }
                                alt={
                                    morphoBorrowTokenDetails?.token?.symbol ||
                                    ''
                                }
                                className="shrink-0 w-[24px] h-[24px] rounded-full"
                                width={24}
                                height={24}
                            />
                        )}
                        <div className="flex flex-col gap-[4px]">
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
                    {/* TODO: Net APY - ONLY FOR BORROW TAB */}
                    {/* {(!isLendPositionType(positionType) && walletAddress) &&
                        <div className="flex items-center justify-between w-full py-[12px] px-[24px] rounded-b-5 bg-white border-y border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Net APY
                            </BodyText>
                            {isLoadingMaxBorrowingAmount && <Skeleton className="w-[50px] h-[20px]" />}
                            {!isLoadingMaxBorrowingAmount && <Badge variant="green">
                                {abbreviateNumber(
                                    isLendPositionType(positionType)
                                        ? Number(
                                            assetDetails?.asset?.apy ?? 0
                                        )
                                        : Number(
                                            selectedBorrowTokenDetails?.variable_borrow_apy ?? 0
                                        )
                                )}
                                %
                            </Badge>}
                        </div>} */}
                    {walletAddress && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="mx-auto w-full text-gray-500 py-[16px] text-center max-w-[250px]"
                        >
                            {isLoadingHelperText && getLoadingHelperText()}
                            {!errorMessage &&
                                !isLoadingHelperText &&
                                (isLendPositionType(positionType)
                                    ? 'Enter amount to proceed with supplying collateral for this position'
                                    :
                                    doesMarketHasLiquidity
                                        ? 'Enter the amount you want to borrow from this position'
                                        : 'Market does not have enough liquidity to borrow from this position'
                                )}
                            {errorMessage && !isLoadingHelperText && (
                                <span className="text-xs text-destructive-foreground">
                                    {errorMessage}
                                </span>
                            )}
                        </BodyText>
                    )}
                    {/* {
                        isLendPositionType(positionType) && !selectedAssetTokenDetails?.borrow_enabled && (
                            // Text which says that this supplying collateral does not yield any rewards
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-500"
                            >
                                This supplying collateral does not yield any rewards
                            </BodyText>
                        )
                    } */}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!walletAddress && <ConnectWalletButton />}
                    {walletAddress && (
                        <div className="flex flex-col gap-[12px] w-full">
                            <ConfirmationDialog
                                disabled={disabledButton}
                                positionType={positionType}
                                assetDetails={{
                                    asset: isLendPositionType(positionType)
                                        ? selectedAssetTokenDetails
                                        : morphoBorrowTokenDetails,
                                    platform: platformData?.platform,
                                    protocol_type:
                                        platformData?.platform?.protocol_type,
                                    morphoMarketData: morphoMarketData,
                                    chainId: Number(chain_id)
                                }}
                                amount={amount}
                                balance={balance}
                                // TODO: Get max borrow amount
                                maxBorrowAmount={maxBorrowAmount}
                                setAmount={setAmount}
                                // TODO: Get health factor values
                                healthFactorValues={{
                                    healthFactor: 0.0,
                                    newHealthFactor: 0.0,
                                }}
                            />
                        </div>
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}
