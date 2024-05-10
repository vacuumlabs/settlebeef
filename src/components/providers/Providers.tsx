"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SmartAccountClientContextProvider } from "./SmartAccountClientContext";
import { http } from "viem";
import { activeChain } from "@/utils/chain";
import { injected } from "wagmi/connectors";
import { WagmiProvider, createConfig } from "wagmi";
import { ellipsizeText } from "@/utils/general";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { ThemeProvider } from "@mui/material";
import theme from "@/utils/theme";

type ProvidersProps = {
  children: React.ReactNode;
};

export const handleError = (error: Error | undefined) => {
  console.error(error);

  enqueueSnackbar(
    error ? ellipsizeText(error.message, 100) : "Uh oh! Something went wrong.",
    { variant: "error" }
  );
};

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

  const zdAppId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || "";
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
              createOnLogin: "all-users",
            },
            defaultChain: activeChain,
            supportedChains: [activeChain],
          }}
        >
          <SmartAccountClientContextProvider>
            <ThemeProvider theme={theme}>
              {children}
              <SnackbarProvider />
            </ThemeProvider>
          </SmartAccountClientContextProvider>
        </PrivyProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default Providers;
