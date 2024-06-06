"use server";

import { sql } from "@vercel/postgres";
import { getContract } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory";
import { UserDetailsResponseType } from "@/app/api/generated-smart-account/route";
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants";
import { activeChain, publicClient } from "@/utils/chain";

const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress;

export const generateAddressForHandle = async (xHandle: string) => {
  const { rows } =
    await sql<UserDetailsResponseType>`SELECT smart_account_address FROM user_details WHERE x_handle = ${xHandle}  AND chain_id = ${activeChain.id}`;

  if (rows[0]) {
    // Already generated
    return rows[0].smart_account_address;
  }

  const privateKey = generatePrivateKey();
  const signerAddress = privateKeyToAddress(privateKey);
  const accountAddress = await getLightAccountAddress([signerAddress, 0n]);

  await sql`INSERT INTO user_details (x_handle, temporary_private_key, smart_account_address, chain_id) 
      values (${xHandle}, ${privateKey}, ${accountAddress}, ${activeChain.id})`;

  return accountAddress;
};
