import {
  GenerateUserAddressParams,
  generateUserAddress,
} from "@/server/actions/generateUserAddress";
import { getKernelAddressFromECDSA } from "@zerodev/ecdsa-validator";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { isAddress } from "viem";
import { publicClient } from "./chain";

export const getUserGeneratedAddress = async (
  params: GenerateUserAddressParams,
  index = 0,
) => {
  const { signerAddress } = await generateUserAddress(params);

  if (!signerAddress || !isAddress(signerAddress)) {
    throw new Error("Failed to pregenerate address");
  }

  return getKernelAddressFromECDSA({
    eoaAddress: signerAddress,
    index: BigInt(index),
    entryPointAddress: ENTRYPOINT_ADDRESS_V07,
    publicClient: publicClient,
  });
};
