import { Box } from "@mui/material"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Header from "@/components/Header"
import Providers from "@/components/providers/Providers"
import "@coinbase/onchainkit/styles.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SettleBeef",
  description: "Settle your beef!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <Providers>
            <Header />
            <Box mt={10}>{children}</Box>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
