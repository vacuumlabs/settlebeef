"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartAccountClientContextProvider } from "./SmartAccountClientContext";

type ProvidersProps = {
  children: React.ReactNode;
};

const queryClient = new QueryClient();

const Providers = ({ children }: ProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
        }}
      >
        <SmartAccountClientContextProvider>
          {children}
        </SmartAccountClientContextProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
