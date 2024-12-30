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
import { POOL_AAVE_MAP } from '@/constants'
import { BigNumber } from 'ethers'
import SupplyMorphoButton from '../SupplyMorphoButton'
import { CodeSquare } from 'lucide-react'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    positionType: 'lend' | 'borrow'
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    positionType,
}: IActionButtonSelectComponent) => {

    if (positionType === 'borrow') {
        return (
            <BorrowButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
                amount={amount}
            />
        )
    }
    if (asset.protocol_type === PlatformType.AAVE && positionType === 'lend') {
        // console.log('platform_name', asset.platform_name);
        // console.log('tokenAddress', asset.asset.token.address);
        // console.log('amount', amount);
        // console.log('decimals', asset.asset.token.decimals);

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

    if (
        asset.protocol_type === PlatformType.MORPHO &&
        positionType === 'lend'
    ) {
        return (
            <SupplyMorphoButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
                amount={amount}
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
