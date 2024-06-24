"use server"

import { getContract } from "viem"
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts"
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory"
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants"
import { db, schema } from "@/server/db/db"
import { activeChain, publicClient } from "@/utils/chain"

const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress

export const generateAddressForHandle = async (xHandle: string) => {
  const userDetails = await db.query.userDetails.findFirst({
    where: (userDetails, { eq, and }) => and(eq(userDetails.xHandle, xHandle), eq(userDetails.chainId, activeChain.id)),
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
      xHandle,
      temporaryPrivateKey: privateKey,
      smartAccountAddress: accountAddress,
      chainId: activeChain.id,
    })
    .execute()

  return accountAddress
}
