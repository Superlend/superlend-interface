/**
 * Converts raw viem/wagmi errors into user-friendly messages
 * that can be displayed in the UI.
 */
export function humaniseWagmiError(error: any): string {
  if (!error) return 'An unknown error occurred'

  const errorMessage = error.message || error.toString()

  // Check for common error patterns
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
    return 'Transaction was cancelled by user'
  }

  if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
    return 'Insufficient funds to complete this transaction'
  }

  if (errorMessage.includes('gas required exceeds allowance') || errorMessage.includes('out of gas')) {
    return 'Transaction requires more gas than available'
  }

  if (errorMessage.includes('nonce too low')) {
    return 'Transaction nonce is too low. Please try again.'
  }

  if (errorMessage.includes('nonce too high')) {
    return 'Transaction nonce is too high. Please refresh and try again.'
  }

  if (errorMessage.includes('replacement transaction underpriced')) {
    return 'Transaction fee is too low. Please increase the gas fee.'
  }

  if (errorMessage.includes('execution reverted')) {
    // Try to extract custom error message if available
    const revertMatch = errorMessage.match(/execution reverted(?:: (.+))?/)
    if (revertMatch && revertMatch[1] && revertMatch[1] !== 'undefined') {
      return `Transaction failed: ${revertMatch[1]}`
    }
    return 'Transaction was reverted by the smart contract'
  }

  if (errorMessage.includes('network not supported') || errorMessage.includes('unsupported chain')) {
    return 'This network is not supported. Please switch to a supported network.'
  }

  if (errorMessage.includes('ConnectorNotConnectedError')) {
    return 'Wallet is not connected. Please connect your wallet and try again.'
  }

  if (errorMessage.includes('ChainMismatchError')) {
    return 'Wrong network detected. Please switch to the correct network.'
  }

  if (errorMessage.includes('allowance')) {
    return 'Token allowance is insufficient. Please approve the token first.'
  }

  // If none of the patterns match, return a generic message with the original error
  // but truncate very long error messages
  const truncatedMessage = errorMessage.length > 100 
    ? errorMessage.substring(0, 100) + '...'
    : errorMessage

  return `Transaction failed: ${truncatedMessage}`
} 