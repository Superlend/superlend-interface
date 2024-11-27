import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useConnect,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
// import CustomButton from '@/components/ui/CustomButton'
// import { getActionName } from '@/lib/getActionName'
// import { Action } from '@/types/assetsTable'
// import { AddressType } from '@/types/address'
import { parseUnits } from 'ethers'
// import toast from 'react-hot-toast'
import {
  APPROVE_MESSAGE,
  CONFIRM_ACTION_IN_WALLET_TEXT,
  ERROR_TOAST_ICON_STYLES,
  SOMETHING_WENT_WRONG_MESSAGE,
  SUCCESS_MESSAGE,
} from '@/constants'
// import { getErrorText } from '@/lib/getErrorText'
import { Button } from '@/components/ui/button'
import { prepareContractCall } from 'thirdweb'
import { defineChain } from 'thirdweb'
import { useSearchParams } from 'next/navigation'
// import { useCreatePendingToast } from '@/hooks/useCreatePendingToast'

interface ISupplyAaveButtonProps {
  disabled: boolean
  poolContractAddress: `0x${string}`
  underlyingAssetAdress: `0x${string}`
  amount: string
  decimals: number
  handleCloseModal: (isVisible: boolean) => void
}

const SupplyAaveButton = ({
  poolContractAddress,
  underlyingAssetAdress,
  amount,
  decimals,
  disabled,
  handleCloseModal,
}: ISupplyAaveButtonProps) => {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const [lastTx, setLastTx] = useState<'mint' | 'approve'>('mint')
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })
  const { address: walletAddress } = useAccount()
  // const { createToast } = useCreatePendingToast()
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  const supply = useCallback(async () => {
    try {
      setLastTx('approve')
      // handleCloseModal(false)
      // await toast.promise(
      //   writeContractAsync({
      //     // address: poolContractAddress,
      //     abi: AAVE_POOL_ABI,
      //     functionName: 'supply',
      //     args: [
      //       underlyingAssetAdress,
      //       parseUnits(amount, decimals),
      //       walletAddress,
      //       0,
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
        functionName: 'supply',
        args: [
          underlyingAssetAdress,
          parseUnits(amount, decimals),
          walletAddress,
          0,
        ],
      })

    } catch (error) {
      // toast.remove()
      error
    }
  }, [
    amount,
    poolContractAddress,
    underlyingAssetAdress,
    walletAddress,
    handleCloseModal,
    writeContractAsync,
    decimals,
  ])
  useEffect(() => {
    console.log("isSuccess", isSuccess)
    console.log("lastTx", lastTx)

    if (isSuccess && lastTx === 'mint') {
      void supply()
    }
  }, [isSuccess, lastTx, supply])

  const onApproveSupply = async () => {
    if (!isConnected) {
      // If not connected, prompt connection first
      try {
        const connector = connectors[0] // Usually metamask/injected connector
        await connect({ connector })
        return
      } catch (error) {
        console.error('Connection failed:', error)
        return
      }
    }

    try {
      // createToast()
      setLastTx('mint')
      // await toast.promise(
      //   writeContractAsync({
      //     address: underlyingAssetAdress,
      //     abi: AAVE_APPROVE_ABI,
      //     functionName: 'approve',
      //     args: [
      //       // poolContractAddress,
      //       parseUnits(amount, decimals)],
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
        address: underlyingAssetAdress,
        abi: AAVE_APPROVE_ABI,
        functionName: 'approve',
        args: [
          poolContractAddress,
          parseUnits(amount, decimals)],
      })
      // console.log("underlyingAssetAdress", underlyingAssetAdress)
      // console.log("poolContractAddress", poolContractAddress)
      // console.log("amount", amount)
      // console.log("decimals", decimals)
    } catch (error) {
      // toast.remove()
      error
    }
  }
  return (
    <Button
      disabled={isPending || isLoading || disabled}
      onClick={onApproveSupply}
      className="py-3 rounded-5"
      variant="primary"
    >
      {lastTx === "mint" ? "Approve token" : "Supply"}
    </Button>
  )
}

export default SupplyAaveButton
