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
    desiredLeverageinput,
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
    desiredLeverageinput: number
}) {
    const PRICE_DECIMALS = 8

    const desiredLeverage = desiredLeverageinput;
    
    const getCurrentLeverage = () => {
        try {
            // Ensure we're working with BigNumber compatible values
            const lendAmountBN = BigNumber.from(currentLendAmount)
            const borrowAmountBN = BigNumber.from(currentBorrowAmount)
            
            // Convert price to BigNumber with proper decimals
            const lendPriceBN = BigNumber.from(
                (lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed(0)
            )
            const borrowPriceBN = BigNumber.from(
                (borrowTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed(0)
            )

            // Calculate USD values
            const currentLendTokenValueinUsd = Number(
                formatUnits(
                    lendAmountBN.mul(lendPriceBN),
                    lendTokenDetails.decimals + PRICE_DECIMALS
                )
            )

            const currentBorrowTokenValueinUsd = Number(
                formatUnits(
                    borrowAmountBN.mul(borrowPriceBN),
                    borrowTokenDetails.decimals + PRICE_DECIMALS
                )
            )

            const currentPrincipalAmountInUsd = currentLendTokenValueinUsd - currentBorrowTokenValueinUsd

            // Convert principal back to token amount with proper decimal handling
            const principalInTokens = (currentPrincipalAmountInUsd / lendTokenDetails.priceUsd)
                .toFixed(lendTokenDetails.decimals)
            
            const currentPrincipalAmountInToken = parseUnits(
                principalInTokens,
                lendTokenDetails.decimals
            ).toString()

            const currentLeverage = currentLendTokenValueinUsd > 0 ? 
                currentLendTokenValueinUsd / (currentLendTokenValueinUsd - currentBorrowTokenValueinUsd) : 1

            return {
                currentLeverage,
                currentPrincipalAmountInToken,
                currentPrincipalAmountInUsd,
            }
        } catch (error) {
            console.error('Error in getCurrentLeverage:', error)
            // Return safe default values
            return {
                currentLeverage: 1,
                currentPrincipalAmountInToken: '0',
                currentPrincipalAmountInUsd: 0,
            }
        }
    }

    const paramsForDesiredLeverage = (desiredLeverage: number) => {
        try {
            const {
                currentLeverage,
                currentPrincipalAmountInToken,
                currentPrincipalAmountInUsd,
            } = getCurrentLeverage()

            if (desiredLeverage > currentLeverage) {
                throw new Error("Desired leverage cannot be greater than current leverage for unloop")
            }

            // Handle the case where principal amount is very small
            if (currentPrincipalAmountInUsd < 0.000001) {
                return {
                    repayAmountToken: '0',
                    swapDetails: {
                        fromToken: lendTokenDetails.address,
                        toToken: borrowTokenDetails.address,
                        amountToSwap: '0',
                    },
                    aTokenAmount: '0',
                    withdrawAmount: '1',
                }
            }

            const desiredLendAmountToken = BigNumber.from(currentPrincipalAmountInToken)
                .mul(BigNumber.from((desiredLeverage * 100).toFixed(0)))
                .div(100)

            const desiredLendAmountUsd = Number(
                formatUnits(
                    desiredLendAmountToken
                        .mul(BigNumber.from((lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed(0)))
                        .toString(),
                    lendTokenDetails.decimals + PRICE_DECIMALS
                )
            )

            const desiredBorrowAmountUsd = desiredLendAmountUsd - currentPrincipalAmountInUsd

            const desiredBorrowAmountToken = parseUnits(
                Math.abs(desiredBorrowAmountUsd / borrowTokenDetails.priceUsd)
                    .toFixed(borrowTokenDetails.decimals),
                borrowTokenDetails.decimals
            )

            const diffInLendAmountToken = BigNumber.from(currentLendAmount).sub(desiredLendAmountToken)
            const diffInLendAmountUsd = Number(
                formatUnits(
                    diffInLendAmountToken
                        .mul(BigNumber.from((lendTokenDetails.priceUsd * 10 ** PRICE_DECIMALS).toFixed(0)))
                        .toString(),
                    lendTokenDetails.decimals + PRICE_DECIMALS
                )
            )

            const diffInBorrowAmountToken = parseUnits(
                Math.abs(diffInLendAmountUsd / borrowTokenDetails.priceUsd)
                    .toFixed(borrowTokenDetails.decimals),
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
                aTokenAmount: diffInLendAmountToken.mul(BigNumber.from(100 + 2)).div(BigNumber.from(100)).toString(),
                withdrawAmount: "1",
            }
        } catch (error) {
            console.error('Error in paramsForDesiredLeverage:', error)
            // Return safe default values
            return {
                repayAmountToken: '0',
                swapDetails: {
                    fromToken: lendTokenDetails.address,
                    toToken: borrowTokenDetails.address,
                    amountToSwap: '0',
                },
                aTokenAmount: '0',
                withdrawAmount: '1',
            }
        }
    }

    return paramsForDesiredLeverage(desiredLeverage)
}
