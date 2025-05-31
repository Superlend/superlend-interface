import {
    ReservesDataHumanized,
    UiPoolDataProvider,
    UserReserveDataHumanized,
} from '@aave/contract-helpers'
import {
    ReservesDataHumanized as ReservesDataHumanizedLegacy,
    UserReserveDataHumanized as UserReserveDataHumanizedLegacy,
    UiPoolDataProvider as UiPoolDataProviderLegacy,
    ReserveDataHumanized,
} from 'aave-contract-helpers-legacy'
import { useEthersMulticall } from '../useEthereumMulticall'
import { useState, useEffect } from 'react'
import { formatReserves, formatUserSummary } from '@aave/math-utils'
import {
    calculateHealthFactorFromBalancesBigUnits,
    formatReserves as formatReservesLegacy,
    formatUserSummary as formatUserSummaryLegacy,
    valueToBigNumber,
} from 'aave-math-util-legacy'
import { formatUnits, getAddress, parseUnits } from 'ethers/lib/utils'
import { getMaxAmountAvailableToBorrow } from '../../lib/getMaxAmountAvailableToBorrow'
import { hasExponent, IsAaveV3Legacy } from '@/lib/utils'
import { erc20Abi } from 'viem'
import { Contract } from 'ethers'
import { BigNumber } from 'ethers'
import { useAccount } from 'wagmi'
import { useUserTokenBalancesContext } from '../../context/user-token-balances-provider'
import { etherlink } from 'viem/chains'
import { useAaveV3DataContext, type ChainConfig } from '../../context/aave-v3-data-provider'

