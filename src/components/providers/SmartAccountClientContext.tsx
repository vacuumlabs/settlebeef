import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LightAccount } from "@alchemy/aa-accounts";
import {
  SmartAccountClient as AlchemySmartAccountClient,
  WalletClientSigner,
} from "@alchemy/aa-core";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Address, Chain, createWalletClient, custom, Transport } from "viem";
import { useSendTransaction } from "wagmi";
import { GetGeneratedSmartAccountAddressResponse } from "@/app/api/generated-smart-account/route";
import { activeChain, publicClient } from "@/utils/chain";
import { createSmartAccountClient } from "@/utils/userOperation";

export type SmartAccountClient = AlchemySmartAccountClient<
  Transport,
  Chain,
  LightAccount
>;

type SendTransactionParams = {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
};

type SmartAccountClientContext = {
  connectedAddress: Address | undefined;
  client: SmartAccountClient | undefined;
  setClient: Dispatch<SetStateAction<SmartAccountClient | undefined>>;
  createClient: () => Promise<void>;
  sendTransaction: (params: SendTransactionParams) => Promise<`0x${string}`>;
};

export const SmartAccountClientContext = createContext(
  {} as SmartAccountClientContext,
);

type SmartAccountClientContextProviderProps = {
  children: React.ReactNode;
};

export const SmartAccountClientContextProvider = ({
  children,
}: SmartAccountClientContextProviderProps) => {
  const [client, setClient] = useState<SmartAccountClient>();
  const { wallets } = useWallets();
  const { sendTransactionAsync } = useSendTransaction();
  const { user } = usePrivy();

  const sendTransaction = useCallback(
    async (params: SendTransactionParams) => {
      if (client) {
        const uo = {
          target: params.to,
          value: params.value,
          data: params.data,
        };

        const { hash } = await client.sendUserOperation({ uo });

        await client.waitForUserOperationTransaction({ hash });
        return hash;
      } else {
        const hash = await sendTransactionAsync(params);

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
      }
    },
    [client, sendTransactionAsync],
  );

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy",
  );

  const createClient = useCallback(async () => {
    if (embeddedWallet === undefined || user === null) {
      return;
    }

    // For some (invited by socials) users, we use a different smart wallet than the default one.
    const getAccountAddress =
      user.twitter !== undefined || user.email !== undefined
        ? getGeneratedSmartAccountAddress()
        : undefined;

    const eip1193provider = await embeddedWallet.getEthereumProvider();

    const privyClient = createWalletClient({
      account: embeddedWallet.address as Address,
      chain: activeChain,
      transport: custom(eip1193provider),
    });

    const privySigner = new WalletClientSigner(privyClient, "json-rpc");

    const accountAddress = await getAccountAddress;

    const client = await createSmartAccountClient(privySigner, accountAddress);

    setClient(client);
  }, [embeddedWallet, user]);

  const value = useMemo(
    () => ({
      connectedAddress:
        // Show EOA wallet address if present
        embeddedWallet === undefined && user !== null
          ? (wallets[0]?.address as Address | undefined)
          : client?.account.address,
      client,
      setClient,
      createClient,
      sendTransaction,
    }),
    [client, createClient, sendTransaction, user, wallets, embeddedWallet],
  );

  useEffect(() => {
    if (embeddedWallet) {
      void createClient();
    }
  }, [embeddedWallet, createClient]);

  return (
    <SmartAccountClientContext.Provider value={value}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};

const getGeneratedSmartAccountAddress = async () => {
  const response = await fetch("/api/generated-smart-account");

  const { address } =
    (await response.json()) as GetGeneratedSmartAccountAddressResponse;

  if (address === undefined)
    throw new Error("Error getting smart account address from twitter / x");

  return address;
};
