"use client";
import { Open_Sans, Space_Mono } from "next/font/google";
import { createTheme } from "@mui/material";

const roboto = Open_Sans({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

theme.typography.subtitle2.fontFamily = spaceMono.style.fontFamily;

export default theme;
