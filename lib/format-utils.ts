import { getLowestDisplayValue, hasLowestDisplayValuePrefix } from './utils'

export function handleSmallestValue(amount: string, maxDecimalsToDisplay: number = 2) {
    const amountFormatted = hasExponent(amount) ? Math.abs(Number(amount)).toFixed(10) : amount.toString()
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted), maxDecimalsToDisplay)} ${getLowestDisplayValue(Number(amountFormatted), maxDecimalsToDisplay)}`
}

export function getMaxDecimalsToDisplay(tokenSymbol: string): number {
    return tokenSymbol?.toLowerCase().includes('btc') || tokenSymbol?.toLowerCase().includes('eth') ? 4 : 2
}

export function hasExponent(num: string | number): boolean {
    return String(num).includes('e') || String(num).includes('E')
}

export function decimalPlacesCount(num: string | number): number {
    const str = String(num)
    if (hasExponent(str)) {
        const [base, exponent] = str.split(/[eE]/)
        const exp = parseInt(exponent || '0')
        if (exp < 0) {
            return Math.abs(exp)
        }
        const decimalPart = base.split('.')[1] || ''
        return Math.max(0, decimalPart.length - exp)
    }
    const decimalPart = str.split('.')[1] || ''
    return decimalPart.length
}

export function formatUsdValue(amount: string | number): string {
    const amountFormatted = hasExponent(amount) ? Math.abs(Number(amount)).toFixed(10) : amount.toString()
    const amountFormattedForLowestValue = getLowestDisplayValue(Number(amountFormatted))
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
} 