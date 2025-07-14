// import { IAssetData } from '@interfaces/IAssetData'
import { useContext } from 'react'
// import { Action } from '../../../types/assetsTable'
import BorrowButton from '../BorrowButton'
// import { ActionContext } from '@contexts/actionContext'
import SupplyAaveButton from '../SupplyAaveButton'
// import { POOL_AAVE_MAP } from '../../../constants'
import { PlatformType, PlatformValue } from '../../../types/platform'
import SupplyETHCompoundButton from '../SupplyETHCompoundButton'
import SupplyERC20CompoundButton from '../SupplyERC20CompoundButton'
import { countCompoundDecimals } from '@/lib/utils'
import WithdrawButton from '../WithdrawButton'
// import { POOL_AAVE_MAP } from '@/constants'
import { BigNumber } from 'ethers'
import SupplyMorphoButton from '../SupplyMorphoButton'
import { CodeSquare } from 'lucide-react'
import { TPositionType, TScAmount, TActionType } from '@/types'
import RepayButton from '../RepayButton'
import SupplyFluidButton from '../SupplyFluidButton'
import LoopButton from '../LoopButton'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: TScAmount
    handleCloseModal: (isVisible: boolean) => void
    actionType: TActionType
    setActionType?: (actionType: TPositionType) => void
    ctaText?: string | null
    isLoading?: boolean
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    actionType,
    setActionType,
    ctaText,
    isLoading,
}: IActionButtonSelectComponent) => {
    if (actionType === 'borrow') {
        return (
            <BorrowButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                assetDetails={asset}
                amount={amount}
            />
        )
    }
    if (actionType === 'repay') {
        return (
            <RepayButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                poolContractAddress={asset.core_contract}
                underlyingAssetAdress={asset.asset.token.address}
                assetDetails={asset}
                amount={amount}
                decimals={asset.asset.token.decimals}
            />
        )
    }
    if (actionType === 'withdraw') {
        return (
            <WithdrawButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                assetDetails={asset}
                amount={amount}
            />
        )
    }
    if (asset.protocol_type === PlatformType.AAVE) {
        if (actionType === 'lend') {
            return (
                <SupplyAaveButton
                    disabled={disabled}
                    handleCloseModal={handleCloseModal}
                    poolContractAddress={asset.core_contract}
                    underlyingAssetAdress={asset.asset.token.address}
                    amount={amount}
                    decimals={asset.asset.token.decimals}
                    assetDetails={asset}
                />
            )
        }
        if (actionType === 'loop') {
            console.log('ActionButton passing asset details to LoopButton:', {
                pathTokens: asset.pathTokens,
                pathFees: asset.pathFees,
                hasPathTokens: Array.isArray(asset.pathTokens),
                hasPathFees: Array.isArray(asset.pathFees),
                pathTokensLength: asset.pathTokens?.length,
                pathFeesLength: asset.pathFees?.length
            })
            return (
                <LoopButton
                    disabled={disabled}
                    handleCloseModal={handleCloseModal}
                    poolContractAddress={asset.core_contract}
                    underlyingAssetAdress={asset?.asset?.token.address || asset.supplyAsset.token.address}
                    amount={amount}
                    decimals={asset?.asset?.token.decimals || asset.supplyAsset.token.decimals}
                    assetDetails={asset}
                    ctaText={ctaText}
                    isLoading={isLoading}
                />
            )
        }
    }
    // if (
    //     asset.protocol_type === PlatformType.COMPOUND &&
    //     asset.asset.token.symbol === 'cETH'
    // ) {
    //     return (
    //         <SupplyETHCompoundButton
    //             disabled={disabled}
    //             handleCloseModal={handleCloseModal}
    //             cTokenAddress={asset.core_contract}
    //             amount={amount}
    //             decimals={countCompoundDecimals(
    //                 asset.asset.token.decimals,
    //                 asset.asset.token.decimals
    //             )}
    //         />
    //     )
    // }
    if (asset.protocol_type === PlatformType.MORPHO && actionType === 'lend') {
        return (
            <SupplyMorphoButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                assetDetails={asset}
                amount={amount}
                setActionType={setActionType}
            />
        )
    }
    if (asset.protocol_type === PlatformType.FLUID && actionType === 'lend') {
        return (
            <SupplyFluidButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                poolContractAddress={asset.core_contract}
                underlyingAssetAdress={asset.asset.token.address}
                amount={amount}
                decimals={asset.asset.token.decimals}
                assetDetails={asset}
                setActionType={setActionType}
            />
        )
    }
    return null
}

export default ActionButton
