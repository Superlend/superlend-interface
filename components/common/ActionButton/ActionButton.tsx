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
import { BigNumber } from 'ethers'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    actionType: 'lend' | 'borrow' | 'repay' | 'withdraw'
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    actionType,
}: IActionButtonSelectComponent) => {
    if (actionType === 'borrow') {
        return (
            <BorrowButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
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
                />
            )
        }
    }
    if (
        asset.protocol_type === PlatformType.COMPOUND &&
        asset.asset.token.symbol === 'cETH'
    ) {
        return (
            <SupplyETHCompoundButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                cTokenAddress={asset.core_contract}
                amount={amount}
                decimals={countCompoundDecimals(
                    asset.asset.token.decimals,
                    asset.asset.token.decimals
                )}
            />
        )
    }
    return (
        <SupplyERC20CompoundButton
            disabled={disabled}
            handleCloseModal={handleCloseModal}
            underlyingToken={asset.asset.token.address}
            cTokenAddress={asset.core_contract}
            amount={amount}
            decimals={countCompoundDecimals(
                asset.asset.token.decimals,
                asset.asset.token.decimals
            )}
        />
    )
}

export default ActionButton
