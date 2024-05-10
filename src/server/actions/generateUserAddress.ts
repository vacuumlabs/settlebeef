"use server";

import {
  LinkedAccountWithMetadata,
  PrivyClient,
  User,
  WalletWithMetadata,
} from "@privy-io/server-auth";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

const isWalletWithMetadata = (
  account: LinkedAccountWithMetadata,
): account is WalletWithMetadata =>
  account.type === "wallet" && account.walletClientType === "privy";

const getSignerAddress = (user: User | null) => {
  const account = user?.linkedAccounts.find(isWalletWithMetadata);
  return account?.address;
};

export type GenerateUserAddressParams = Parameters<
  typeof privy.importUser
>[0]["linkedAccounts"];

export const generateUserAddress = async (
  params: GenerateUserAddressParams,
) => {
  const user = await privy.importUser({
    linkedAccounts: params,
    createEmbeddedWallet: true,
  });

  return {
    user,
    signerAddress: getSignerAddress(user),
  };
};
