"use client";

import BeefList from "@/components/BeefList";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { useGetBeefs } from "@/hooks/queries";
import { Box, Container, Typography } from "@mui/material";
import { useContext } from "react";

export default function Home() {
  const { client } = useContext(SmartAccountClientContext);
  const beefs = useGetBeefs()!;
  return (
    <Container>
      <Typography variant="h1">Home</Typography>
      <Typography variant="body1">
        {client ? "Connected" : "Not connected"}
        {client && JSON.stringify(client.account)}
      </Typography>
      <BeefList beefs={beefs} />
    </Container>
  );
}
