"use server"

import { Address } from "viem"
import { db } from "@/server/db/db"
import { activeChain } from "@/utils/chain"

export const getAllUserDetailsAction = async (addresses: Address[]) => {
  if (addresses.length === 0) return []

  const lowerAddresses = addresses.map((address) => address.toLowerCase())

  const details = await db.query.userDetails.findMany({
    columns: {
      xHandle: true,
      farcasterId: true,
      email: true,
      smartAccountAddress: true,
    },
    where: (userDetails, { and, eq, inArray, sql }) =>
      and(
        eq(userDetails.chainId, activeChain.id),
        inArray(sql`lower(${userDetails.smartAccountAddress})`, lowerAddresses),
      ),
  })

  return details
}
