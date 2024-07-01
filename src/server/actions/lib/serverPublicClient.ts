// eslint-disable-next-line import/no-unresolved
import "server-only"
import { createPublicClient, http } from "viem"
import { activeChain, useTestChain } from "@/utils/chain"

const serverAlchemyKey = process.env.ALCHEMY_API_KEY || ""

const alchemyApiUrl = useTestChain
  ? `https://base-sepolia.g.alchemy.com/v2/${serverAlchemyKey}`
  : `https://base-mainnet.g.alchemy.com/v2/${serverAlchemyKey}`

export const serverPublicClient = createPublicClient({
  transport: http(alchemyApiUrl),
  chain: activeChain,
})
