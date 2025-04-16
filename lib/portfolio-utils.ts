/**
 * Portfolio-related utility functions
 */

/**
 * Checks if a user's portfolio value exceeds the specified threshold
 * @param portfolioValue The user's current portfolio value in USD
 * @param threshold The minimum value required to qualify (default: $1,000)
 * @returns boolean indicating if the portfolio value exceeds the threshold
 */
export function isPortfolioAboveThreshold(
  portfolioValue: number, 
  threshold: number = 10
): boolean {
  return portfolioValue >= threshold;
}

/**
 * Gets the user's portfolio value formatted as a string with $ prefix
 * @param portfolioValue The user's current portfolio value
 * @returns Formatted portfolio value string
 */
export function getFormattedPortfolioValue(portfolioValue: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(portfolioValue);
} 