export const useAaveV3Data = () => {
    const { address: walletAddress } = useAccount()
    const { providers } = useEthersMulticall()
    
    // Use the context instead of local state
    const {
        getReservesData,
        getUserData,
        getAaveData,
        fetchData,
        fetchReservesData,
        fetchUserData,
        isLoading,
        hasError,
        refreshData,
        providerStatus,
    } = useAaveV3DataContext()

    const [maxLeverage, setMaxLeverage] = useState<Record<
        string,
        Record<string, number>
    > | null>(null)
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
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        // isRefreshing: isRefreshingErc20TokensBalanceData,
        setIsRefreshing: setIsRefreshingErc20TokensBalanceData,
    } = useUserTokenBalancesContext()

    // Deprecated: Remove these functions in favor of context methods
    const fetchReservesDataLegacy = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
        console.warn('fetchReservesData is deprecated. Use context.fetchReservesData instead.')
        return fetchReservesData({
            chainId,
            uiPoolDataProviderAddress,
            lendingPoolAddressProvider,
        })
    }

    const fetchUserDataLegacy = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string,
        _walletAddress?: string
    ) => {
        console.warn('fetchUserData is deprecated. Use context.fetchUserData instead.')
        return fetchUserData({
            chainId,
            uiPoolDataProviderAddress,
            lendingPoolAddressProvider,
        }, false, _walletAddress)
    }

    const fetchAaveV3Data = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
        return fetchData({
            chainId,
            uiPoolDataProviderAddress,
            lendingPoolAddressProvider,
        })
    }

    const getAllowance = async (
        chainId: number,
        spender: string,
        token: string
    ) => {
        if (!providers[chainId]) {
            console.log('Providers not ready or chain not supported')
            return BigNumber.from(0)
        }

        try {
            const contract = new Contract(token, erc20Abi, providers[chainId])
            const approval = await contract.allowance(walletAddress, spender)
            return approval
        } catch (error) {
            console.error('Error getting allowance:', error)
            return BigNumber.from(0)
        }
    }

    const getMaxWithdrawAmount = (
        token: string,
        chainId: number,
        allData?: [
            ReservesDataHumanized | ReservesDataHumanizedLegacy,
            (
                | {
                      userReserves: UserReserveDataHumanized[]
                      userEmodeCategoryId: number
                  }
                | {
                      userReserves: UserReserveDataHumanizedLegacy[]
                      userEmodeCategoryId: number
                  }
            ),
        ]
    ) => {
        const isLegacyInstance = IsAaveV3Legacy(chainId)
        
        // Use provided data or get from context
        const _reserveData = allData ? allData[0] : getReservesData(chainId)
        const _userData = allData ? allData[1] : getUserData(chainId)
        
        if (!_reserveData || !_userData) return
        const reserve = _reserveData.reservesData.find(
            (r) => r.underlyingAsset.toLowerCase() === token.toLowerCase()
        )
        const baseCurrencyData = _reserveData.baseCurrencyData
        const userReserve = _userData.userReserves.find(
            (r) => r.underlyingAsset === token.toLowerCase()
        )
        if (!reserve || !userReserve) return
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const formattedPoolReserves = isLegacyInstance
            ? formatReservesLegacy({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))
            : formatReserves({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))

        const user = isLegacyInstance
            ? formatUserSummaryLegacy({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves:
                      _userData.userReserves as UserReserveDataHumanizedLegacy[],
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })
            : formatUserSummary({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves: _userData.userReserves,
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })

        const _userReserve = user.userReservesData.filter(
            (f) => f.underlyingAsset.toLowerCase() === token.toLowerCase()
        )[0]
        const poolReserve: any = formattedPoolReserves.filter(
            (pr) => pr.underlyingAsset.toLowerCase() === token.toLowerCase()
        )[0]

        const underlyingBalance = BigNumber.from(
            parseUnits(
                _userReserve?.underlyingBalance || '0',
                _userReserve?.reserve?.decimals
            ) || '0'
        )
        const unborrowedLiquidity = BigNumber.from(
            parseUnits(
                poolReserve.unborrowedLiquidity || '0',
                poolReserve.decimals
            )
        )
        let maxAmountToWithdraw = underlyingBalance.lte(unborrowedLiquidity)
            ? underlyingBalance
            : unborrowedLiquidity

        if (
            _userReserve?.usageAsCollateralEnabledOnUser &&
            poolReserve.reserveLiquidationThreshold !== '0' &&
            user.totalBorrowsMarketReferenceCurrency !== '0'
        ) {
            const reserveLiquidationThreshold =
                'userEmodeCategoryId' in user &&
                user.userEmodeCategoryId === poolReserve.eModeCategoryId
                    ? String(poolReserve.eModeLiquidationThreshold / 10000)
                    : poolReserve.formattedReserveLiquidationThreshold

            const excessHF = BigNumber.from(
                parseUnits(user.healthFactor || '0', 20)
            ).sub(BigNumber.from(parseUnits('1.01', 20)))

            let maxCollateralToWithdrawInETH = BigNumber.from('0')
            if (excessHF.gt('0')) {
                maxCollateralToWithdrawInETH = excessHF
                    .mul(
                        parseUnits(
                            Number(
                                user.totalBorrowsMarketReferenceCurrency
                            ).toFixed(
                                baseCurrencyData.marketReferenceCurrencyDecimals
                            ) || '0',
                            baseCurrencyData.marketReferenceCurrencyDecimals
                        )
                    )
                    .div(
                        parseUnits(
                            reserveLiquidationThreshold === '0'
                                ? '1'
                                : reserveLiquidationThreshold,
                            4
                        )
                    )
            }

            const newMaxToWithdraw = BigNumber.from(
                parseUnits(
                    Number(
                        formatUnits(
                            maxCollateralToWithdrawInETH.div(
                                parseUnits(
                                    Number(
                                        poolReserve.formattedPriceInMarketReferenceCurrency
                                    ).toFixed(poolReserve.decimals),
                                    poolReserve.decimals
                                )
                            ),
                            20 +
                                baseCurrencyData?.marketReferenceCurrencyDecimals -
                                4 -
                                poolReserve.decimals // => 20 + marketReferenceCurrencyDecimals - 4 - reserve.decimals
                        )
                    )
                        .toFixed(poolReserve.decimals)
                        .toString(),
                    poolReserve.decimals
                )
            )
            maxAmountToWithdraw = maxAmountToWithdraw.gt(newMaxToWithdraw)
                ? newMaxToWithdraw
                : maxAmountToWithdraw
        }
        return {
            maxToWithdraw: maxAmountToWithdraw.toString() || '0',
            maxToWithdrawFormatted:
                formatUnits(
                    maxAmountToWithdraw.toString(),
                    poolReserve.decimals
                ) || '0',
            user,
        }
    }

    const getMaxBorrowAmount = (
        token: string,
        chainId: number,
        allData?: [
            ReservesDataHumanized | ReservesDataHumanizedLegacy,
            (
                | {
                      userReserves: UserReserveDataHumanized[]
                      userEmodeCategoryId: number
                  }
                | {
                      userReserves: UserReserveDataHumanizedLegacy[]
                      userEmodeCategoryId: number
                  }
            ),
        ]
    ) => {
        const isLegacyInstance = IsAaveV3Legacy(chainId)
        const _reserveData = allData ? allData[0] : getReservesData(chainId)
        const _userData = allData ? allData[1] : getUserData(chainId)
        if (!_reserveData || !_userData) return
        const reserve = _reserveData.reservesData.find(
            (r) => r.underlyingAsset.toLowerCase() === token.toLowerCase()
        )
        const baseCurrencyData = _reserveData.baseCurrencyData
        const userReserve = _userData.userReserves.find(
            (r) => r.underlyingAsset === token.toLowerCase()
        )
        if (!reserve || !userReserve) return

        const currentTimestamp = Math.floor(Date.now() / 1000)

        const formattedPoolReserves = isLegacyInstance
            ? formatReservesLegacy({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))
            : formatReserves({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))

        const user = isLegacyInstance
            ? formatUserSummaryLegacy({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves:
                      _userData.userReserves as UserReserveDataHumanizedLegacy[],
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })
            : formatUserSummary({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves: _userData.userReserves,
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })

        const maxToBorrow = getMaxAmountAvailableToBorrow(
            formattedPoolReserves.find(
                (p) => p.underlyingAsset.toLowerCase() === token
            ),
            user
        )

        // Check if the maxToBorrow.amountFormatted has an exponent, and return the formatted value
        const maxAmountToBorrowFormatted = hasExponent(
            maxToBorrow.amountFormatted.toString()
        )
            ? maxToBorrow.amountFormatted.toFixed(10)
            : maxToBorrow.amountFormatted.toString()

        // console.log(
        //   'max to borrow ',
        //   maxToBorrow.amount.toString(),
        //   maxAmountToBorrowFormatted,
        // );

        return {
            maxToBorrow: maxToBorrow.amount.toString() || '0',
            maxToBorrowFormatted: maxAmountToBorrowFormatted || '0',
            user,
        }
    }

    const getMaxRepayAmount = (
        token: string,
        chainId: number,
        allData?: [
            ReservesDataHumanized | ReservesDataHumanizedLegacy,
            (
                | {
                      userReserves: UserReserveDataHumanized[]
                      userEmodeCategoryId: number
                  }
                | {
                      userReserves: UserReserveDataHumanizedLegacy[]
                      userEmodeCategoryId: number
                  }
            ),
        ]
    ) => {
        const isLegacyInstance = IsAaveV3Legacy(chainId)
        const _reserveData = allData ? allData[0] : getReservesData(chainId)
        const _userData = allData ? allData[1] : getUserData(chainId)
        if (!_reserveData || !_userData) return
        const reserve = _reserveData.reservesData.find(
            (r) => r.underlyingAsset.toLowerCase() === token.toLowerCase()
        )
        const baseCurrencyData = _reserveData.baseCurrencyData
        const userReserve = _userData.userReserves.find(
            (r) => r.underlyingAsset === token.toLowerCase()
        )
        if (!reserve || !userReserve) return

        const currentTimestamp = Math.floor(Date.now() / 1000)

        const formattedPoolReserves = isLegacyInstance
            ? formatReservesLegacy({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))
            : formatReserves({
                  reserves: _reserveData.reservesData as any,
                  currentTimestamp,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              }).map((r) => ({
                  ...r,
                  isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                  isWrappedBaseAsset: false,
              }))

        const user = isLegacyInstance
            ? formatUserSummaryLegacy({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves:
                      _userData.userReserves as UserReserveDataHumanizedLegacy[],
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })
            : formatUserSummary({
                  currentTimestamp: currentTimestamp,
                  marketReferencePriceInUsd:
                      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                  marketReferenceCurrencyDecimals:
                      baseCurrencyData.marketReferenceCurrencyDecimals,
                  userReserves: _userData.userReserves,
                  formattedReserves: formattedPoolReserves as any,
                  userEmodeCategoryId: _userData.userEmodeCategoryId,
              })

        const userToken = erc20TokensBalanceData[chainId]
            ? erc20TokensBalanceData[chainId][token.toLowerCase()]
            : undefined

        const debtReserve = user.userReservesData.find(
            (r) =>
                r.reserve.underlyingAsset.toLowerCase() === token.toLowerCase()
        )
        const debtAmount = parseUnits(
            debtReserve!.totalBorrows,
            debtReserve?.reserve.decimals
        )

        const maxRepayAmount = debtAmount.lte(
            BigNumber.from(userToken?.balanceRaw ?? '0')
        )
            ? debtAmount
            : BigNumber.from(userToken?.balanceRaw ?? '0')

        const maxRepayAmountFormatted = formatUnits(
            maxRepayAmount,
            debtReserve!.reserve.decimals
        )

        return {
            maxToRepay: maxRepayAmount.toString(),
            maxToRepayFormatted: maxRepayAmountFormatted,
            user,
        }
    }

    const getMaxLeverage = async ({
        chainId,
        uiPoolDataProviderAddress,
        lendingPoolAddressProvider,
    }: {
        chainId: number
        uiPoolDataProviderAddress: string
        lendingPoolAddressProvider: string
    }) => {
        if (chainId !== etherlink.id) return

        // TODO: Add error handling for this
        const reservesResult = (await fetchReservesData({
            chainId,
            uiPoolDataProviderAddress,
            lendingPoolAddressProvider,
        })) as ReservesDataHumanizedLegacy
        const reserves = reservesResult?.reservesData

        const reservesMap: Record<string, ReserveDataHumanized> = {}
        reserves.forEach(
            (r) => (reservesMap[r.underlyingAsset.toLowerCase()] = r)
        )

        // Shreyas: Object: LendTokenAddress -> BorrowTokenAddress -> MaxLeverage
        const results: Record<string, Record<string, number>> = {}

        for (const reserve of reserves) {
            results[reserve.underlyingAsset.toLowerCase()] = {}
            for (const _reserve of reserves) {
                if (!_reserve.borrowingEnabled) continue
                const ltv = Number(reserve.baseLTVasCollateral) / 10000
                const maxLeverage = 1 / (1 - ltv)
                results[reserve.underlyingAsset.toLowerCase()][
                    _reserve.underlyingAsset.toLowerCase()
                ] = maxLeverage
            }
        }

        return results
    }

    const getBorrowTokenAmountForLeverage = async ({
        chainId,
        uiPoolDataProviderAddress,
        lendingPoolAddressProvider,
        supplyToken,
        supplyTokenAmount,
        leverage,
        borrowToken,
        _walletAddress,
    }: {
        chainId: number
        uiPoolDataProviderAddress: string
        lendingPoolAddressProvider: string
        supplyToken: string // address
        supplyTokenAmount: string // amount in bignumber ie. with full precision. Eg. 1 ETH = 10^18
        leverage: number // leverage in number
        borrowToken: string // address
        _walletAddress?: string
    }) => {
        try {
            if (chainId !== etherlink.id)
                return {
                    amount: '0',
                    amountFormatted: '0',
                    healthFactor: '0',
                } // TODO: handle this gracefully
            const reservesData = (await fetchReservesData({
                chainId,
                uiPoolDataProviderAddress,
                lendingPoolAddressProvider,
            })) as ReservesDataHumanizedLegacy

            const additionalSupplyTokenAmount = BigNumber.from(
                supplyTokenAmount
            )
                .mul(BigNumber.from(leverage * 100).sub(BigNumber.from(100)))
                .div(100)
            const flashLoanPremium = 50 // => 0.05 // TODO: get this from the protocol
            const additionalSupplyTokenAmountToRepay =
                additionalSupplyTokenAmount.add(
                    additionalSupplyTokenAmount.mul(flashLoanPremium).div(10000)
                )

            const supplyTokenReserve = reservesData.reservesData.find(
                (r) =>
                    r.underlyingAsset.toLowerCase() ===
                    supplyToken.toLowerCase()
            )
            const borrowTokenReserve = reservesData.reservesData.find(
                (r) =>
                    r.underlyingAsset.toLowerCase() ===
                    borrowToken.toLowerCase()
            )

            // conver this supply token to USD using USD price of the token from reserveData
            const supplyTokenAmountInUSD = BigNumber.from(
                Number(
                    formatUnits(
                        additionalSupplyTokenAmountToRepay.mul(
                            supplyTokenReserve?.priceInMarketReferenceCurrency.toString() ??
                                '0'
                        ),
                        supplyTokenReserve?.decimals ?? 0
                    )
                )
                    .toFixed(0)
                    .toString()
            )

            // Conver this USD value to Borrow token amount + 0.05% buffer, return the borrow amount
            const borrowTokenAmount = supplyTokenAmountInUSD
                .mul(BigNumber.from(10).pow(borrowTokenReserve?.decimals ?? 0))
                .div(
                    BigNumber.from(
                        borrowTokenReserve?.priceInMarketReferenceCurrency.toString() ??
                            '1'
                    )
                )

            const borrowTokenAmountFormatted = formatUnits(
                borrowTokenAmount,
                borrowTokenReserve?.decimals ?? 0
            )

            // --------- Calculate health factor ---------

            const currentTimestamp = Math.floor(Date.now() / 1000)
            const _userData = (await fetchUserData({
                chainId,
                uiPoolDataProviderAddress,
                lendingPoolAddressProvider,
            }, false, _walletAddress)) as any
            const formattedPoolReserves = formatReservesLegacy({
                reserves: reservesData.reservesData as any,
                currentTimestamp,
                marketReferenceCurrencyDecimals:
                    reservesData.baseCurrencyData
                        .marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd:
                    reservesData.baseCurrencyData
                        .marketReferenceCurrencyPriceInUsd,
            }).map((r) => ({
                ...r,
                isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
                isWrappedBaseAsset: false,
            }))

            const baseCurrencyData = reservesData.baseCurrencyData
            const user = formatUserSummaryLegacy({
                currentTimestamp: currentTimestamp,
                marketReferencePriceInUsd:
                    baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                marketReferenceCurrencyDecimals:
                    baseCurrencyData.marketReferenceCurrencyDecimals,
                userReserves:
                    _userData.userReserves as UserReserveDataHumanizedLegacy[],
                formattedReserves: formattedPoolReserves as any,
                userEmodeCategoryId: _userData.userEmodeCategoryId,
            })

            const supplyUsdAmount = formatUnits(
                additionalSupplyTokenAmount
                    .add(BigNumber.from(supplyTokenAmount))
                    .mul(
                        BigNumber.from(
                            supplyTokenReserve?.priceInMarketReferenceCurrency.toString() ??
                                '0'
                        )
                    ),
                (supplyTokenReserve?.decimals ?? 0) + 8
            )

            const healthFactor = calculateHealthFactorFromBalancesBigUnits({
                collateralBalanceMarketReferenceCurrency: valueToBigNumber(
                    user.totalCollateralUSD
                ).plus(valueToBigNumber(supplyUsdAmount)),
                borrowBalanceMarketReferenceCurrency: valueToBigNumber(
                    user.totalBorrowsUSD
                ).plus(
                    valueToBigNumber(
                        Number(
                            formatUnits(supplyTokenAmountInUSD.toString(), 8)
                        )
                    )
                ),
                currentLiquidationThreshold:
                    user.currentLiquidationThreshold ?? 0,
            })

            return {
                amount: borrowTokenAmount.toString(),
                amountFormatted: borrowTokenAmountFormatted,
                flashLoanAmount: additionalSupplyTokenAmount.toString(),
                flashLoanAmountFormatted: formatUnits(
                    additionalSupplyTokenAmount,
                    supplyTokenReserve?.decimals ?? 0
                ),
                healthFactor: healthFactor.toString(),
            }
        } catch (error) {
            console.error('Error in getBorrowTokenAmountForLeverage', error)
            return {
                amount: '0',
                amountFormatted: '0',
                healthFactor: '0',
            }
        }
    }

    return {
        // Context methods - recommended to use these
        getReservesData,
        getUserData,
        getAaveData,
        fetchData,
        fetchReservesData,
        fetchUserData,
        isLoading,
        hasError,
        refreshData,
        
        // Backwards compatibility - deprecated methods
        fetchAaveV3Data,
        
        // Utility methods
        getAllowance,
        getMaxBorrowAmount,
        getMaxWithdrawAmount,
        getMaxRepayAmount,
        getMaxLeverage,
        getBorrowTokenAmountForLeverage,
        
        // Legacy state values for backwards compatibility
        reserveData: undefined, // deprecated - use getReservesData(chainId) instead
        userData: undefined, // deprecated - use getUserData(chainId) instead
        providerStatus, // now returns real provider status from context
        maxLeverage,
        borrowTokenAmountForLeverage,
    }
}
