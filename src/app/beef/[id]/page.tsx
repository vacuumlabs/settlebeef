"use client";

import React, { useContext } from "react";
import { useBeef, useGetArbiterStatuses } from "../../../hooks/queries";
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Stack,
  Step,
  StepConnector,
  StepIconProps,
  StepLabel,
  Stepper,
  Typography,
  stepConnectorClasses,
  styled,
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
  { icon: "🥩", text: "Beef creation" },
  { icon: "🧑‍⚖️", text: "Arbiters attendance" },
  { icon: "🐄", text: "Foe joining" },
  { icon: "👨‍🍳", text: "Beef cooking" },
  { icon: "🧑‍⚖️", text: "Beef settling" },
  { icon: "🍽️", text: "Beef ready to serve" },
  { icon: "😋", text: "Beef served" },
];

const BeefStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 30,
    left: "calc(-50% + 30px)",
    right: "calc(50% + 30px)",
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: "#784af4",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor:
      theme.palette.mode === "dark"
        ? theme.palette.grey[800]
        : theme.palette.grey[400],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

function StepIcon(props: StepIconProps) {
  const { icon, completed } = props;
  return (
    <Box
      sx={(theme) => ({
        bgcolor: completed
          ? theme.palette.primary.main
          : theme.palette.grey[100],
        width: 60,
        height: 60,
        borderRadius: "100%",
        alignContent: "center",
        textAlign: "center",
      })}
    >
      <Typography
        variant="h4"
        sx={{
          justifyContent: "center",
          color: "white",
          textShadow:
            "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;",
        }}
      >
        {steps[(icon as number) - 1]?.icon}
      </Typography>
    </Box>
  );
}

const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);
  const { id } = params;
  const beef = useBeef(id);
  const arbiterStatuses = useGetArbiterStatuses(
    (beef?.address ?? "0x0") as Address,
    beef?.arbiters ?? []
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
  console.log("beef", beef);
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
      steps.push({ icon: "🤢", text: "Beef rotten" });
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
            Number(settleStart + BigInt(60 * 60 * 24 * 30)) * 1000
          );
          step = 4;
        } else {
          step = 5;
          if (
            resultYes <= arbiters.length / 2 &&
            resultNo <= arbiters.length / 2
          ) {
            steps = steps.slice(0, 5);
            steps.push({ icon: "🤢", text: "Beef rotten" });
          }
          if (/*served*/ false) {
            step = 6;
          }
        }
      }
    }
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

          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{ width: "100%" }}
            connector={<BeefStepConnector />}
          >
            {steps.map((label, index) => (
              <Step key={label.text}>
                <StepLabel StepIconComponent={StepIcon}>
                  <Stack>
                    <Typography>{label.text}</Typography>
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
