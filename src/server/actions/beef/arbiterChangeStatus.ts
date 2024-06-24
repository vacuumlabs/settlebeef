"use server"

import { eq } from "drizzle-orm"
import { and } from "drizzle-orm/sql/expressions/conditions"
import { Address } from "viem"
import { getArbiterStatuses } from "@/server/actions/lib/beef"
import { Beefs, db } from "@/server/db/db"
import { activeChain } from "@/utils/chain"

export const refreshArbiterStatusesAction = async (beefAddress: Address) => {
  const beef = await db.query.Beefs.findFirst({
    where: (Beefs, { eq, and }) => and(eq(Beefs.chainId, activeChain.id), eq(Beefs.address, beefAddress)),
    columns: { arbiters: true },
  }).execute()

  if (beef === undefined) {
    throw new Error(`Beef with address ${beefAddress} does not exist`)
  }

  const arbiterAddresses = beef.arbiters.map(({ address }) => address)

  const newArbiters = await getArbiterStatuses(arbiterAddresses, beefAddress)

  await db
    .update(Beefs)
    .set({ arbiters: newArbiters })
    .where(and(eq(Beefs.chainId, activeChain.id), eq(Beefs.address, beefAddress)))
    .execute()
}
