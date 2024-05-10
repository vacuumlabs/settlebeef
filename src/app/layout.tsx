import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers/Providers";
import Header from "@/components/Header";
import { Box } from "@mui/material";
import { SnackbarProvider } from "notistack";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decobie",
  description: "De-Cobie your on-chain gambling addiction!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <Providers>
            <Header />
            <Box mt={8}>{children}</Box>
            <SnackbarProvider />
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
