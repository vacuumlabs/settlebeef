"use client";

import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useContext } from "react";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";
import { useBalance } from "wagmi";
import { formatEther } from "viem";

const LoginButton = () => {
  const { authenticated, ready } = usePrivy();
  const { connectedAddress, setClient } = useContext(SmartAccountClientContext);

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      setClient(undefined);
    },
  });

  const { data: balance, isLoading } = useBalance({
    address: connectedAddress,
  });

  return authenticated ? (
    <Stack direction="row" alignItems="center" gap={3}>
      {ready ? (
        <Stack direction="row" gap={3}>
          {isLoading || balance == null ? (
            <Skeleton variant="circular" />
          ) : (
            <Typography component="span" variant="body2">
              {formatEther(BigInt(balance.value.toString()))} ETH
            </Typography>
          )}
          <Typography component="span" variant="body2">
            {connectedAddress}
          </Typography>
        </Stack>
      ) : (
        <Skeleton variant="circular" />
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
