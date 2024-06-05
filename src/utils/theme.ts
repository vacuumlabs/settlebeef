"use client";
import { createTheme } from "@mui/material";
import { Open_Sans, Space_Mono } from "next/font/google";

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
    h3: {
      fontWeight: 700,
      textTransform: "uppercase",
    },
  },
  palette: {
    primary: {
      main: "#6DC5D1",
    },
    secondary: {
      light: "#FDE49E",
      main: "#FEB941",
      dark: "#DD761C",
    },
  },
});

theme.typography.subtitle2.fontFamily = spaceMono.style.fontFamily;

theme.components = {
  MuiPaper: {
    defaultProps: {
      elevation: 0,
      variant: "outlined",
    },
    styleOverrides: {
      root: {
        borderWidth: 0,
        borderColor: theme.palette.secondary.light,
        backgroundColor: theme.palette.secondary.light,
        borderRadius: 24,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 24,
        padding: 16,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      size: "large",
    },
    styleOverrides: {
      root: {
        fontWeight: 600,
        elevation: 0,
        borderRadius: "9999px",
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 24,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "&:hover": {
          backgroundColor: "#FFF0CA",
        },
        borderRadius: "12px !important",
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        borderRadius: "12px !important",
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        "&:hover": {
          backgroundColor: "#FFF0CA",
        },
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        mt: 2,
        borderWidth: 2,
        borderColor: theme.palette.primary.main,
        backgroundColor: "#FFF0CA",
        borderRadius: 12,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        backgroundColor: "#FFF0CA",
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
    },
  },
};

export default theme;
