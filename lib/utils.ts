import { chainNamesBasedOnAaveMarkets, platformWebsiteLinks } from '@/constants'
import { Period } from '@/types/periodButtons'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function containsNegativeInteger(str: string | number): boolean {
    const value = str.toString()
    // Regular expression to match negative integers
    const negativeIntegerPattern = /-\d+/

    // Test the string against the pattern
    return negativeIntegerPattern.test(value)
}

export function convertNegativeToPositive(str: string | number): string {
    const value = str.toString()
    // Regular expression to match negative integers
    const negativeIntegerPattern = /(-\d+)/g

    // Replace negative integers with their positive counterparts
    return value.toString().replace(negativeIntegerPattern, (match) => {
        return Math.abs(parseInt(match, 10)).toString()
    })
}

export const abbreviateNumber = (
    value: number = 0,
    fixed: number = 2
): string => {
    const getAbbreviation = (num: number) => {
        const abs = Math.abs(num)
        if (abs >= 1000000000) {
            return { divisor: 1000000000, suffix: 'B' }
        } else if (abs >= 1000000) {
            return { divisor: 1000000, suffix: 'M' }
        } else if (abs >= 1000) {
            return { divisor: 1000, suffix: 'K' }
        }
        return { divisor: 1, suffix: '' }
    }

    const { divisor, suffix } = getAbbreviation(value)

    if (divisor === 1) {
        // For small numbers, preserve all decimal places up to fixed
        const decimalStr = value.toString()
        const [whole, decimal] = decimalStr.split('.')
        if (decimal) {
            return `${whole}.${decimal.slice(0, fixed)}`
        }
        return whole
    }

    // For abbreviated numbers, calculate division precisely
    const divided = value / divisor
    const decimalStr = divided.toString()
    const [whole, decimal] = decimalStr.split('.')

    if (decimal) {
        return `${whole}.${decimal.slice(0, fixed)}${suffix}`
    }
    return `${whole}${suffix}`
}

type TOptions = {
    exclude?: string[]
}

export function extractTimeFromDate(date: Date, options: TOptions = {}) {
    const { exclude } = options

    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')

    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 // Convert to 12-hour format
    hours = hours ? hours : 12 // The hour '0' should be '12'

    const hasHours = !exclude?.includes('hours') ? `${hours}` : ''
    const hasMinutes = !exclude?.includes('minutes') ? `:${minutes}` : ''
    const hasSeconds = !exclude?.includes('seconds') ? `:${seconds}` : ''

    return `${hasHours}${hasMinutes}${hasSeconds} ${ampm}`
}

export function formatDateAccordingToPeriod(
    timeStamp: string,
    selectedRange: Period
) {
    const day = timeStamp.slice(4, 6).split(',')[0]
    const month = timeStamp.slice(0, 3)
    const date = `${day} ${month}`

    const result = selectedRange === Period.oneDay ? timeStamp : date
    return result
}

export const shortNubers = (value: number): number => {
    const parts = value.toString().split('.')

    if (parts.length === 1) {
        return value
    }

    const integerPart = parts[0]
    const fractionalPart = parts[1]

    let significantCount = 0
    let trimmedFractional = ''
    let firstNotZero = false
    for (let i = 0; i < fractionalPart.length; i++) {
        trimmedFractional += fractionalPart[i]
        if (Number(fractionalPart[i]) > 0) {
            firstNotZero = true
        }
        if (firstNotZero) {
            significantCount++
        }
        if (significantCount === 3) {
            break
        }
    }

    const result = parseFloat(integerPart + '.' + trimmedFractional)

    return result
}

export function calculateScientificNotation(
    num1: string,
    num2: string,
    operation: 'add' | 'subtract' | 'divide' | 'multiply'
) {
    // Extract the coefficient and exponent from the first number
    const [coef1, exp1] = parseScientific(num1)
    // Extract the coefficient and exponent from the second number
    const [coef2, exp2] = parseScientific(num2)

    let resultCoefficient
    let resultExponent

    switch (operation) {
        case 'multiply':
            // Multiply the coefficients and add the exponents
            resultCoefficient = coef1 * coef2
            resultExponent = exp1 + exp2
            break
        case 'add':
            // Align exponents for addition
            if (exp1 > exp2) {
                resultCoefficient = coef1 + coef2 * Math.pow(10, exp2 - exp1)
                resultExponent = exp1
            } else {
                resultCoefficient = coef2 + coef1 * Math.pow(10, exp1 - exp2)
                resultExponent = exp2
            }
            break
        case 'subtract':
            // Align exponents for subtraction
            if (exp1 > exp2) {
                resultCoefficient = coef1 - coef2 * Math.pow(10, exp2 - exp1)
                resultExponent = exp1
            } else {
                resultCoefficient = coef2 - coef1 * Math.pow(10, exp1 - exp2)
                resultExponent = exp2
            }
            break
        case 'divide':
            // Divide the coefficients and subtract the exponents
            resultCoefficient = coef1 / coef2
            resultExponent = exp1 - exp2
            break
        default:
            throw new Error(
                "Invalid operation. Use 'add', 'subtract', 'multiply', or 'divide'."
            )
    }

    // Calculate the final result in normal number format
    return normalizeResult(resultCoefficient, resultExponent)
}

