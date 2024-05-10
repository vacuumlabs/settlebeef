import { AppBar, Toolbar, Typography } from "@mui/material";
import React from "react";
import LoginButton from "./LoginButton";
import Link from "next/link";

const Header = () => {
  return (
    <AppBar>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Typography
            variant="h6"
            component="span"
            sx={{ flexGrow: 1, color: "white" }}
          >
            Decobie
          </Typography>
        </Link>
        <LoginButton />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
