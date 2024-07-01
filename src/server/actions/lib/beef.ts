import { Address } from "viem"
import { beefAbi } from "@/abi/beef"
import { MULTICALL_CONTRACT_ADDRESS } from "@/constants"
import { serverPublicClient } from "@/server/actions/lib/serverPublicClient"
import { ArbiterType } from "@/types"

export const getBeefContractInfo = (address: Address) =>
  serverPublicClient.readContract({
    address,
    abi: beefAbi,
    functionName: "getInfo",
  })

export const getArbiterStatuses = async (arbiters: readonly Address[], beefAddress: Address) => {
  const contractCalls = arbiters.flatMap(
    (arbiter) =>
      [
        {
          abi: beefAbi,
          address: beefAddress,
          functionName: "hasAttended",
          args: [arbiter],
        },
        {
          abi: beefAbi,
          address: beefAddress,
          functionName: "hasSettled",
          args: [arbiter],
        },
      ] as const,
  )

  const callResults = await serverPublicClient.multicall({
    allowFailure: false,
    contracts: contractCalls,
    multicallAddress: MULTICALL_CONTRACT_ADDRESS,
  })

  if (callResults.length !== arbiters.length * 2) {
    throw new Error(`Failed to get arbiter statuses for ${beefAddress}`)
  }

  const resultArbiters: ArbiterType[] = arbiters.map((address, index) => {
    // 2 result entries per arbiter
    const indexStart = index * 2

    const attended = callResults[indexStart] as boolean
    const settle = callResults[indexStart + 1] as bigint

    return {
      address,
      status: !attended ? "none" : settle == 1n ? "voted_yes" : settle === 2n ? "voted_no" : "attended",
    }
  })

  return resultArbiters
}
