"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
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
import { base, baseSepolia, mainnet } from "viem/chains";
import { injected } from "wagmi/connectors";
import { activeChain, alchemyApiUrl } from "@/utils/chain";
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

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: {
    [base.id]: http(alchemyApiUrl),
    [baseSepolia.id]: http(alchemyApiUrl),
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
              <OnchainKitProvider
                // @ts-expect-error Viem version issue
                chain={activeChain}
                apiKey={process.env.NEXT_PUBLIC_BASE_API_KEY}
              >
                {children}
              </OnchainKitProvider>
              <SnackbarProvider />
            </ThemeProvider>
          </SmartAccountClientContextProvider>
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
