"use client";

import { useContext } from "react";
import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useBalance, useEnsName } from "@/hooks/queries";
import { QueryGuard } from "@/hooks/QueryGuard";
import { getAddressOrEnsName } from "@/utils";
import { formatBigint } from "@/utils/general";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";

const LoginButton = () => {
  const { authenticated, ready } = usePrivy();
  const { connectedAddress, setClient } = useContext(SmartAccountClientContext);
  const ensNameQuery = useEnsName(connectedAddress);

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      setClient(undefined);
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

  return (
    <Stack direction="row" alignItems="center" gap={3}>
      {ready ? (
        <Stack direction="row" alignItems="center" gap={3}>
          {isLoading ? (
            <Skeleton height={15} width={200} />
          ) : (
            <Typography component="span">
              {formatBigint(balance?.value, 5)}&nbsp;Ξ
            </Typography>
          )}
          <QueryGuard {...ensNameQuery}>
            {(ensName) => (
              <Typography component="span">
                {getAddressOrEnsName(connectedAddress, ensName)}
              </Typography>
            )}
          </QueryGuard>
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
