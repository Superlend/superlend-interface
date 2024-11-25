import { useAccount, useWriteContract } from 'wagmi'
// import { Action } from '../../../types/assetsTable'
// import { getActionName } from '@utils/getActionName'
// import CustomButton from '@components/ui/CustomButton'
import COMPOUND_ABI from '@/data/abi/compoundABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
import { useCallback } from 'react'
// import { AddressType } from '../../../types/address'
// import { IAssetData } from '@interfaces/IAssetData'
import {
  CONFIRM_ACTION_IN_WALLET_TEXT,
  ERROR_TOAST_ICON_STYLES,
  POOL_AAVE_MAP,
  // POOL_AAVE_MAP,
  SOMETHING_WENT_WRONG_MESSAGE,
  SUCCESS_MESSAGE,
} from '../../../constants'
import { parseUnits } from 'ethers'
// import toast from 'react-hot-toast'
// import { getErrorText } from '@utils/getErrorText'
import { countCompoundDecimals } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
import { useActiveAccount } from 'thirdweb/react'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface IBorrowButtonProps {
  disabled: boolean
  asset: any
  amount: string
  handleCloseModal: (isVisible: boolean) => void
}

const BorrowButton = ({
  disabled,
  asset,
  amount,
  handleCloseModal,
}: IBorrowButtonProps) => {
  const { writeContractAsync, isPending } = useWriteContract()
  // const { address: walletAddress } = useAccount()
  // const { createToast } = useCreatePendingToast()
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address;
  const borrowCompound = useCallback(
    async (cTokenAddress: string, amount: string) => {
      try {
        // handleCloseModal(false)
        // await toast.promise(
        //   writeContractAsync({
        //     address: cTokenAddress,
        //     abi: COMPOUND_ABI,
        //     functionName: 'borrow',
        //     args: [
        //       parseUnits(
        //         amount,
        //         countCompoundDecimals(asset.decimals, asset.underlyingDecimals)
        //       ),
        //     ],
        //   }),
        //   {
        //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
        //     success: SUCCESS_MESSAGE,
        //     error: (error: { message: string }) => {
        //       if (error && error.message) {
        //         return getErrorText(error)
        //       }
        //       return SOMETHING_WENT_WRONG_MESSAGE
        //     },
        //   },
        //   ERROR_TOAST_ICON_STYLES
        // )
        // toast.remove()

        writeContractAsync({
          address: cTokenAddress,
          abi: COMPOUND_ABI,
          functionName: 'borrow',
          args: [
            parseUnits(
              amount,
              // countCompoundDecimals(asset.decimals, asset.underlyingDecimals)
              countCompoundDecimals(asset.decimals, asset.decimals)
            ),
          ],
        })
      } catch (error) {
        // toast.remove()
        error
      }
    },
    [writeContractAsync, asset, handleCloseModal]
  )

  const borrowAave = useCallback(
    async (
      poolContractAddress: string,
      underlyingAssetAdress: string,
      amount: string,
      addressOfWallet: string
    ) => {
      try {
        // handleCloseModal(false)
        // await toast.promise(
        //   writeContractAsync({
        //     address: poolContractAddress,
        //     abi: AAVE_POOL_ABI,
        //     functionName: 'borrow',
        //     args: [
        //       underlyingAssetAdress,
        //       parseUnits(amount, asset.decimals),
        //       2,
        //       0,
        //       addressOfWallet,
        //     ],
        //   }),
        //   {
        //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
        //     success: SUCCESS_MESSAGE,
        //     error: (error: { message: string }) => {
        //       if (error && error.message) {
        //         return getErrorText(error)
        //       }
        //       return SOMETHING_WENT_WRONG_MESSAGE
        //     },
        //   },
        //   ERROR_TOAST_ICON_STYLES
        // )
        // toast.remove()

        writeContractAsync({
          address: poolContractAddress,
          abi: AAVE_POOL_ABI,
          functionName: 'borrow',
          args: [
            underlyingAssetAdress,
            parseUnits(amount, asset.decimals),
            2,
            0,
            addressOfWallet,
          ],
        })
      } catch (error) {
        // toast.remove()
        error
      }
    },
    [writeContractAsync, asset, handleCloseModal]
  )

  const onBorrow = async () => {
    // createToast()
    if (asset?.platform?.platform_type === PlatformType.COMPOUND) {
      await borrowCompound(asset?.asset?.token?.address, amount)
      return
    }
    if (asset?.platform?.platform_type === PlatformType.AAVE) {
      await borrowAave(
        POOL_AAVE_MAP[asset.platform.platform_name as PlatformValue],
        // asset?.asset?.token?.address,
        asset?.asset?.token?.address,
        amount,
        walletAddress as string
      )
      return
    }
  }
  return (
    <Button variant="primary" disabled={isPending || disabled} onClick={() => onBorrow()}>
      {/* {getActionName(Action.BORROW)} */}
      Borrow
    </Button>
  )
}

export default BorrowButton
