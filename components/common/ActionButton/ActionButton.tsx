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

interface IActionButtonSelectComponent {
  disabled?: boolean
  asset: any
  amount: string
  handleCloseModal: (isVisible: boolean) => void
  positionType: "lend" | "borrow"
}

const ActionButton = ({
  disabled = false,
  asset,
  amount,
  handleCloseModal,
  positionType
}: IActionButtonSelectComponent) => {
  // const { selectedAction } = useContext(ActionContext)
  if (positionType === "borrow") {
    return (
      <BorrowButton
        disabled={disabled}
        handleCloseModal={handleCloseModal}
        asset={asset}
        amount={amount}
      />
    )
  }
  if (
    asset.platform.platform_type.includes(PlatformType.AAVE) &&
    positionType === "lend"
  ) {
    return (
      <SupplyAaveButton
        disabled={disabled}
        handleCloseModal={handleCloseModal}
        poolContractAddress={POOL_AAVE_MAP[asset.platform as PlatformValue]}
        underlyingAssetAdress={asset.asset}
        amount={amount}
        decimals={asset.decimals}
      />
    )
  }
  if (
    // asset.platform === PlatformValue.CompoundV2Ethereum &&
    asset.platform.platform_type.includes(PlatformType.COMPOUND) &&
    asset.symbol === 'cETH'
  ) {
    return (
      <SupplyETHCompoundButton
        disabled={disabled}
        handleCloseModal={handleCloseModal}
        cTokenAddress={asset.tokenId}
        amount={amount}
        decimals={countCompoundDecimals(
          asset.decimals,
          asset.underlyingDecimals
        )}
      />
    )
  }
  return (
    <SupplyERC20CompoundButton
      disabled={disabled}
      handleCloseModal={handleCloseModal}
      underlyingToken={asset.underlyingAsset}
      cTokenAddress={asset.tokenId}
      amount={amount}
      decimals={countCompoundDecimals(asset.decimals, asset.underlyingDecimals)}
    />
  )
}

export default ActionButton
