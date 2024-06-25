import { getContract } from "viem"
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory"
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants"
import { publicClient } from "@/utils/chain"

export const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress
