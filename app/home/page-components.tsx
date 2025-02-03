'use client'

import React, { useEffect, useState } from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import SelectTokeWidget from '@/components/SelectTokeWidget'
import MainContainer from '@/components/MainContainer'
import TokenRates from '@/components/TokenRates'
import { SelectTokenByChain } from '@/components/dialogs/SelectTokenByChain'
import { usePositionsContext } from '@/context/positions-provider'
import { useAssetsDataContext } from '@/context/data-provider'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { TPositionType } from '@/types'
import { usePortfolioDataContext } from '@/context/portfolio-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import Opportunities from './opportunities'
import { AnimatePresence, motion } from 'framer-motion'
import { PlatformType } from '@/types/platform'
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams'
import { useSearchParams } from 'next/navigation'

interface ISelectedToken {
    address: string
    amount: number
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
    const updateSearchParams = useUpdateSearchParams()
    const searchParams = useSearchParams()
    const tokenAddressParam = searchParams.get('token_address')
    const chainIdParam = searchParams.get('chain_id')
    const [positionType, setPositionType] = useState<TPositionType>('lend');
    const { portfolioData, isLoadingPortfolioData } = usePortfolioDataContext()
    const { allChainsData } = useAssetsDataContext()
    const [openSelectTokenDialog, setOpenSelectTokenDialog] = useState(false)
    const [selectedToken, setSelectedToken] = useState<ISelectedToken | null>(null)
    const [showOpportunitiesTable, setShowOpportunitiesTable] = useState(false)
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionType as TPositionType,
            chain_ids: [Number(selectedToken?.chain_id)],
            tokens: [selectedToken?.symbol || ''],
            enabled: !!selectedToken,
        })

    function resetHomepageState() {
        setSelectedToken(null)
        setShowOpportunitiesTable(false)
        updateSearchParams({
            token_address: undefined,
            chain_id: undefined,
        })
    }

    useEffect(() => {
        if (!selectedToken) {
            resetHomepageState()
        }
    }, [!!selectedToken])

    useEffect(() => {
        if (!tokenAddressParam || !chainIdParam) {
            resetHomepageState()
        }
    }, [tokenAddressParam, chainIdParam])

    useEffect(() => {
        if (!isWalletConnected) {
            resetHomepageState()
        }
    }, [isWalletConnected])

    // Set showOpportunitiesTable to true when token is selected
    useEffect(() => {
        if (!!selectedToken) {
            setShowOpportunitiesTable(true)
        }
    }, [!!selectedToken, selectedToken?.address])

    const handlePositionTypeToggle = (type: TPositionType) => {
        setPositionType(type)
    }

    function handleSelectToken(token: any) {
        setSelectedToken(token)
        updateSearchParams({
            token_address: token.address,
            chain_id: token.chain_id,
        })
        setOpenSelectTokenDialog(false)
    }

    const positionsByChain = portfolioData.platforms.flatMap((platform: any) => ({
        positions: platform.positions.filter((position: any) => position.type === positionType),
        chain_id: platform.chain_id,
        chain_logo: allChainsData.find((chain: any) => Number(chain.chain_id) === Number(platform.chain_id))?.logo,
        chain_name: allChainsData.find((chain: any) => Number(chain.chain_id) === Number(platform.chain_id))?.name,
        platform_name: platform.platform_name,
        opportunities: platform.opportunities,
    }))

    const tokensList = positionsByChain
        .flatMap((positionParent: any) => positionParent.positions.map((position: any) => ({
            ...position.token,
            amount: position.amount,
            chain_id: positionParent.chain_id,
            chain_logo: positionParent.chain_logo,
            chain_name: positionParent.chain_name,
        })))
        .reduce((acc: any[], curr: any) => {
            const existingToken = acc.find(token => token.symbol === curr.symbol);
            if (existingToken) {
                existingToken.amount += curr.amount;
                return acc;
            }
            return [...acc, curr];
        }, []);

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
        <MainContainer>
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                <div className="w-full max-w-[300px]">
                    <LendBorrowToggle
                        type={positionType}
                        handleToggle={handlePositionTypeToggle}
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
                            opportunitiesData={isWalletConnected ? filteredOpportunitiesData : []}
                            positionType={positionType}
                            showOpportunitiesTable={showOpportunitiesTable}
                            setShowOpportunitiesTable={setShowOpportunitiesTable}
                            isLoading={isLoadingOpportunitiesData}
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
                    tokens={tokensList}
                    onSelectToken={handleSelectToken}
                    isLoading={isLoadingPortfolioData || isConnectingWallet}
                />
            </div>
        </MainContainer>
    )
}
