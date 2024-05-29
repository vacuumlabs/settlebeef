"use server";

import { sql } from "@vercel/postgres";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { getContract } from "viem";
import { publicClient } from "@/utils/chain";
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory";
import { UserDetailsResponseType } from "@/server/actions/getTwitterSmartAccountAddress";

const LIGHT_ACCOUNT_FACTORY_ADDRESS =
  "0x00004EC70002a32400f8ae005A26081065620D20";

const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress;

export const generateAddressFromTwitterHandle = async (handle: string) => {
  const { rows } =
    await sql<UserDetailsResponseType>`SELECT smart_account_address FROM user_details WHERE handle = ${handle} `;

  if (rows[0]) {
    // Already generated
    return rows[0].smart_account_address;
  }

  const privateKey = generatePrivateKey();
  const signerAddress = privateKeyToAddress(privateKey);
  const accountAddress = await getLightAccountAddress([signerAddress, 0n]);

  await sql`INSERT INTO user_details (handle, temporary_private_key, smart_account_address) 
      values (${handle}, ${privateKey}, ${accountAddress})`;

  return accountAddress;
};
