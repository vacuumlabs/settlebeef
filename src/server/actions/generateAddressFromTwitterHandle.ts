"use server";

import { sql } from "@vercel/postgres";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { getContract } from "viem";
import { publicClient } from "@/utils/chain";
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory";
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants";
import { UserDetailsResponseType } from "@/app/api/twitter-smart-account/route";

const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress;

export const generateAddressFromTwitterHandle = async (xHandle: string) => {
  const { rows } =
    await sql<UserDetailsResponseType>`SELECT smart_account_address FROM user_details WHERE x_handle = ${xHandle} `;

  if (rows[0]) {
    // Already generated
    return rows[0].smart_account_address;
  }

  const privateKey = generatePrivateKey();
  const signerAddress = privateKeyToAddress(privateKey);
  const accountAddress = await getLightAccountAddress([signerAddress, 0n]);

  await sql`INSERT INTO user_details (x_handle, temporary_private_key, smart_account_address) 
      values (${xHandle}, ${privateKey}, ${accountAddress})`;

  return accountAddress;
};
