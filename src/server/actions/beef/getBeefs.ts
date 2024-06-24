"use server"

import { BeefSortType } from "@/components/BeefSortDropdown"
import { db } from "@/server/db/db"
import { Beef } from "@/types"
import { activeChain } from "@/utils/chain"

export const getBeefsAction = async (
  limit: number,
  offset: number,
  { orderDirection, orderBy }: BeefSortType,
): Promise<Beef[]> => {
  const beefs = await db.query.Beefs.findMany({
    where: (Beefs, { eq }) => eq(Beefs.chainId, activeChain.id),
    orderBy: (Beefs, { asc, desc }) => {
      const orderFn = orderDirection === "asc" ? asc : desc
      const column = orderBy === "createdAt" ? Beefs.createdAt : Beefs.wager

      return orderFn(column)
    },
    limit,
    offset,
  }).execute()

  return beefs
}
