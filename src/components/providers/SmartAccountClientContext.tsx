import { createSmartAccountClient } from "@/utils/privy";
import { useWallets } from "@privy-io/react-auth";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";

type SmartAccountClient = Awaited<ReturnType<typeof createSmartAccountClient>>;

type SmartAccountClientContext = {
  client: SmartAccountClient | undefined;
  setClient: Dispatch<SetStateAction<SmartAccountClient | undefined>>;
  createClient: () => Promise<void>;
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
    () => ({ client, setClient, createClient }),
    [client, createClient],
  );

  return (
    <SmartAccountClientContext.Provider value={value}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};
