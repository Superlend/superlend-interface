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

export default function HomePageComponents() {
    const { isConnectingWallet } = useWalletConnection()
    const [positionType, setPositionType] = useState<TPositionType>('lend');
    const { portfolioData, isLoadingPortfolioData } = usePortfolioDataContext()
    const { allChainsData } = useAssetsDataContext()
    const [openSelectTokenDialog, setOpenSelectTokenDialog] = useState(false)
    const [selectedToken, setSelectedToken] = useState<any>(null)
    const [showOpportunitiesTable, setShowOpportunitiesTable] = useState(false)
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionType as TPositionType,
            chain_ids: [Number(selectedToken?.chain_id)],
            tokens: [selectedToken?.symbol],
            enabled: !!selectedToken,
        })

    const handlePositionTypeToggle = (type: TPositionType) => {
        setPositionType(type)
    }

    function handleSelectToken(token: any) {
        setSelectedToken(token)
        setShowOpportunitiesTable(false)
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

    const tokensList = positionsByChain.flatMap((positionParent: any) => positionParent.positions.map((position: any) => {
        return {
            ...position.token,
            amount: position.amount,
            chain_id: positionParent.chain_id,
            chain_logo: positionParent.chain_logo,
            chain_name: positionParent.chain_name,
        }
    }))

    return (
        <MainContainer>
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                <div className="w-full max-w-[300px]">
                    <LendBorrowToggle
                        type={positionType}
                        handleToggle={handlePositionTypeToggle}
                    />
                </div>
                <TokenRates />
                <div className="flex flex-col lg:flex-row xl:items-start justify-center gap-2 mt-8 transition-all duration-300 max-w-full w-full md:overflow-hidden">
                    <motion.div
                        animate={{ x: showOpportunitiesTable ? 0 : 'auto' }}
                        transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.2 }}
                        className="flex items-center justify-center"
                    >
                        <SelectTokeWidget
                            setOpenSelectTokenDialog={setOpenSelectTokenDialog}
                            selectedToken={selectedToken}
                            opportunitiesData={opportunitiesData}
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
                                animate={{ x: 0, opacity: 1, width: 'auto' }}
                                exit={{ x: 1400, opacity: 0, width: 0 }}
                                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.3 }}
                                className="w-full lg:max-w-[500px] xl:max-w-[600px]"
                            >
                                <Opportunities
                                    positionType={positionType}
                                    opportunitiesData={opportunitiesData}
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
                    // networks={networks}
                    tokens={tokensList}
                    onSelectToken={handleSelectToken}
                    isLoading={isLoadingPortfolioData || isConnectingWallet}
                />
            </div>
        </MainContainer>
    )
}
