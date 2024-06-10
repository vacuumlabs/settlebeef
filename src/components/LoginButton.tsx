"use client";

import { useContext } from "react";
import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { enqueueSnackbar } from "notistack";
import { useDisconnect } from "wagmi";
import { CopyIcon } from "@/components/CopyIcon";
import { useBalance, useEnsName } from "@/hooks/queries";
import { QueryGuard } from "@/hooks/QueryGuard";
import { getAddressOrEnsName } from "@/utils";
import { copyTextToClipboard, formatBigint } from "@/utils/general";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";

const LoginButton = () => {
  const { authenticated, ready } = usePrivy();
  const { connectedAddress, setClient } = useContext(SmartAccountClientContext);
  const ensNameQuery = useEnsName(connectedAddress);
  const { disconnect } = useDisconnect();

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      setClient(undefined);
      // Manually disconnect wagmi to clean up state in wagmi hooks
      disconnect();
    },
  });

  const { data: balance, isLoading } = useBalance();

  if (!authenticated) {
    return (
      <Button variant="contained" color="primary" onClick={login}>
        Login
      </Button>
    );
  }

  const handleCopyAddress = async () => {
    if (connectedAddress === undefined) return;

    const isSuccess = await copyTextToClipboard(connectedAddress);

    if (isSuccess) {
      enqueueSnackbar("Address copied", {
        variant: "success",
        preventDuplicate: true,
      });
    } else {
      enqueueSnackbar("Error copying address", {
        variant: "error",
        preventDuplicate: true,
      });
    }
  };

  return (
    <Stack direction="row" alignItems="center" gap={3}>
      {ready ? (
        <Stack direction="row" alignItems="center" gap={3}>
          {isLoading ? (
            <Skeleton height={15} width={200} />
          ) : (
            <Typography component="span">
              {formatBigint(balance, 5)}&nbsp;Ξ
            </Typography>
          )}
          <Stack direction="row" alignItems="center" gap={0.5}>
            <QueryGuard {...ensNameQuery}>
              {(ensName) => (
                <Typography component="span">
                  {getAddressOrEnsName(connectedAddress, ensName)}
                </Typography>
              )}
            </QueryGuard>
            <Button
              onClick={handleCopyAddress}
              aria-label="copy"
              variant="contained"
              size="small"
              startIcon={<CopyIcon />}
            >
              <Typography variant="button" fontSize={12}>
                Copy
              </Typography>
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Skeleton variant="circular" />
      )}
      <Button variant="contained" color="primary" onClick={logout}>
        Logout
      </Button>
    </Stack>
  );
};

export default LoginButton;
