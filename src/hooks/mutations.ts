import { useContext } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { enqueueSnackbar } from "notistack"
import { Address, encodeFunctionData, erc20Abi, formatEther, isAddress } from "viem"
import { readContracts } from "wagmi/actions"
import { beefAbi } from "@/abi/beef"
import { quoterAbi } from "@/abi/quoterAbi"
import { slaughterhouseAbi } from "@/abi/slaughterhouse"
import { NewBeefFormValues } from "@/app/beef/new/page"
import { wagmiConfig } from "@/components/providers/Providers"
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext"
import { QUOTER_ADDRESS, SLAUGHTERHOUSE_ADDRESS, STAKING_POOL_FEE, WETH_ADDRESS, WSTETH_ADDRESS } from "@/constants"
import { useBalance, useBeef } from "@/hooks/queries"
import { BeefApi } from "@/server/actions/beef/beefApi"
import { generateAddressForEmail } from "@/server/actions/generateAddressForEmail"
import { generateAddressForFarcaster } from "@/server/actions/generateAddressForFarcaster"
import { generateAddressForHandle } from "@/server/actions/generateAddressForHandle"
import { sendBeefRequestEmail } from "@/server/actions/sendBeefRequestEmail"
import { ArbiterAccount } from "@/types"
import { publicClient } from "@/utils/chain"
import { parseIsoDateToTimestamp } from "@/utils/general"
import { subtractSlippage } from "@/utils/slippage"
import { queryKeys } from "./queryKeys"

const mutationKeys = {
  arbiterAttend: "arbiterAttend",
  withdrawBeef: "withdrawBeef",
  settleBeef: "settleBeef",
  joinBeef: "joinBeef",
}

export const useArbiterAttend = (beefId: Address) => {
  const { sendTransaction, connectedAddress } = useContext(SmartAccountClientContext)
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [mutationKeys.arbiterAttend, connectedAddress, beefId],
    mutationFn: async () => {
      const { transactionHash } = await sendTransaction({
        to: beefId,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "arbiterAttend",
          args: [],
        }),
      })

      await BeefApi.refreshArbiters(beefId)

      return transactionHash
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] })
    },
  })
}

export const useSettleBeef = (beefId: Address) => {
  const { sendTransaction, connectedAddress } = useContext(SmartAccountClientContext)
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [mutationKeys.settleBeef, beefId, connectedAddress],
    mutationFn: async (verdict: boolean) => {
      const { transactionHash } = await sendTransaction({
        to: beefId,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "settleBeef",
          args: [verdict],
        }),
      })

      await BeefApi.refreshArbiters(beefId)

      return transactionHash
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] })
    },
  })
}

export const useJoinBeef = (beefId: Address) => {
  const { sendTransaction } = useContext(SmartAccountClientContext)
  const { data: balance } = useBalance()
  const { data: beef } = useBeef(beefId)

  const queryClient = useQueryClient()

  const joinBeef = async () => {
    const { wager, staking } = beef!

    if (balance === undefined) {
      throw new Error("Could not get balance")
    }

    if (balance < wager) {
      enqueueSnackbar(`Not enough funds to join beef! ${formatEther(wager)} ETH needed!`, { variant: "error" })
      return
    }

    const amountOut = staking ? await getAmountOut(wager, WETH_ADDRESS, WSTETH_ADDRESS) : 0n

    const { transactionHash } = await sendTransaction({
      to: beefId,
      value: wager,
      data: encodeFunctionData({
        abi: beefAbi,
        functionName: "joinBeef",
        args: [amountOut],
      }),
    })

    await BeefApi.refreshBeefState(beefId)

    return transactionHash
  }

  return useMutation({
    mutationKey: [mutationKeys.joinBeef, beefId],
    mutationFn: joinBeef,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] })
    },
  })
}