export function convertScientificToNormal(num: string | number) {
    const value = num.toString()
    // Extract the coefficient and exponent using regex
    const regex = /([+-]?\d*\.?\d+)(e[+-]?\d+)?/i
    const match = value.match(regex)

    if (!match) {
        throw new Error('Invalid number format')
    }

    const coefficient = parseFloat(match[1])
    const exponent = match[2] ? parseInt(match[2].substring(1), 10) : 0

    // Calculate the normal number by multiplying the coefficient by 10 raised to the exponent
    return coefficient * Math.pow(10, exponent)
}

export function parseScientific(num: number | string) {
    const value = num.toString()
    const regex = /([+-]?\d*\.?\d+)(e[+-]?\d+)?/i
    const match = value.match(regex)

    if (!match) {
        throw new Error('Invalid number format')
    }

    const coefficient = parseFloat(match[1])
    const exponent = match[2] ? parseInt(match[2].substring(1), 10) : 0

    return [coefficient, exponent]
}

export function hasExponent(value: string) {
    const regex = /([+-]?\d*\.?\d+)(e[+-]?\d+)?/i
    const match = value.match(regex)
    return match ? true : false
}

export function normalizeResult(coefficient: number, exponent: number) {
    // Normalize to standard decimal format
    return coefficient * Math.pow(10, exponent)
}

export function isLowestValue(value: number, maxDecimalsToDisplay: number = 2) {
    return value > 0 && value < (maxDecimalsToDisplay === 2 ? 0.01 : 0.0001)
}

export function isLowestNegativeValue(value: number) {
    return value < -0.01
}

export function hasLowestDisplayValuePrefix(
    value: number,
    maxDecimalsToDisplay: number = 2
) {
    return isLowestValue(Number(value), maxDecimalsToDisplay) ? '<' : ''
}

export function getLowestDisplayValue(
    value: number,
    maxDecimalsToDisplay: number = 2
): string {
    return isLowestValue(Number(value), maxDecimalsToDisplay)
        ? maxDecimalsToDisplay === 2
            ? '0.01'
            : '0.0001'
        : abbreviateNumber(value, maxDecimalsToDisplay)
}

export function formatAmountToDisplay(amount: string) {
    if (isLowestValue(Number(amount ?? 0))) {
        return getLowestDisplayValue(Number(amount ?? 0))
    } else {
        return abbreviateNumber(Number(amount ?? 0))
    }
}

export function getTokenLogo(tokenSymbol: string): string {
    return `https://app.aave.com/icons/tokens/${tokenSymbol?.toLowerCase()}.svg`
}

export function getPlatformLogo(platformName: string): string {
    return `/images/platforms/${platformName?.toLowerCase()}.webp`
}

/**
 * Extracts the version string subset from a hyphen-delimited platform name,
 * having version string subset on 1st index position.
 *
 * @param {string} platformName - The hyphen-delimited platform name.
 * @returns {string} The extracted version string subset or an empty string if not found.
 *
 * Example:
 * - If platformName is "AAVE-V3-ETHEREUM", returns "V3".
 * - If platformName is "FLUID-ETHEREUM", returns an empty string.
 */
export function getPlatformVersion(platformName: string): string {
    const versionMatch = platformName
        ?.split('-')[1]
        ?.toLowerCase()
        ?.match(/v2|v3|v\d+/)
    return versionMatch ? versionMatch[0].toUpperCase() : ''
}

export function capitalizeText(inputString: string) {
    // Check if the input is a valid string
    if (typeof inputString !== 'string') {
        throw new Error('Input must be a string')
    }

    // Split the string into words using space as a delimiter
    const words = inputString.split(' ')

    // Capitalize the first letter of each word
    const capitalizedWords = words.map((word) => {
        // Check if the word is not empty
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }
        return word // Return empty strings as they are
    })

    // Join the capitalized words back into a single string
    return capitalizedWords.join(' ')
}

export function getRiskFactor(
    healthFactor: string | number,
    midValue: number = 1.5,
    maxValue: number = 2
) {
    const HF = Number(healthFactor)
    if (HF < midValue)
        return {
            label: 'high',
            value: HF,
            theme: 'destructive',
        }
    if (HF >= midValue && HF < maxValue)
        return {
            label: 'medium',
            value: HF,
            theme: 'yellow',
        }
    return {
        label: 'low',
        value: HF,
        theme: 'green',
    }
}

export function getLiquidationRisk(
    healthFactor: number,
    midValue: number = 50,
    maxValue: number = 80
) {
    const HF = Number(healthFactor)
    if (HF < midValue)
        return {
            label: 'low',
            value: HF,
            theme: 'green',
        }
    if (HF >= midValue && HF < maxValue)
        return {
            label: 'medium',
            value: HF,
            theme: 'yellow',
        }
    return {
        label: 'High',
        value: HF,
        theme: 'destructive',
    }
}

