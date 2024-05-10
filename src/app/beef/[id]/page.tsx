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

let steps = [
  "Beef creation 🥩",
  "Arbiters attendance 🧑‍⚖️",
  "Foe joining 🐄",
  "Beef cooking 👨‍🍳",
  "Beef settling 🧑‍⚖️",
  "Beef ready to serve 🍽️",
  "Beef served 😋",
];

const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);
  const { id } = params;
  const beef = useBeef(id);
  const arbiterStatuses = useGetArbiterStatuses(
    (beef?.address ?? "0x0") as Address,
    beef?.arbiters ?? [],
  );

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
  const isUserArbiter =
    connectedAddress != null &&
    arbiters
      .map((it) => it.toLowerCase())
      .includes(connectedAddress.toLowerCase());
  const isUserFoe =
    connectedAddress != null &&
    connectedAddress.toLowerCase() === foe.toLowerCase();
  const isUserOwner =
    connectedAddress != null &&
    connectedAddress.toLowerCase() === owner.toLowerCase();

  let step = 0;
  let deadline: Date | undefined;
  const now = new Date().getTime();
  if (attendCount < arbiters.length) {
    if (now < joinDeadline * 1000n) {
      deadline = new Date(Number(joinDeadline) * 1000);
      step = 1;
    } else {
      steps = steps.slice(0, 2);
      steps.push("Beef rotten 🤢");
      step = 2;
    }
  } else {
    step = 2;
    if (isCooking) {
      if (now < settleStart * 1000n) {
        deadline = new Date(Number(settleStart) * 1000);
        step = 3;
      } else {
        if (now < settleStart + BigInt(60 * 60 * 24 * 30) * 1000n) {
          // TODO: this assumes constant settlingDuration of 30 days!
          deadline = new Date(
            Number(settleStart + BigInt(60 * 60 * 24 * 30)) * 1000,
          );
          step = 4;
        } else {
          step = 5;
          if (
            resultYes <= arbiters.length / 2 &&
            resultNo <= arbiters.length / 2
          ) {
            steps = steps.slice(0, 5);
            steps.push("Beef rotten 🤢");
          }
          if (/*served*/ false) {
            step = 6;
          }
        }
      }
    }
  }

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
          <Typography variant="h3" whiteSpace="pre-line" pb={4}>
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
            {step >= 4 && (
              <Typography variant="h4" whiteSpace="pre-line">
                {resultYes.toString()} votes for to {resultNo.toString()} votes
                against
              </Typography>
            )}
            {/* TODO: We can fetch more complex info about arbiters (e.g. their social credit) and display it here */}
            {arbiters.map((arbiter, index) => (
              <Stack direction={"row"} key={arbiter} gap={1}>
                <Typography variant="subtitle2">{arbiter}</Typography>
                {/* TODO: show attended/settled status */}
                {arbiterStatuses && (
                  <Typography>
                    {step < 4
                      ? arbiterStatuses[index].hasAttended
                        ? "✅"
                        : "⌛"
                      : arbiterStatuses[index].hasSettled
                        ? "1️⃣"
                        : "2️⃣"}
                  </Typography>
                )}
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
