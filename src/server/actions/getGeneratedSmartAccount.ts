"use server"

import { LocalAccountSigner } from "@alchemy/aa-core"
import { LinkedAccountWithMetadata, PrivyClient, WalletWithMetadata } from "@privy-io/server-auth"
import { eq, isNotNull, or } from "drizzle-orm"
import { and } from "drizzle-orm/sql/expressions/conditions"
import { cookies } from "next/headers"
import { Address, Hex } from "viem"
import { getLightAccountAddress } from "@/server/actions/lib/lightAccount"
import { db, schema } from "@/server/db/db"
import { activeChain } from "@/utils/chain"
import { createSmartAccountClient } from "@/utils/userOperation"

const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

const isWalletWithMetadata = (account: LinkedAccountWithMetadata): account is WalletWithMetadata =>
  account.type === "wallet" && account.walletClientType === "privy"

export const getGeneratedSmartAccount = async () => {
  const authToken = cookies().get("privy-token")?.value

  if (authToken === undefined) {
    console.error("Auth token not found")
    return undefined
  }

  const claims = await privy.verifyAuthToken(authToken)
  const user = await privy.getUser(claims.userId)

  const embeddedWallet = user.linkedAccounts.find(isWalletWithMetadata)

  if (embeddedWallet === undefined) {
    console.error(`User ${user.id} does not have an embedded wallet`)
    return undefined
  }

  const walletAddress = embeddedWallet.address as Address

  const xHandle = user.twitter?.username ?? undefined
  const email = user.email?.address
  const farcasterId = user.farcaster?.fid?.toString()

  if (xHandle === undefined && email === undefined && farcasterId === undefined) {
    console.error(`User ${user.id} does not have a X / Twitter or Email or Farcaster connected`)

    return undefined
  }

  const userDetails = schema.userDetails

  const userDetailCondition = or(
    xHandle !== undefined ? and(isNotNull(userDetails.xHandle), eq(userDetails.xHandle, xHandle)) : undefined,
    email !== undefined ? and(isNotNull(userDetails.email), eq(userDetails.email, email)) : undefined,
    farcasterId !== undefined
      ? and(isNotNull(userDetails.farcasterId), eq(userDetails.farcasterId, farcasterId))
      : undefined,
  )

  const userDetail = await db.query.userDetails.findFirst({
    where: (userDetails, { eq, and }) => and(eq(userDetails.chainId, activeChain.id), userDetailCondition),
    columns: {
      smartAccountAddress: true,
      temporaryPrivateKey: true,
      owner: true,
    },
  })

  if (userDetail) {
    const { temporaryPrivateKey, smartAccountAddress, owner } = userDetail

    if (owner !== null) {
      // User is already the owner of the account
      return smartAccountAddress
    } else {
      // Transfer the ownership of the account to user
      const signer = LocalAccountSigner.privateKeyToAccountSigner(temporaryPrivateKey as Hex)

      const smartAccountClient = await createSmartAccountClient(signer, smartAccountAddress)

      const transferData = smartAccountClient.account.encodeTransferOwnership(walletAddress)

      await smartAccountClient.sendUserOperation({
        uo: {
          target: smartAccountAddress,
          data: transferData,
        },
      })

      await db
        .update(userDetails)
        .set({
          owner: walletAddress,
          temporaryPrivateKey: null,
        })
        .where(userDetailCondition)
        .execute()

      return smartAccountAddress
    }
  } else {
    // No wallet is pre-generated. We can just create a default one from the embedded wallet's address
    const accountAddress = await getLightAccountAddress([walletAddress, 0n])

    await db
      .insert(userDetails)
      .values({
        xHandle,
        email,
        farcasterId,
        smartAccountAddress: accountAddress,
        owner: walletAddress,
        chainId: activeChain.id,
      })
      .execute()

    return accountAddress
  }
}
