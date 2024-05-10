"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useContext } from "react";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";

const LoginButton = () => {
  const { authenticated } = usePrivy();
  const { client, setClient } = useContext(SmartAccountClientContext);

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      setClient(undefined);
    },
  });

  return authenticated ? (
    <Stack direction="row" alignItems="center" gap={3}>
      <Typography component="span" variant="body2">
        {client?.account.address}
      </Typography>
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
