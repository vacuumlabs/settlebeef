"use client";

import React, { useContext } from "react";
import { useBeef } from "../../../hooks/queries";
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { redirect } from "next/navigation";
import { Address, formatEther } from "viem";
import { truncateAddress } from "@/utils";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import BeefControls from "@/components/BeefControls";
import { usePrivy } from "@privy-io/react-auth";
import NotLoggedIn from "@/components/NotLoggedIn";

type BeefDetailPageProps = {
  params: {
    id: string;
  };
};
const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { authenticated } = usePrivy();
  const { client } = useContext(SmartAccountClientContext);
  const { id } = params;
  console.log(id);
  const beef = useBeef(id);

  const address = client?.account.address;

  if (beef === undefined) {
    redirect("/not-found");
  }

  if (beef === null) {
    return (
      <Container>
        <Skeleton width={800} height={600} />
      </Container>
    );
  }

  const {
    title,
    description,
    owner,
    foe,
    wager,
    joinDeadline,
    arbiters,
    resultYes,
    resultNo,
  } = beef;
  const isUserArbiter = address != null && arbiters.includes(address);
  const isUserFoe = address === foe;
  const isUserOwner = address === owner;

  return authenticated ? (
    <Container sx={{ pt: 4 }}>
      <Paper elevation={2} square>
        <Stack p={4} spacing={2}>
          <Typography variant="h2">🔥 {title} 🔥</Typography>
          <Typography variant="h3" whiteSpace="pre-line">
            {truncateAddress(owner)} 🥊 vs. 🥊 {truncateAddress(foe)}
          </Typography>
          <Typography variant="h4" whiteSpace="pre-line">
            {resultYes.toString()} votes for to {resultNo.toString()} votes
            against
          </Typography>
          <Typography variant="h3">
            💸 {formatEther(wager)} ETH at stake 💸
          </Typography>
          <Typography variant="body1">{description}</Typography>
          <Box>
            <Typography variant="body1">
              Deadline:{" "}
              {new Date(Number.parseInt(joinDeadline.toString())).toString()}
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
  ) : (
    <NotLoggedIn />
  );
};

export default BeefDetailPage;
