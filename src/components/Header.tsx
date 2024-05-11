import { AppBar, Stack, Toolbar, Typography } from "@mui/material";
import React from "react";
import LoginButton from "./LoginButton";
import Link from "next/link";

const Header = () => {
  return (
    <AppBar sx={{ borderRadius: 0 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Stack sx={{ flexDirection: "row" }}>
          <Link
            href="/"
            style={{ textDecoration: "none", marginRight: "48px" }}
          >
            <Typography
              variant="h3"
              component="span"
              sx={{ flexGrow: 1, color: "white" }}
            >
              🥩SettleBeef
            </Typography>
          </Link>
        </Stack>
        <LoginButton />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
