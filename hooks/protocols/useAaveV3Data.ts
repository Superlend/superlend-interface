import { useActiveAccount } from 'thirdweb/react'
import {
    ReservesDataHumanized,
    UiPoolDataProvider,
    UserReserveDataHumanized,
} from '@aave/contract-helpers'
import { useEthersMulticall } from '../useEthereumMulticall'
import { useState } from 'react'
import { formatReserves, formatUserSummary } from '@aave/math-utils'
import { getAddress } from 'ethers/lib/utils'
import { getMaxAmountAvailableToBorrow } from '../../lib/getMaxAmountAvailableToBorrow'
import { hasExponent, normalizeResult, parseScientific } from '@/lib/utils'

export const useAaveV3Data = () => {
    const activeAccount = useActiveAccount()
    const { providers } = useEthersMulticall()
    const walletAddress = activeAccount?.address

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
        if (!walletAddress) return Promise.resolve()
        const uiPoolDataProviderInstance = new UiPoolDataProvider({
            uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
            provider: providers[chainId],
            chainId: chainId,
        })

        const result = await uiPoolDataProviderInstance.getReservesHumanized({
            lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
        })
        setReserveData(result)
        return result
    }

    const fetchUserData = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
        if (!walletAddress) return Promise.resolve()

        const uiPoolDataProviderInstance = new UiPoolDataProvider({
            uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
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
    }

    const fetchAaveV3Data = async (
        chainId: number,
        uiPoolDataProviderAddress: string,
        lendingPoolAddressProvider: string
    ) => {
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
        }
    }

    const getMaxSupplyAmount = async (token: string) => {}

    return {
        reserveData,
        userData,
        fetchAaveV3Data,
        getMaxBorrowAmount,
    }
}