export function getPlatformWebsiteLink({
    tokenAddress,
    chainName,
    chainId,
    platformId,
    vaultId,
    isFluidVault,
    isMorphoVault,
    morpho_market_id,
    network_name,
    core_contract,
}: {
    platformId: string
    tokenAddress?: string
    chainName?: string
    chainId?: string
    vaultId?: string
    isFluidVault?: boolean
    isMorphoVault?: boolean
    morpho_market_id?: string
    network_name?: string
    core_contract?: string
}) {
    const platformNameId = platformId?.split('-')[0].toLowerCase()
    const baseUrl =
        platformWebsiteLinks[
            platformNameId as keyof typeof platformWebsiteLinks
        ]

    const formattedNetworkName =
        network_name?.toLowerCase() === 'ethereum'
            ? 'mainnet'
            : network_name?.toLowerCase()

    const paths: any = {
        aave: `/reserve-overview/?underlyingAsset=${tokenAddress}&marketName=proto_${getChainNameBasedOnAaveMarkets(
            chainName || ''
        )}_v3`,
        compound: ``,
        fluid: isFluidVault
            ? `/stats/${chainId}/vaults#${vaultId}`
            : `/lending/${chainId}`,
        morpho: isMorphoVault
            ? `/vault?vault=${core_contract}&network=${formattedNetworkName}`
            : `/market?id=${morpho_market_id}&network=${formattedNetworkName}`,
        superlend: `/reserve-overview/?underlyingAsset=${tokenAddress}&marketName=etherlink`,
    }

    const path = paths[platformNameId]
    return `${baseUrl}${path}`
}

export function getChainNameBasedOnAaveMarkets(chainName: string) {
    if (chainName?.toLowerCase() in chainNamesBasedOnAaveMarkets) {
        return chainNamesBasedOnAaveMarkets[
            chainName?.toLowerCase() as keyof typeof chainNamesBasedOnAaveMarkets
        ]
    }

    return chainName?.toLowerCase()
}

export const copyToClipboard = async (text: string) => {
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text)
            return true // Return true if copy was successful
        } catch (err) {
            console.error('Failed to copy: ', err)
            return false // Return false if there was an error
        }
    } else {
        // Fallback for browsers that don't support Clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        try {
            document.execCommand('copy')
            document.body.removeChild(textArea)
            return true
        } catch (err) {
            console.error('Fallback copy failed: ', err)
            document.body.removeChild(textArea)
            return false
        }
    }
}

export function checkDecimalPlaces(value: string, decimals: number) {
    if (value.includes('.')) {
        const decimalPart = value.split('.')[1]
        if (decimalPart.length > decimals) {
            return true
        }
    }

    return false
}

export function decimalPlacesCount(value: string) {
    if (value.includes('.')) {
        const decimalPart = value.split('.')[1]
        return decimalPart.length
    }

    return 0
}

export function countCompoundDecimals(
    decimals: number,
    underlyingDecimals: number
) {
    if (underlyingDecimals !== 18) {
        return 18 - decimals
    }
    return underlyingDecimals
}

export function scientificToDecimal(scientificNum: number): number {
    // Convert the input to a string if it isn't already
    const numStr = scientificNum.toString()

    // If the number isn't in scientific notation, return it as is
    if (!numStr.includes('e')) {
        return Number(numStr)
    }

    // Split into coefficient and exponent
    let [coefficient, exponent]: any = numStr.split('e')
    exponent = parseInt(exponent)

    // If exponent is 0, return the coefficient
    if (exponent === 0) {
        return coefficient
    }

    // Remove decimal point from coefficient and get its position
    const decimalIndex = coefficient.includes('.')
        ? coefficient.indexOf('.')
        : coefficient.length
    coefficient = coefficient.replace('.', '')

    // Handle negative signs
    const isNegative = coefficient.startsWith('-')
    coefficient = isNegative ? coefficient.slice(1) : coefficient

    // Calculate new decimal position
    let newDecimalPosition = decimalIndex + exponent

    // Add leading/trailing zeros as needed
    if (newDecimalPosition <= 0) {
        // Need to add leading zeros
        coefficient = '0'.repeat(Math.abs(newDecimalPosition)) + coefficient
        newDecimalPosition = 0
    } else if (newDecimalPosition > coefficient.length) {
        // Need to add trailing zeros
        coefficient =
            coefficient + '0'.repeat(newDecimalPosition - coefficient.length)
    }

    // Insert decimal point at the new position
    let result =
        coefficient.slice(0, newDecimalPosition) +
        '.' +
        coefficient.slice(newDecimalPosition)

    // Remove trailing zeros after decimal and trailing decimal if needed
    result = result.replace(/\.?0+$/, '')

    // Add leading zero if needed
    if (result.startsWith('.')) {
        result = '0' + result
    }

    // Add negative sign back if needed
    return isNegative ? Number('-' + result) : Number(result)
}
export const validEmail = (email: string) => {
    const patt = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return patt.test(email)
}

export function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}
