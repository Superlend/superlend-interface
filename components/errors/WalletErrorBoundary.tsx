'use client'

import React, { Component, ReactNode } from 'react'
import InfoBannerWithCta from '../InfoBannerWithCta'
import { Button } from '../ui/button'

interface WalletErrorBoundaryState {
    hasError: boolean
    error?: Error
    errorInfo?: any
}

interface WalletErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: any) => void
}

export class WalletErrorBoundary extends Component<WalletErrorBoundaryProps, WalletErrorBoundaryState> {
    constructor(props: WalletErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): WalletErrorBoundaryState {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Wallet Error Boundary caught an error:', error, errorInfo)
        this.props.onError?.(error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    handleForceReload = () => {
        // Clear all wallet-related localStorage
        if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
                if (key.includes('wallet') || 
                    key.includes('privy') || 
                    key.includes('wagmi') ||
                    key.includes('user') ||
                    key.includes('portfolio')) {
                    localStorage.removeItem(key)
                }
            })
        }
        // window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            const isWalletConnectionError = this.state.error?.message?.includes('Wallet') ||
                                          this.state.error?.message?.includes('wallet') ||
                                          this.state.error?.message?.includes('connection')

            return (
                <div className="py-16">
                    <InfoBannerWithCta
                        image={'/images/404-not-found.webp'}
                        title={isWalletConnectionError ? 'Wallet Connection Error' : 'Something went wrong'}
                        description={
                            isWalletConnectionError 
                                ? 'There was an issue connecting to your wallet. This sometimes happens due to network issues or wallet extension problems.'
                                : 'An unexpected error occurred. Please try refreshing the page or reconnecting your wallet.'
                        }
                        ctaButton={
                            <div className="flex gap-3">
                                <Button 
                                    onClick={this.handleReset}
                                    variant="outline"
                                >
                                    Try Again
                                </Button>
                                <Button 
                                    onClick={this.handleForceReload}
                                    variant="default"
                                >
                                    Refresh Page
                                </Button>
                            </div>
                        }
                    />
                    
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 bg-red-50 p-4 rounded-md">
                            <summary className="cursor-pointer text-red-800 font-medium">
                                Debug Information (Development Only)
                            </summary>
                            <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * HOC to wrap components that use wallet functionality
 */
export const withWalletErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) => {
    const WrappedComponent = (props: P) => (
        <WalletErrorBoundary fallback={fallback}>
            <Component {...props} />
        </WalletErrorBoundary>
    )
    
    WrappedComponent.displayName = `withWalletErrorBoundary(${Component.displayName || Component.name})`
    return WrappedComponent
}

/**
 * Hook for handling wallet errors gracefully
 */
export const useWalletErrorHandler = () => {
    const handleWalletError = (error: unknown, context?: string) => {
        console.error(`Wallet error in ${context}:`, error)
        
        // You can add error reporting service here
        // e.g., Sentry, LogRocket, etc.
        
        if (error instanceof Error) {
            if (error.message.includes('User rejected') || 
                error.message.includes('user rejected')) {
                // Don't show error for user rejections
                return
            }
            
            if (error.message.includes('insufficient funds')) {
                // Handle insufficient funds gracefully
                return { type: 'insufficient_funds', message: 'Insufficient funds for this transaction' }
            }
            
            if (error.message.includes('network')) {
                // Handle network errors
                return { type: 'network_error', message: 'Network connection issue. Please try again.' }
            }
        }
        
        return { 
            type: 'unknown_error', 
            message: 'An unexpected error occurred. Please try again.' 
        }
    }
    
    return { handleWalletError }
} 