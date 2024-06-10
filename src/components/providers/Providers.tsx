"use client";

import { ThemeProvider } from "@mui/material";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { http } from "viem";
import { mainnet } from "viem/chains";
import { injected } from "wagmi/connectors";
import { activeChain } from "@/utils/chain";
import { ellipsizeText } from "@/utils/general";
import theme from "@/utils/theme";
import { SmartAccountClientContextProvider } from "./SmartAccountClientContext";

type ProvidersProps = {
  children: React.ReactNode;
};

export const handleError = (error: Error | undefined) => {
  console.error(error);

  enqueueSnackbar(
    error ? ellipsizeText(error.message, 100) : "Uh oh! Something went wrong.",
    { variant: "error" },
  );
};

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: {
    [activeChain.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`,
    ),
  },
});

export const ensConfig = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
});

const Providers = ({ children }: ProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
      mutations: {
        // This way it's overrideable in useMutation hooks
        onError: handleError,
      },
    },
    queryCache: new QueryCache({
      onError: handleError,
    }),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
          loginMethods: ["wallet", "twitter", "email"],
          defaultChain: activeChain,
          supportedChains: [activeChain],
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <SmartAccountClientContextProvider>
            <ThemeProvider theme={theme}>
              {children}
              <SnackbarProvider />
            </ThemeProvider>
          </SmartAccountClientContextProvider>
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
