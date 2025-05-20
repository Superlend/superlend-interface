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

export const useAaveV3Data = () => {
    const { address: walletAddress } = useAccount()
    const { providers } = useEthersMulticall()
    const [providerStatus, setProviderStatus] = useState({
        isReady: false,
        isInitializing: true,
        error: null as string | null,
    })
    const [reserveData, setReserveData] = useState<
        void | ReservesDataHumanized | ReservesDataHumanizedLegacy
    >()
    const [userData, setUserData] = useState<
        | void
        | {
              userReserves: UserReserveDataHumanized[]
              userEmodeCategoryId: number
          }
        | {
              userReserves: UserReserveDataHumanizedLegacy[]
              userEmodeCategoryId: number
          }
    >()
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

    // Enhanced provider readiness check
    useEffect(() => {
        const initializeProviders = async () => {
            setProviderStatus((prev) => ({ ...prev, isInitializing: true }))

            if (!providers || Object.keys(providers).length === 0) {
                setProviderStatus({
                    isReady: false,
                    isInitializing: false,
                    error: 'No providers available',
                })
                return
            }

            try {
                // Test provider functionality
                const chainIds = Object.keys(providers)
                const providerTests = await Promise.all(
                    chainIds.map(async (chainId) => {
                        const provider = providers[Number(chainId)]
                        if (!provider) return false

                        try {
                            // Try to get the network - a basic operation that should always work
                            await provider.getNetwork()
                            return true
                        } catch {
                            return false
                        }
                    })
                )

                const hasWorkingProvider = providerTests.some(
                    (result) => result
                )

                setProviderStatus({
                    isReady: hasWorkingProvider,
                    isInitializing: false,
                    error: hasWorkingProvider
                        ? null
                        : 'No working providers found',
                })
            } catch (error) {
                setProviderStatus({
                    isReady: false,
                    isInitializing: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error initializing providers',
                })
            }
        }

        initializeProviders()
    }, [providers])

    // useEffect(() => {
    //     if (providerStatus.isReady) {
    //         getMaxLeverage(
    //             42793,
    //             '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
    //             '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec'
    //         ).then((results) => {
    //             setMaxLeverage(results as any)
    //         })

    //         getBorrowTokenAmountForLeverage(
    //             42793,
    //             '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
    //             '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec',
    //             '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb', // WXTZ
    //             BigNumber.from('1').mul(BigNumber.from(10).pow(18)).toString(),
    //             2.1,
    //             '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC
    //             '0x0e9852b16ae49c99b84b0241e3c6f4a5692c6b05' // some random wallet address with money
    //         ).then((result) => {
    //             setBorrowTokenAmountForLeverage(result)
    //         })
    //     }
    // }, [providerStatus.isReady])

    const fetchReservesData = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
        if (!providerStatus.isReady || !providers || !providers[chainId]) {
            console.log('Provider not ready for fetchReservesData', {
                isProvidersReady: providerStatus.isReady,
                hasProviders: !!providers,
                chainSupported: providers?.[chainId] ? 'yes' : 'no',
            })
            return Promise.resolve()
        }

        if (
            !walletAddress ||
            !uiPoolDataProviderAddress ||
            !lendingPoolAddressProvider
        ) {
            console.log('Missing required parameters for fetchReservesData', {
                walletAddress,
                uiPoolDataProviderAddress,
                lendingPoolAddressProvider,
            })
            return Promise.resolve()
        }

        try {
            const isLegacyInstance = IsAaveV3Legacy(chainId)
            const uiPoolDataProviderInstance = isLegacyInstance
                ? new UiPoolDataProviderLegacy({
                      uiPoolDataProviderAddress: getAddress(
                          uiPoolDataProviderAddress
                      ),
                      provider: providers[chainId],
                      chainId: chainId,
                  })
                : new UiPoolDataProvider({
                      uiPoolDataProviderAddress: getAddress(
                          uiPoolDataProviderAddress
                      ),
                      provider: providers[chainId],
                      chainId: chainId,
                  })

            const result =
                await uiPoolDataProviderInstance.getReservesHumanized({
                    lendingPoolAddressProvider: getAddress(
                        lendingPoolAddressProvider
                    ),
                })
            setReserveData(result)
            return result
        } catch (error) {
            console.error('Error in fetchReservesData:', error)
            return Promise.resolve()
        }
    }

    const fetchUserData = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string,
        _walletAddress?: string
    ) => {
        if (!providerStatus.isReady || !providers || !providers[chainId]) {
            console.log('Provider not ready for fetchUserData', {
                isProvidersReady: providerStatus.isReady,
                hasProviders: !!providers,
                chainSupported: providers?.[chainId] ? 'yes' : 'no',
            })
            return Promise.resolve()
        }

        if (
            !walletAddress ||
            !uiPoolDataProviderAddress ||
            !lendingPoolAddressProvider
        ) {
            console.log('Missing required parameters for fetchUserData')
            return Promise.resolve()
        }

        try {
            const isLegacyInstance = IsAaveV3Legacy(chainId)

            const uiPoolDataProviderInstance = isLegacyInstance
                ? new UiPoolDataProviderLegacy({
                      uiPoolDataProviderAddress: getAddress(
                          uiPoolDataProviderAddress
                      ),
                      provider: providers[chainId],
                      chainId: chainId,
                  })
                : new UiPoolDataProvider({
                      uiPoolDataProviderAddress: getAddress(
                          uiPoolDataProviderAddress
                      ),
                      provider: providers[chainId],
                      chainId: chainId,
                  })

            const result =
                await uiPoolDataProviderInstance.getUserReservesHumanized({
                    lendingPoolAddressProvider: getAddress(
                        lendingPoolAddressProvider
                    ),
                    user: getAddress(_walletAddress || walletAddress),
                })
            setUserData(result)
            return result
        } catch (error) {
            console.error('Error in fetchUserData:', error)
            return Promise.resolve()
        }
    }

    const getAllowance = async (
        chainId: number,
        spender: string,
        token: string
    ) => {
        if (!providerStatus.isReady || !providers[chainId]) {
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

    const fetchAaveV3Data = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
        if (!providerStatus.isReady) {
            console.log('Providers not ready for fetchAaveV3Data')
            return Promise.resolve([undefined, undefined])
        }

        try {
            const result = await Promise.all([
                fetchReservesData(
                    chainId,
                    uiPoolDataProviderAddress,
                    lendingPoolAddressProvider
                ),
                fetchUserData(
                    chainId,
                    uiPoolDataProviderAddress,
                    lendingPoolAddressProvider
                ),
            ])
            return result
        } catch (error) {
            console.error('Error in fetchAaveV3Data:', error)
            return [undefined, undefined]
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
        const _reserveData = allData ? allData[0] : reserveData
        const _userData = allData ? allData[1] : userData
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
        const _reserveData = allData ? allData[0] : reserveData
        const _userData = allData ? allData[1] : userData
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
        const _reserveData = allData ? allData[0] : reserveData
        const _userData = allData ? allData[1] : userData
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
        const reservesResult = (await fetchReservesData(
            chainId,
            uiPoolDataProviderAddress,
            lendingPoolAddressProvider
        )) as ReservesDataHumanizedLegacy
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
        _walletAddress
    } : {
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string,
        supplyToken: string, // address
        supplyTokenAmount: string, // amount in bignumber ie. with full precision. Eg. 1 ETH = 10^18
        leverage: number, // leverage in number
        borrowToken: string, // address
        _walletAddress?: string
    }) => {
        try {
            if (chainId !== etherlink.id)
                return {
                    amount: '0',
                    amountFormatted: '0',
                    healthFactor: '0',
                } // TODO: handle this gracefully
            const reservesData = (await fetchReservesData(
                chainId,
                uiPoolDataProviderAddress,
                lendingPoolAddressProvider
            )) as ReservesDataHumanizedLegacy

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
            const _userData = (await fetchUserData(
                chainId,
                uiPoolDataProviderAddress,
                lendingPoolAddressProvider,
                _walletAddress || walletAddress
            )) as any
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
        reserveData,
        userData,
        getAllowance,
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getMaxWithdrawAmount,
        getMaxRepayAmount,
        providerStatus,
        getMaxLeverage,
        maxLeverage,
        getBorrowTokenAmountForLeverage,
        borrowTokenAmountForLeverage,
    }
}
