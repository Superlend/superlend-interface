'use client'

import React, { useEffect, useState } from 'react'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import SelectTokeWidget from '@/components/SelectTokeWidget'
import MainContainer from '@/components/MainContainer'
import TokenRates from '@/components/TokenRates'
import { SelectTokenByChain } from '@/components/dialogs/SelectTokenByChain'
import { usePositionsContext } from '@/context/positions-provider'
import { useAssetsDataContext } from '@/context/data-provider'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { TPositionType, TToken } from '@/types'
import { usePortfolioDataContext } from '@/context/portfolio-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import Opportunities from './opportunities'
import { AnimatePresence, motion } from 'framer-motion'
import { PlatformType } from '@/types/platform'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { useSearchParams } from 'next/navigation'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { TChain } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

interface ISelectedToken {
    address: string
    balance: number
    chain_id: number
    chain_logo: string
    chain_name: string
    decimals: number
    logo: string
    name: string
    price_usd: number
    symbol: string
}

export default function HomePageComponents() {
    const { isConnectingWallet, walletAddress, isWalletConnected } = useWalletConnection()
    const {
        erc20TokensBalanceData,
        isLoading: isLoadingErc20TokensBalanceData,
        isRefreshing: isRefreshingErc20TokensBalanceData,
        formattedTokenBalances
    } = useUserTokenBalancesContext()
    const updateSearchParams = useUpdateSearchParams()
    const searchParams = useSearchParams()
    const tokenAddressParam = searchParams.get('token_address')
    const chainIdParam = searchParams.get('chain_id')
    const [positionType, setPositionType] = useState<TPositionType>('lend');
    const [openSelectTokenDialog, setOpenSelectTokenDialog] = useState(false)
    const [selectedToken, setSelectedToken] = useState<any>(null)
    const [showOpportunitiesTable, setShowOpportunitiesTable] = useState(false)
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionType as TPositionType,
            chain_ids: [Number(selectedToken?.chain_id)],
            tokens: [selectedToken?.symbol || ''],
            enabled: !!selectedToken,
        })
    const { logEvent } = useAnalytics()

    const formattedTokensList = formattedTokenBalances.map((tokenBalance) => {
        return {
            ...tokenBalance.token,
            chain_id: tokenBalance.chain?.chain_id,
            chain_logo: tokenBalance.chain?.logo,
            chain_name: tokenBalance.chain?.name,
        }
    });

    function resetHomepageState() {
        setSelectedToken(null)
        setShowOpportunitiesTable(false)
        updateSearchParams({
            token_address: undefined,
            chain_id: undefined,
            position_type: 'lend',
        })
    }

    const tokenBalance = formattedTokenBalances.find(tokenBalance => tokenBalance.token.address === selectedToken?.address)?.token?.balance || 0;

    // Reset homepage state when token is not selected or selectedToken is null
    useEffect(() => {
        if (!selectedToken) {
            resetHomepageState()
        }
    }, [!!selectedToken])

    // Reset homepage state when token address or chain id is not present
    useEffect(() => {
        if (!tokenAddressParam || !chainIdParam) {
            resetHomepageState()
        }
    }, [tokenAddressParam, chainIdParam])

    // Set showOpportunitiesTable to true when token is selected
    useEffect(() => {
        if (!!selectedToken) {
            setShowOpportunitiesTable(true)
        }
    }, [!!selectedToken, selectedToken?.address])

    const handlePositionTypeToggle = (type: TPositionType) => {
        setPositionType(type)
        updateSearchParams({
            position_type: type,
        })
    }

    function handleSelectToken(token: any) {
        setSelectedToken(token)
        updateSearchParams({
            token_address: token.address,
            chain_id: token.chain_id,
            position_type: positionType,
        })
        logEvent('token_selected', {
            action: positionType,
            token_symbol: token.symbol,
            chain_name: token.chain_name,
            wallet_address: walletAddress,
        })
        setOpenSelectTokenDialog(false)
    }

    function handleExcludeMorphoMarketsForLendAssets(
        opportunity: any
    ) {
        const isVault = opportunity.platform.isVault
        const isMorpho =
            opportunity.platform.protocol_type ===
            PlatformType.MORPHO

        return !(isMorpho && !isVault)
    }

    function handleExcludeMorphoVaultsForBorrowAssets(
        opportunity: any
    ) {
        const isVault = opportunity.platform.isVault
        const isMorpho =
            opportunity.platform.protocol_type ===
            PlatformType.MORPHO

        return !(isMorpho && isVault)
    }

    function handleFilterTableRows(opportunity: any) {
        return positionType === 'borrow'
            ? handleExcludeMorphoVaultsForBorrowAssets(opportunity)
            : handleExcludeMorphoMarketsForLendAssets(opportunity)
    }

    const filteredOpportunitiesData = opportunitiesData.filter(handleFilterTableRows)

    return (
        <MainContainer className="mt-20 md:mt-24">
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                <div className="relative z-10 w-full max-w-[300px]">
                    <ToggleTab
                        type={positionType === "lend" ? "tab1" : "tab2"}
                        handleToggle={(positionType: TTypeToMatch) => {
                            handlePositionTypeToggle(positionType === "tab1" ? "lend" : "borrow")
                        }}
                    />
                </div>
                <TokenRates
                    positionType={positionType}
                />
                <div className="flex flex-col lg:flex-row lg:items-start justify-center gap-2 transition-all duration-300 max-w-full w-full md:overflow-hidden">
                    <motion.div
                        animate={{ x: showOpportunitiesTable ? 0 : 'auto' }}
                        transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.2 }}
                    >
                        <SelectTokeWidget
                            setOpenSelectTokenDialog={setOpenSelectTokenDialog}
                            selectedToken={selectedToken}
                            tokenBalance={tokenBalance}
                            isLoadingBalance={isLoadingErc20TokensBalanceData || isRefreshingErc20TokensBalanceData}
                            opportunitiesData={filteredOpportunitiesData}
                            positionType={positionType}
                            setShowOpportunitiesTable={setShowOpportunitiesTable}
                            isLoadingOpportunities={isLoadingOpportunitiesData}
                        />
                    </motion.div>
                    <AnimatePresence>
                        {showOpportunitiesTable ?
                            (<motion.div
                                initial={{ x: 1400, opacity: 0, width: 0 }}
                                animate={{ x: 0, opacity: 1, width: '100%' }}
                                exit={{ x: 1400, opacity: 0, width: 0 }}
                                transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
                                className="w-full lg:max-w-[600px] xl:max-w-[750px]"
                            >
                                <Opportunities
                                    positionType={positionType}
                                    opportunitiesData={filteredOpportunitiesData}
                                    isLoadingOpportunitiesData={isLoadingOpportunitiesData}
                                />
                            </motion.div>)
                            : null
                        }
                    </AnimatePresence>
                </div>
                <SelectTokenByChain
                    open={openSelectTokenDialog}
                    setOpen={setOpenSelectTokenDialog}
                    tokens={formattedTokensList}
                    onSelectToken={handleSelectToken}
                    isLoading={isLoadingErc20TokensBalanceData || isConnectingWallet}
                />
            </div>
        </MainContainer>
    )
}
