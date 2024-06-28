import React from "react"
import { AppBar, Stack, Toolbar, Typography } from "@mui/material"
import Link from "next/link"
import LoginButton from "./LoginButton"

const Header = () => {
  return (
    <AppBar sx={{ borderRadius: 0 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: "48px" }}>
        <Stack sx={{ flexDirection: "row" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography variant="h3" component="span" sx={{ color: "white" }}>
              🥩SettleBeef
            </Typography>
          </Link>
        </Stack>
        <LoginButton />
      </Toolbar>
    </AppBar>
  )
}

export default Header
