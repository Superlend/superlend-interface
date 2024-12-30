// import { useActiveAccount } from 'thirdweb/react'
import {
    ReservesDataHumanized,
    UiPoolDataProvider,
    UserReserveDataHumanized,
} from '@aave/contract-helpers'
import { useEthersMulticall } from '../useEthereumMulticall'
import { useState, useEffect } from 'react'
import { formatReserves, formatUserSummary } from '@aave/math-utils'
import { getAddress } from 'ethers/lib/utils'
import { getMaxAmountAvailableToBorrow } from '../../lib/getMaxAmountAvailableToBorrow'
import { hasExponent } from '@/lib/utils'
import { erc20Abi } from 'viem'
import { Contract } from 'ethers'
import { BigNumber } from 'ethers'
import { useAccount } from 'wagmi'

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
            console.log('Missing required parameters for fetchReservesData')
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

    return {
        reserveData,
        userData,
        getAllowance,
        fetchAaveV3Data,
        getMaxBorrowAmount,
        providerStatus,
    }
}
