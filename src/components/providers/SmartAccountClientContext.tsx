import { createSmartAccountClient } from "@/utils/privy";
import { useWallets } from "@privy-io/react-auth";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Address } from "viem";
import { useSendTransaction } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "./Providers";

export type SmartAccountClient = Awaited<
  ReturnType<typeof createSmartAccountClient>
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

  const sendTransaction = useCallback(
    async (params: SendTransactionParams) => {
      if (client) {
        return client.sendTransaction(params);
      } else {
        const hash = await sendTransactionAsync(params);
        await waitForTransactionReceipt(wagmiConfig, { hash });
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

    const newClient = await createSmartAccountClient(embeddedWallet);
    setClient(newClient);
  }, [embeddedWallet]);

  const value = useMemo(
    () => ({
      connectedAddress:
        client?.account.address ?? (wallets[0]?.address as Address),
      client,
      setClient,
      createClient,
      sendTransaction,
    }),
    [client, createClient, sendTransaction, wallets],
  );

  useEffect(() => {
    if (embeddedWallet) {
      createClient();
    }
  }, [embeddedWallet, createClient]);

  return (
    <SmartAccountClientContext.Provider value={value}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};
