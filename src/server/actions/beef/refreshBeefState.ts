"use server"

import { eq } from "drizzle-orm"
import { and } from "drizzle-orm/sql/expressions/conditions"
import { Address } from "viem"
import { getBeefContractInfo } from "@/server/actions/lib/beef"
import { Beefs, db } from "@/server/db/db"
import { activeChain } from "@/utils/chain"

export const refreshBeefStateAction = async (beefAddress: Address) => {
  const { cooking, beefGone } = await getBeefContractInfo(beefAddress)

  await db
    .update(Beefs)
    .set({ isCooking: cooking, beefGone })
    .where(and(eq(Beefs.chainId, activeChain.id), eq(Beefs.address, beefAddress)))
    .execute()
}
