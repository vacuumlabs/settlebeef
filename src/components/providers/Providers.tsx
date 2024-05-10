"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartAccountClientContextProvider } from "./SmartAccountClientContext";
import { http } from "viem";
import { activeChain } from "@/utils/chain";
import { injected } from "wagmi/connectors";
import { WagmiProvider, createConfig } from "wagmi";

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  const queryClient = new QueryClient();

  const zdAppId = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";
  const config = createConfig({
    chains: [activeChain],
    connectors: [injected()],
    transports: {
      [activeChain.id]: http(
        `https://rpc.zerodev.app/api/v2/bundler/${zdAppId}`
      ),
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            embeddedWallets: {
              createOnLogin: "users-without-wallets",
            },
            defaultChain: activeChain,
            supportedChains: [activeChain],
          }}
        >
          <SmartAccountClientContextProvider>
            {children}
          </SmartAccountClientContextProvider>
        </PrivyProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default Providers;
