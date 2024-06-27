"use client"

import { useContext } from "react"
import { Avatar, Name } from "@coinbase/onchainkit/identity"
import { Button, Skeleton, Stack, SvgIcon, Typography } from "@mui/material"
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth"
import { enqueueSnackbar } from "notistack"
import { useDisconnect } from "wagmi"
import { CoinbaseWalletLogo } from "@/components/CoinbaseWalletLogo"
import { CopyIcon } from "@/components/CopyIcon"
import { useBalance } from "@/hooks/queries"
import { copyTextToClipboard, formatBigint } from "@/utils/general"
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext"

const LoginButton = () => {
  const { authenticated } = usePrivy()

  const { connectedAddress, setClient, connectCoinbase, isConnected, disconnectCoinbase } =
    useContext(SmartAccountClientContext)
  const { disconnect } = useDisconnect()

  const { login } = useLogin()

  const { logout: privyLogout } = useLogout({
    onSuccess: () => {
      setClient(undefined)
      // Manually disconnect wagmi to clean up state in wagmi hooks
      disconnect()
    },
  })

  const handleLogoutWallet = () => {
    if (authenticated) {
      void privyLogout()
    } else {
      disconnectCoinbase()
    }
  }

  const { data: balance, isLoading } = useBalance()

  if (!isConnected) {
    return (
      <Stack direction="row" gap={2}>
        <Button sx={{ gap: 1 }} variant="contained" onClick={connectCoinbase}>
          <CoinbaseWalletLogo />
          <Typography fontWeight="bold"> Create Smart Account</Typography>
        </Button>
        <Button variant="contained" color="primary" onClick={login}>
          Login
        </Button>
      </Stack>
    )
  }

  const handleCopyAddress = async () => {
    if (connectedAddress === undefined) return

    const isSuccess = await copyTextToClipboard(connectedAddress)

    if (isSuccess) {
      enqueueSnackbar("Address copied", {
        variant: "success",
        preventDuplicate: true,
      })
    } else {
      enqueueSnackbar("Error copying address", {
        variant: "error",
        preventDuplicate: true,
      })
    }
  }

  return (
    <Stack direction="row" alignItems="center" gap={3}>
      {isConnected ? (
        <Stack direction="row" alignItems="center" gap={3}>
          {isLoading ? (
            <Skeleton height={15} width={200} />
          ) : (
            <Typography component="span">{formatBigint(balance, 5)}&nbsp;Ξ</Typography>
          )}
          {connectedAddress && (
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Name address={connectedAddress} />
              <Avatar
                address={connectedAddress}
                loadingComponent={<span>&nbsp;</span>}
                defaultComponent={<span>&nbsp;</span>}
              />
              <Button
                onClick={handleCopyAddress}
                aria-label="copy"
                variant="contained"
                size="small"
                startIcon={
                  <SvgIcon width={18} height={18}>
                    <CopyIcon />
                  </SvgIcon>
                }
              >
                <Typography variant="button" fontSize={12}>
                  Copy Address
                </Typography>
              </Button>
            </Stack>
          )}
        </Stack>
      ) : (
        <Skeleton variant="circular" />
      )}
      <Button variant="contained" color="primary" onClick={handleLogoutWallet}>
        Logout
      </Button>
    </Stack>
  )
}

export default LoginButton
