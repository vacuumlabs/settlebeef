import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { WalletClientSigner } from "@alchemy/aa-core";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Address, createWalletClient, custom } from "viem";
import { useSendTransaction } from "wagmi";
import { GetGeneratedSmartAccountAddressResponse } from "@/app/api/generated-smart-account/route";
import { activeChain, activeChainAlchemy, publicClient } from "@/utils/chain";

export type SmartAccountClient = Awaited<
  ReturnType<typeof createLightAccountAlchemyClient>
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
    if (!embeddedWallet) {
      return;
    }

    // For some (invited by socials) users, we use a different smart wallet than the default one.
    const getAccountAddress =
      user?.twitter !== undefined || user?.email !== undefined
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

    const smartAccountClient = await createLightAccountAlchemyClient({
      signer: privySigner,
      chain: activeChainAlchemy,
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      accountAddress,
      gasManagerConfig: {
        policyId: process.env.NEXT_PUBLIC_GAS_POLICY_ID!,
      },
    });

    setClient(smartAccountClient);
  }, [embeddedWallet, user?.twitter]);

  const value = useMemo(
    () => ({
      // Connecting twitter's smart account take a little longer, and we don't want to display the embedded address
      connectedAddress:
        client?.account.address ??
        (user?.twitter ? undefined : (wallets[0]?.address as Address)),
      client,
      setClient,
      createClient,
      sendTransaction,
    }),
    [client, createClient, sendTransaction, user?.twitter, wallets],
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
