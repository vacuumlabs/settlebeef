"use client";

import BeefList from "@/components/BeefList";
import { BeefRowProps } from "@/components/BeefRow";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { useGetBeefs } from "@/hooks/queries";
import { Container, Typography } from "@mui/material";
import { useContext } from "react";

export default function Home() {
  const { client } = useContext(SmartAccountClientContext);
  const { data: beefs, isPending: isLoadingBeefs } = useGetBeefs();
  const beefsListData =
    beefs?.map((beef) => ({
      title: beef.params.title,
      address: beef.address,
      wager: beef.params.wager,
    })) ?? [];
  console.log("isLoadingBeefs", isLoadingBeefs);
  return (
    <Container>
      <Typography variant="h1">Home</Typography>
      <Typography variant="body1">
        {client ? "Connected" : "Not connected"}
        {client && JSON.stringify(client.account)}
      </Typography>
      {isLoadingBeefs ? (
        "Loading beef list"
      ) : beefsListData.length === 0 ? (
        "No beefs!"
      ) : (
        <BeefList beefs={beefsListData} />
      )}
    </Container>
  );
}
