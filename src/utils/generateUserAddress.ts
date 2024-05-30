import {
  GenerateUserAddressParams,
  generateUserAddress,
} from "@/server/actions/generateUserAddress";
import { isAddress, getContract } from "viem";
import { publicClient } from "@/utils/chain";
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory";
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants";

const lightAccountFactory = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read;

export const getUserGeneratedAddress = async (
  params: GenerateUserAddressParams,
  index = 0,
) => {
  const { signerAddress } = await generateUserAddress(params);

  if (!signerAddress || !isAddress(signerAddress)) {
    throw new Error("Failed to pregenerate address");
  }

  return lightAccountFactory.getAddress([signerAddress, BigInt(index)]);
};
