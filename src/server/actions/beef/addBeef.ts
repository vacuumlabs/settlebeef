"use server"

import { Address } from "viem"
import { beefAbi } from "@/abi/beef"
import { getArbiterStatuses, getBeefContractInfo } from "@/server/actions/lib/beef"
import { serverPublicClient } from "@/server/actions/lib/serverPublicClient"
import { db, schema } from "@/server/db/db"
import { ArbiterType, Beef } from "@/types"
import { activeChain } from "@/utils/chain"

export const addBeefAction = async (address: Address) => {
  const { params, beefGone, cooking, attendCount, resultYes, resultNo } = await getBeefContractInfo(address)

  const { title, owner, challenger, description, joinDeadline, settleStart, staking, wager } = params

  const [beefCreatedEvent] = await serverPublicClient.getContractEvents({
    address,
    abi: beefAbi,
    fromBlock: 0n,
    eventName: "BeefCreated",
    args: { challenger, owner },
  })

  if (beefCreatedEvent === undefined) {
    throw new Error(`Failed to get BeefCreated event for ${address}`)
  }

  const blockHash = beefCreatedEvent.blockHash

  const { timestamp } = await serverPublicClient.getBlock({ blockHash })

  const arbiters = await getArbiters(params.arbiters, resultYes, resultNo, attendCount, address)

  const beef: Beef = {
    title,
    owner,
    challenger,
    description,
    joinDeadline,
    settleStart,
    staking,
    wager,
    arbiters,
    address,
    beefGone,
    isCooking: cooking,
    createdAt: timestamp,
  }

  await db
    .insert(schema.Beefs)
    .values({ ...beef, chainId: activeChain.id })
    .execute()

  return true
}

const getArbiters = async (
  arbiters: readonly Address[],
  resultYes: bigint,
  resultNo: bigint,
  attendCount: bigint,
  beefAddress: Address,
): Promise<ArbiterType[]> => {
  // Case where we know the status of all arbiters
  if (attendCount === 0n || (Number(attendCount) === arbiters.length && resultYes === 0n && resultNo === 0n)) {
    const status = attendCount === 0n ? "none" : "attended"

    return arbiters.map((address) => ({ address, status }))
  }

  const freshArbibers = await getArbiterStatuses(arbiters, beefAddress)

  return freshArbibers
}
