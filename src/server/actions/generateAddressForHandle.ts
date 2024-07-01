"use server"

import { generatePrivateKey, privateKeyToAddress } from "viem/accounts"
import { normalizeHandle } from "@/server/actions/lib/general"
import { getLightAccountAddress } from "@/server/actions/lib/lightAccount"
import { db, schema } from "@/server/db/db"
import { activeChain } from "@/utils/chain"

export const generateAddressForHandle = async (xHandle: string) => {
  const normalizedHandle = normalizeHandle(xHandle)

  const userDetails = await db.query.userDetails.findFirst({
    where: (userDetails, { eq, and }) =>
      and(eq(userDetails.xHandle, normalizedHandle), eq(userDetails.chainId, activeChain.id)),
    columns: { smartAccountAddress: true },
  })

  if (userDetails !== undefined) {
    // Already generated
    return userDetails.smartAccountAddress
  }

  const privateKey = generatePrivateKey()
  const signerAddress = privateKeyToAddress(privateKey)
  const accountAddress = await getLightAccountAddress([signerAddress, 0n])

  await db
    .insert(schema.userDetails)
    .values({
      xHandle: normalizedHandle,
      temporaryPrivateKey: privateKey,
      smartAccountAddress: accountAddress,
      chainId: activeChain.id,
    })
    .execute()

  return accountAddress
}
