import { getLowestDisplayValue, hasLowestDisplayValuePrefix } from '@/lib/utils'
import { TPlatform, TPlatformAsset } from '@/types/platform'
import { TChain } from '@/types/chain'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

export function getTokenDetails({
    tokenAddress,
    platformData,
}: {
    tokenAddress: string
    platformData: TPlatform
}) {
    const fallbackAsset = {
        address: tokenAddress,
        symbol: '',
        name: '',
        logo: '',
        decimals: 0,
        price_usd: 0,
        warnings: [],
    }
    const asset: TPlatformAsset['token'] | undefined =
        platformData?.assets?.find(
            (asset: TPlatformAsset) =>
                asset?.token?.address?.toLowerCase() ===
                tokenAddress?.toLowerCase()
        )?.token || fallbackAsset

    return {
        address: asset?.address || '',
        symbol: asset?.symbol || '',
        name: asset?.name || '',
        logo: asset?.logo || '',
    }
}

export function getChainDetails({
    allChainsData,
    chainIdToMatch,
}: {
    allChainsData: TChain[]
    chainIdToMatch: string | number
}) {
    return allChainsData?.find(
        (chain: any) => Number(chain.chain_id) === Number(chainIdToMatch)
    )
}

export function getStatDisplayValue(
    value: string | number,
    hasPrefix: boolean = true
) {
    return `${
        hasPrefix ? hasLowestDisplayValuePrefix(Number(value)) : ''
    }${getLowestDisplayValue(Number(value))}`
}

// Function to calculate estimated earnings
/**
 * @param supplyAPY - Supply APY from API
 * @param borrowAPY - Borrow APY from API
 * @param amountSuppliedInUsd - Amount supplied in USD from user
 * @param amountBorrowedInUsd - Amount borrowed in USD from user
 * @param duration - Duration in months from user
 * @returns - Estimated earnings
 */

/**
 * Calculation logic:
 * InterestGain = (Supply amount in USD * Supply apy * duration in months)/1200
 * InterestLoss = (Borrow amount in USD * Borrow apy * duration in months)/1200
 * Net estimated earnings = InterestGain - InterestLoss
 */
export function getEstimatedEarnings({
    supplyAPY,
    borrowAPY,
    amountSupplied,
    amountBorrowed,
    duration,
}: {
    supplyAPY: number
    borrowAPY: number
    amountSupplied: number
    amountBorrowed: number
    duration: number // In months
}) {
    const interestGain = (amountSupplied * supplyAPY * duration) / 1200
    const interestLoss = (amountBorrowed * borrowAPY * duration) / 1200
    return {
        interestGain,
        interestLoss,
        netEstimatedEarnings: interestGain - interestLoss,
    }
}

/**
 * Calculate unloop parameters based on leverage change
 * This function calculates the withdraw amount, repay amount, and aToken amount
 * based on the desired leverage change for an existing loop position
 */
export function calculateUnloopParameters({
    currentLendAmount,
    currentBorrowAmount,
    lendTokenDetails,
    borrowTokenDetails,
    desiredLeverage,
}: {
    currentLendAmount: string
    currentBorrowAmount: string
    lendTokenDetails: {
        address: string
        priceUsd: number
        decimals: number
    }
    borrowTokenDetails: {
        address: string
        priceUsd: number
        decimals: number
    }
    desiredLeverage: number
}) {
    const PRICE_DECIMALS = 8

    // Calculate current leverage
    const getCurrentLeverage = () => {
        const currentLendTokenValueinUsd = Number(
            formatUnits(
                BigNumber.from(currentLendAmount)
                    .mul((lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed())
                    .toString(),
                lendTokenDetails.decimals + PRICE_DECIMALS
            )
        )

        const currentBorrowTokenValueinUsd = Number(
            formatUnits(
                BigNumber.from(currentBorrowAmount)
                    .mul((borrowTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed())
                    .toString(),
                borrowTokenDetails.decimals + PRICE_DECIMALS
            )
        )

        const currentPrincipalAmountInUsd = currentLendTokenValueinUsd - currentBorrowTokenValueinUsd

        const currentPrincipalAmountInToken = parseUnits(
            (currentPrincipalAmountInUsd / lendTokenDetails.priceUsd)
                .toFixed(lendTokenDetails.decimals)
                .toString(),
            lendTokenDetails.decimals
        ).toString()

        const currentLeverage = Number(currentLendTokenValueinUsd) / 
            (Number(currentLendTokenValueinUsd) - Number(currentBorrowTokenValueinUsd))

        return {
            currentLeverage,
            currentPrincipalAmountInToken,
            currentPrincipalAmountInUsd,
        }
    }

    const paramsForDesiredLeverage = (desiredLeverage: number) => {
        const {
            currentLeverage,
            currentPrincipalAmountInToken,
            currentPrincipalAmountInUsd,
        } = getCurrentLeverage()

        // For unloop, desired leverage should be less than current leverage
        if (desiredLeverage > currentLeverage) {
            throw new Error("Desired leverage cannot be greater than current leverage for unloop")
        }

        const desiredLendAmountToken = BigNumber.from(currentPrincipalAmountInToken)
            .mul((desiredLeverage * 100).toFixed())
            .div(100)

        const desiredLendAmountUsd = Number(
            formatUnits(
                desiredLendAmountToken
                    .mul((lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed())
                    .toString(),
                lendTokenDetails.decimals + PRICE_DECIMALS
            )
        )

        const desiredBorrowAmountUsd = desiredLendAmountUsd - currentPrincipalAmountInUsd

        const desiredBorrowAmountToken = parseUnits(
            (desiredBorrowAmountUsd / borrowTokenDetails.priceUsd)
                .toFixed(borrowTokenDetails.decimals)
                .toString(),
            borrowTokenDetails.decimals
        )

        const diffInLendAmountToken = BigNumber.from(currentLendAmount).sub(desiredLendAmountToken)
        const diffInLendAmountUsd = Number(
            formatUnits(
                diffInLendAmountToken
                    .mul((lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed())
                    .toString(),
                lendTokenDetails.decimals + PRICE_DECIMALS
            )
        )
        const diffInBorrowAmountToken = parseUnits(
            (diffInLendAmountUsd / borrowTokenDetails.priceUsd)
                .toFixed(borrowTokenDetails.decimals)
                .toString(),
            borrowTokenDetails.decimals
        )

        const amountToSwap = diffInBorrowAmountToken
            .mul(BigNumber.from(10000 + 50))
            .div(BigNumber.from(10000))

        return {
            repayAmountToken: diffInBorrowAmountToken.toString(),
            swapDetails: {
                fromToken: lendTokenDetails.address,
                toToken: borrowTokenDetails.address,
                amountToSwap: amountToSwap.toString(),
            },
            aTokenAmount: diffInLendAmountToken.toString(),
            withdrawAmount: diffInLendAmountToken.toString(),
        }
    }

    return paramsForDesiredLeverage(desiredLeverage)
}
