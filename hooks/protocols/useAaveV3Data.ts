// import { useActiveAccount } from 'thirdweb/react'
import {
    ReservesDataHumanized,
    UiPoolDataProvider,
    UserReserveDataHumanized,
} from '@aave/contract-helpers'
import { useEthersMulticall } from '../useEthereumMulticall'
import { useState, useEffect } from 'react'
import { formatReserves, formatUserSummary } from '@aave/math-utils'
import { formatUnits, getAddress, parseUnits } from 'ethers/lib/utils'
import { getMaxAmountAvailableToBorrow } from '../../lib/getMaxAmountAvailableToBorrow'
import { hasExponent } from '@/lib/utils'
import { erc20Abi } from 'viem'
import { Contract } from 'ethers'
import { BigNumber } from 'ethers'
import { useAccount } from 'wagmi'
import { useERC20Balance } from '../useERC20Balance'
import { useUserTokenBalancesContext } from '../../context/user-token-balances-provider'

export const useAaveV3Data = () => {
    // const activeAccount = useActiveAccount()
    // const walletAddress = activeAccount?.address
    const { address: walletAddress } = useAccount()
    const { providers } = useEthersMulticall(walletAddress)
    const [providerStatus, setProviderStatus] = useState({
        isReady: false,
        isInitializing: true,
        error: null as string | null,
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

    const [reserveData, setReserveData] =
        useState<void | ReservesDataHumanized>()
    const [userData, setUserData] = useState<void | {
        userReserves: UserReserveDataHumanized[]
        userEmodeCategoryId: number
    }>()

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
            const uiPoolDataProviderInstance = new UiPoolDataProvider({
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
        lendingPoolAddressProvider: string
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
            const uiPoolDataProviderInstance = new UiPoolDataProvider({
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
                    user: getAddress(walletAddress),
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
        allData?: [
            ReservesDataHumanized,
            {
                userReserves: UserReserveDataHumanized[]
                userEmodeCategoryId: number
            },
        ]
    ) => {
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
        const formattedPoolReserves = formatReserves({
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

        const user = formatUserSummary({
            currentTimestamp: currentTimestamp,
            marketReferencePriceInUsd:
                baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            marketReferenceCurrencyDecimals:
                baseCurrencyData.marketReferenceCurrencyDecimals,
            userReserves: _userData.userReserves,
            formattedReserves: formattedPoolReserves,
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
        allData?: [
            ReservesDataHumanized,
            {
                userReserves: UserReserveDataHumanized[]
                userEmodeCategoryId: number
            },
        ]
    ) => {
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

        const formattedPoolReserves = formatReserves({
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

        const user = formatUserSummary({
            currentTimestamp: currentTimestamp,
            marketReferencePriceInUsd:
                baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            marketReferenceCurrencyDecimals:
                baseCurrencyData.marketReferenceCurrencyDecimals,
            userReserves: _userData.userReserves,
            formattedReserves: formattedPoolReserves,
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
            ReservesDataHumanized,
            {
                userReserves: UserReserveDataHumanized[]
                userEmodeCategoryId: number
            },
        ]
    ) => {
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

        const formattedPoolReserves = formatReserves({
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

        const user = formatUserSummary({
            currentTimestamp: currentTimestamp,
            marketReferencePriceInUsd:
                baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            marketReferenceCurrencyDecimals:
                baseCurrencyData.marketReferenceCurrencyDecimals,
            userReserves: _userData.userReserves,
            formattedReserves: formattedPoolReserves,
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

    return {
        reserveData,
        userData,
        getAllowance,
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getMaxWithdrawAmount,
        getMaxRepayAmount,
        providerStatus,
    }
}
