"use client";
import { Open_Sans } from "next/font/google";
import { createTheme } from "@mui/material";

const roboto = Open_Sans({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
