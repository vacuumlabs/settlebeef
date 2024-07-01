import { getContract } from "viem"
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory"
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants"
import { serverPublicClient } from "@/server/actions/lib/serverPublicClient"

export const getLightAccountAddress = getContract({
  client: serverPublicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress
