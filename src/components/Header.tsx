import { AppBar, Stack, Toolbar, Typography } from "@mui/material";
import React from "react";
import LoginButton from "./LoginButton";
import Link from "next/link";

const Header = () => {
  return (
    <AppBar>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Stack sx={{ flexDirection: "row" }}>
          <Link
            href="/"
            style={{ textDecoration: "none", marginRight: "48px" }}
          >
            <Typography
              variant="h6"
              component="span"
              sx={{ flexGrow: 1, color: "white" }}
            >
              Decobie
            </Typography>
          </Link>
          {/*
          <Link href="/beef/new" style={{ textDecoration: "none" }}>
            <Typography
              variant="h6"
              component="span"
              sx={{ flexGrow: 1, color: "white" }}
            >
              New beef
            </Typography>
          </Link>
          */}
        </Stack>
        <LoginButton />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
