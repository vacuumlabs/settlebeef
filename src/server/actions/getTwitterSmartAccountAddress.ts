"use server";

import { cookies } from "next/headers";
import { Address, getContract } from "viem";
import { sql } from "@vercel/postgres";
import { LocalAccountSigner } from "@alchemy/aa-core";
import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";
import {
  LinkedAccountWithMetadata,
  PrivyClient,
  WalletWithMetadata,
} from "@privy-io/server-auth";
import { activeChainAlchemy, publicClient } from "@/utils/chain";
import { lightAccountFactoryAbi } from "@/abi/lightAccountFactory";
import { LIGHT_ACCOUNT_FACTORY_ADDRESS } from "@/constants";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

const getLightAccountAddress = getContract({
  client: publicClient,
  address: LIGHT_ACCOUNT_FACTORY_ADDRESS,
  abi: lightAccountFactoryAbi,
}).read.getAddress;

export type UserDetailsResponseType = {
  smart_account_address: Address;
  owner?: Address;
  temporary_private_key?: Address;
};

export const getTwitterSmartAccountAddress = async () => {
  const authToken = cookies().get("privy-token")?.value;

  if (authToken === undefined) throw new Error("");

  const claims = await privy.verifyAuthToken(authToken);
  const user = await privy.getUser(claims.userId);

  const walletAddress = user.linkedAccounts.find(isWalletWithMetadata)
    ?.address as Address;

  if (walletAddress === undefined) {
    throw new Error(`User ${user.id} does not have an embedded wallet`);
  }

  const xHandle = user.twitter?.username;

  if (!xHandle) {
    throw new Error("User does not have a X / Twitter connected");
  }

  const { rows } =
    await sql<UserDetailsResponseType>`SELECT smart_account_address, temporary_private_key, owner FROM user_details WHERE x_handle = ${xHandle} `;

  if (rows[0]) {
    const { smart_account_address, temporary_private_key, owner } = rows[0];

    if (owner) {
      // User is already the owner of the account
      return smart_account_address;
    } else {
      // Transfer the ownership of the account to user
      const signer = LocalAccountSigner.privateKeyToAccountSigner(
        temporary_private_key!,
      );

      const smartAccountClient = await createLightAccountAlchemyClient({
        signer,
        accountAddress: smart_account_address,
        chain: activeChainAlchemy,
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        gasManagerConfig: {
          policyId: process.env.NEXT_PUBLIC_GAS_POLICY_ID!,
        },
      });

      const transferData =
        smartAccountClient.account.encodeTransferOwnership(walletAddress);

      await smartAccountClient.sendTransaction({
        to: smart_account_address,
        data: transferData,
        chain: activeChainAlchemy,
      });

      await sql`UPDATE user_details SET owner = ${walletAddress}, temporary_private_key = NULL WHERE x_handle = ${xHandle}`;

      return smart_account_address;
    }
  } else {
    // No wallet is pre-generated. We can just create a default one from the embedded wallet's address
    const accountAddress = await getLightAccountAddress([walletAddress, 0n]);

    await sql`INSERT INTO user_details (x_handle, smart_account_address, owner) 
      values (${xHandle}, ${accountAddress}, ${walletAddress})`;

    return accountAddress;
  }
};

const isWalletWithMetadata = (
  account: LinkedAccountWithMetadata,
): account is WalletWithMetadata =>
  account.type === "wallet" && account.walletClientType === "privy";
