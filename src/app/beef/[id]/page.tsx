"use client";

import React, { useContext } from "react";
import { useBeef } from "../../../hooks/queries";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { Address, formatEther } from "viem";
import { truncateAddress } from "@/utils";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import BeefControls from "@/components/BeefControls";

type BeefDetailPageProps = {
  params: {
    id: string;
  };
};
const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { client } = useContext(SmartAccountClientContext);
  const { id } = params;
  const beef = useBeef(id);

  const address = client?.account.address;
  if (beef == null) {
    redirect("/not-found");
  }

  const { title, description, owner, foe, wager, deadline, arbiters, result } =
    beef;
  const isUserArbiter = address != null && arbiters.includes(address);
  const isUserFoe = address === foe;
  const isUserOwner = address === owner;

  return (
    <Container sx={{ pt: 4 }}>
      <Paper elevation={2} square>
        <Stack p={4} spacing={2}>
          <Typography variant="h2">🔥 {title} 🔥</Typography>
          <Typography variant="h3" whiteSpace="pre-line">
            {truncateAddress(owner)} 🥊 vs. 🥊 {truncateAddress(foe)}
          </Typography>
          <Typography variant="h3">
            💸 {formatEther(wager)} ETH at stake 💸
          </Typography>
          <Typography variant="h4">Result: {result || "undecided"}</Typography>
          <Typography variant="body1">{description}</Typography>
          <Box>
            <Typography variant="body1">
              Deadline:{" "}
              {new Date(Number.parseInt(deadline.toString())).toString()}
            </Typography>
            {/* TODO: We can fetch more complex info about arbiters (e.g. their social credit) and display it here */}
            <Typography variant="body1">
              Arbiters: {arbiters.join(", ")}
            </Typography>
          </Box>
          <BeefControls
            {...{
              id: id as Address,
              beef,
              isUserArbiter,
              isUserFoe,
              isUserOwner,
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default BeefDetailPage;