export const useAddBeef = () => {
  const { sendTransaction, connectedAddress } = useContext(SmartAccountClientContext)
  const queryClient = useQueryClient()

  const addBeef = async ({
    arbiters,
    title,
    description,
    wager,
    settleStart,
    joinDeadline,
    challenger,
    staking,
  }: NewBeefFormValues) => {
    if (!connectedAddress) {
      throw new Error("Wallet not connected")
    }
    if (!challenger || !isAddress(challenger.value) || !wager) {
      throw new Error("Invalid request")
    }

    arbiters.forEach((arbiter) => {
      if (arbiter.type === ArbiterAccount.EMAIL) {
        void sendBeefRequestEmail(arbiter.value)
      }
    })

    const addressPromises = arbiters.map(({ type, value }) => {
      if (type === ArbiterAccount.TWITTER) {
        return generateAddressForHandle(value)
      } else if (type === ArbiterAccount.EMAIL) {
        return generateAddressForEmail(value)
      } else if (type === ArbiterAccount.FARCASTER) {
        return generateAddressForFarcaster(value)
      } else {
        return value as Address
      }
    })

    const arbitersAddresses = await Promise.all(addressPromises)

    const amountOut = staking ? await getAmountOut(wager, WETH_ADDRESS, WSTETH_ADDRESS) : 0n

    const { blockHash, transactionHash } = await sendTransaction({
      to: SLAUGHTERHOUSE_ADDRESS,
      value: wager,
      data: encodeFunctionData({
        abi: slaughterhouseAbi,
        functionName: "packageBeef",
        args: [
          {
            owner: connectedAddress,
            wager,
            challenger: challenger.value,
            settleStart: parseIsoDateToTimestamp(settleStart),
            joinDeadline: parseIsoDateToTimestamp(joinDeadline),
            title,
            description,
            arbiters: arbitersAddresses,
            staking,
          },
          amountOut,
        ],
      }),
    })

    const [beefPackagedEvent] = await publicClient.getContractEvents({
      blockHash,
      address: SLAUGHTERHOUSE_ADDRESS,
      abi: slaughterhouseAbi,
      eventName: "BeefPackaged",
    })

    const beefAddress = beefPackagedEvent!.args.beef!

    await BeefApi.addBeef(beefAddress)

    return transactionHash
  }

  return useMutation({
    mutationFn: addBeef,
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] })

      void queryClient.invalidateQueries({
        queryKey: [queryKeys.infiniteBeefs],
      })
    },
  })
}

const getWithdrawAmountOut = async (beefAddress: Address) => {
  const [wstEthBalance, staking] = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: [
      {
        abi: erc20Abi,
        address: WSTETH_ADDRESS,
        functionName: "balanceOf",
        args: [beefAddress],
      },
      {
        abi: beefAbi,
        address: beefAddress,
        functionName: "staking",
      },
    ],
  })

  const amountOut = staking ? await getAmountOut(wstEthBalance, WSTETH_ADDRESS, WETH_ADDRESS) : 0n

  return amountOut
}

export const useWithdrawBeef = (beefId: Address, withdrawType: "withdrawRaw" | "withdrawRotten" | "serveBeef") => {
  const { sendTransaction } = useContext(SmartAccountClientContext)
  const queryClient = useQueryClient()

  const executeMutation = async () => {
    const amountOut = await getWithdrawAmountOut(beefId)

    const { transactionHash } = await sendTransaction({
      to: beefId,
      data: encodeFunctionData({
        abi: beefAbi,
        functionName: withdrawType,
        args: [amountOut],
      }),
    })

    await BeefApi.refreshBeefState(beefId)

    return transactionHash
  }

  return useMutation({
    mutationFn: executeMutation,
    mutationKey: [beefId, withdrawType],
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] })
    },
  })
}

const getAmountOut = async (amountIn: bigint, tokenIn: Address, tokenOut: Address) => {
  const { result } = await publicClient.simulateContract({
    address: QUOTER_ADDRESS,
    abi: quoterAbi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee: STAKING_POOL_FEE,
        amountIn,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })

  return subtractSlippage(result[0])
}
