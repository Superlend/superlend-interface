// import CustomButton from '@components/ui/CustomButton'
// import { getActionName } from '@utils/getActionName'
// import { Action } from '../../../types/assetsTable'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useEffect, useState } from 'react'
// import { AddressType } from '../../../types/address'
import COMPOUND_ABI from '@/data/abi/compoundABIerc20.json'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
import {
  APPROVE_MESSAGE,
  CONFIRM_ACTION_IN_WALLET_TEXT,
  ERROR_TOAST_ICON_STYLES,
  SOMETHING_WENT_WRONG_MESSAGE,
  SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
// import { getErrorText } from '@utils/getErrorText'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface ISupplyERC20CompoundButtonProps {
  underlyingToken: string
  cTokenAddress: string
  amount: string
  decimals: number
  handleCloseModal: (isVisible: boolean) => void
  disabled: boolean
}

const SupplyERC20CompoundButton = ({
  underlyingToken,
  cTokenAddress,
  amount,
  decimals,
  disabled,
  handleCloseModal,
}: ISupplyERC20CompoundButtonProps) => {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const [lastTx, setLastTx] = useState<'mint' | 'approve'>('mint')
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })
  // const { createToast } = useCreatePendingToast()

  useEffect(() => {
    const supply = async () => {
      try {
        setLastTx('approve')
        // handleCloseModal(false)
        // await toast.promise(
        //   writeContractAsync({
        //     address: cTokenAddress,
        //     abi: COMPOUND_ABI,
        //     functionName: 'mint',
        //     args: [parseUnits(amount, decimals)],
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
          functionName: 'mint',
          args: [parseUnits(amount, decimals)],
        })
      } catch (error) {
        // toast.remove()
        error
      }
    }
    if (isSuccess && lastTx === 'mint') {
      void supply()
    }
  }, [
    isSuccess,
    amount,
    cTokenAddress,
    writeContractAsync,
    lastTx,
    decimals,
    handleCloseModal,
  ])

  const onApproveSupply = async () => {
    try {
      // createToast()
      setLastTx('mint')
      // await toast.promise(
      //   writeContractAsync({
      //     address: underlyingToken,
      //     abi: COMPOUND_ABI,
      //     functionName: 'approve',
      //     args: [cTokenAddress, parseUnits(amount, decimals)],
      //   }),
      //   {
      //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
      //     success: APPROVE_MESSAGE,
      //     error: (error: { message: string }) => {
      //       if (error && error.message) {
      //         return getErrorText(error)
      //       }
      //       return SOMETHING_WENT_WRONG_MESSAGE
      //     },
      //   },
      //   ERROR_TOAST_ICON_STYLES
      // )

      writeContractAsync({
        address: underlyingToken,
        abi: COMPOUND_ABI,
        functionName: 'approve',
        args: [cTokenAddress, parseUnits(amount, decimals)],
      })
    } catch (error) {
      // toast.remove()
      error
    }
  }
  return (
    <Button
      disabled={isPending || isLoading || disabled}
      onClick={() => onApproveSupply()}
    >
      {/* {getActionName(Action.LEND)} */}
      Lend
    </Button>
  )
}

export default SupplyERC20CompoundButton
