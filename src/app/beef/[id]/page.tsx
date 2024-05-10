"use client";

import React, { useContext } from "react";
import { useBeef, useGetArbiterStatuses } from "../../../hooks/queries";
import {
  Container,
  Paper,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { redirect } from "next/navigation";
import { Address, formatEther } from "viem";
import { truncateAddress } from "@/utils";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import BeefControls from "@/components/BeefControls";
import { Countdown } from "@/components/Countdown";

type BeefDetailPageProps = {
  params: {
    id: string;
  };
};

const steps = [
  "Beef creation 🥩",
  "Arbiters attendance 🧑‍⚖️",
  "Foe joining 🐄",
  "Beef cooking 👨‍🍳",
  "Beef settling 🧑‍⚖️",
  "Beef ready to serve 🍽️",
];

const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { client } = useContext(SmartAccountClientContext);
  const { id } = params;
  const beef = useBeef(id);
  // const arbiterStatuses = useGetArbiterStatuses(
  //   (beef?.address ?? "0x0") as Address,
  //   beef?.arbiters ?? []
  // );

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
    attendCount,
    isCooking,
    settleStart,
  } = beef;
  const isUserArbiter = address != null && arbiters.includes(address);
  const isUserFoe = address === foe;
  const isUserOwner = address === owner;

  let step = 0;
  if (attendCount < arbiters.length) {
    step = 1;
  } else {
    step = 2;
  }
  if (isCooking) {
    step = 3;
  }

  let deadline: Date | undefined;
  const now = new Date().getTime();
  if (now < joinDeadline * 1000n) {
    deadline = new Date(Number(joinDeadline) * 1000);
  } else if (now < settleStart * 1000n) {
    deadline = new Date(Number(settleStart) * 1000);
  } else if (now < settleStart + BigInt(60 * 60 * 24 * 30) * 1000n) {
    // TODO: this assumes constant settlingDuration of 30 days!
    deadline = new Date(Number(settleStart + BigInt(60 * 60 * 24 * 30)) * 1000);
  }
  return (
    <Container sx={{ pt: 4 }}>
      <Paper elevation={2} square>
        <Stack p={4} spacing={2} alignItems={"center"}>
          <Stack
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography variant="h2">🔥 {title}</Typography>
            <Typography variant="h4">💸 {formatEther(wager)} ETH</Typography>
          </Stack>
          <Typography variant="h5">{description}</Typography>
          <Typography variant="h3" whiteSpace="pre-line">
            {truncateAddress(owner)} 🥊 vs 🥊 {truncateAddress(foe)}
          </Typography>

          <Stepper activeStep={step} alternativeLabel sx={{ width: "100%" }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>
                  <Stack>
                    <Typography>{label}</Typography>
                    {index === step && deadline != null && (
                      <Typography>
                        <Countdown deadline={deadline} />
                      </Typography>
                    )}
                  </Stack>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack gap={1} alignItems={"stretch"}>
            <Typography variant="h4" mb={1} alignSelf={"center"}>
              Arbiters
            </Typography>
            {step === 4 && (
              <Typography variant="h4" whiteSpace="pre-line">
                {resultYes.toString()} votes for to {resultNo.toString()} votes
                against
              </Typography>
            )}
            {/* TODO: We can fetch more complex info about arbiters (e.g. their social credit) and display it here */}
            {arbiters.map((arbiter) => (
              <Stack direction={"row"} key={arbiter} gap={1}>
                <Typography variant="subtitle2">{arbiter}</Typography>
                {/* TODO: show attended/settled status */}
                {true && <Typography>✅</Typography>}
              </Stack>
            ))}
          </Stack>
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
