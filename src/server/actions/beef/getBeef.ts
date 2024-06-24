"use server"

import { Address } from "viem"
import { db } from "@/server/db/db"
import { Beef } from "@/types"
import { activeChain } from "@/utils/chain"

export const getBeefAction = async (address: Address): Promise<Beef | null> => {
  const beef = await db.query.Beefs.findFirst({
    where: (beef, { eq, and }) =>
      and(eq(beef.chainId, activeChain.id), eq(beef.address, address.toLowerCase() as Address)),
  })

  return beef ?? null
}
