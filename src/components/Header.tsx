import { AppBar, Toolbar, Typography } from "@mui/material";
import React from "react";
import LoginButton from "./LoginButton";

const Header = () => {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Decobie
        </Typography>
        <LoginButton />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
