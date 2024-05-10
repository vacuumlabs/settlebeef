"use client";

import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useContext } from "react";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";
import { useBalance } from "wagmi";
import { formatEther } from "viem";

const LoginButton = () => {
  const { authenticated } = usePrivy();
  const { client, setClient } = useContext(SmartAccountClientContext);

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      setClient(undefined);
    },
  });

  const { data: balance, isLoading } = useBalance({
    address: client?.account.address,
  });

  return authenticated ? (
    <Stack direction="row" alignItems="center" gap={3}>
      {client == null ? (
        <Skeleton variant="circular" />
      ) : (
        <Stack direction="row" gap={3}>
          {isLoading || balance == null ? (
            <Skeleton variant="circular" />
          ) : (
            <Typography component="span" variant="body2">
              {formatEther(BigInt(balance.value.toString()))} ETH
            </Typography>
          )}
          <Typography component="span" variant="body2">
            {client?.account.address}
          </Typography>
        </Stack>
      )}
      <Button color="inherit" onClick={logout}>
        Logout
      </Button>
    </Stack>
  ) : (
    <Button color="inherit" onClick={login}>
      Login
    </Button>
  );
};

export default LoginButton;
