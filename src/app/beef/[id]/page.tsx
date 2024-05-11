"use client";

import React, { useContext } from "react";
import {
  useBeef,
  useEnsNames,
  useGetArbiterStatuses,
} from "../../../hooks/queries";
import {
  Box,
  Chip,
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
import { getAddressOrEnsName } from "@/utils";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import BeefControls from "@/components/BeefControls";
import { Countdown } from "@/components/Countdown";
import { calculateColorFromStreetCredit } from "@/utils/colors";

type BeefDetailPageProps = {
  params: {
    id: string;
  };
};

let steps = [
  { icon: "🥩", text: "Beef creation" },
  { icon: "🧑‍⚖️", text: "Arbiters attendance" },
  { icon: "🤺", text: "Challenger joining" },
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

  const { isLoading: ensNamesLoading, data: ensNames } = useEnsNames([
    beef?.owner,
    beef?.challenger,
    ...(beef?.arbiters ?? []),
  ]);

  if (beef === undefined) {
    redirect("/not-found");
  }

  if (beef === null || ensNamesLoading) {
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
    challenger,
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
  const isUserChallenger =
    connectedAddress != null &&
    connectedAddress.toLowerCase() === challenger.toLowerCase();
  const isUserOwner =
    connectedAddress != null &&
    connectedAddress.toLowerCase() === owner.toLowerCase();

  let step = 0;
  let deadline: Date | undefined;
  let isRotten = false;
  const now = new Date().getTime();
  if (attendCount < arbiters.length) {
    if (now < joinDeadline * 1000n) {
      deadline = new Date(Number(joinDeadline) * 1000);
      step = 1;
    } else {
      steps = steps.slice(0, 2);
      steps.push({ icon: "🤢", text: "Beef rotten" });
      step = 2;
      isRotten = true;
    }
  } else {
    step = 2;
    if (isCooking) {
      if (now < settleStart * 1000n) {
        deadline = new Date(Number(settleStart) * 1000);
        step = 3;
      } else {
        step = 4;
        // FIXME: this assumes constant settlingDuration of 30 days!
        deadline = new Date(
          Number(settleStart + BigInt(60 * 60 * 24 * 30)) * 1000
        );
        if (resultYes > arbiters.length / 2 || resultNo > arbiters.length / 2) {
          step = 5;
          deadline = undefined;
          if (/*served*/ false) {
            step = 6;
          }
        } else if (now > (settleStart + BigInt(60 * 60 * 24 * 30)) * 1000n) {
          deadline = undefined;
          // FIXME: this assumes constant settlingDuration of 30 days!
          steps = steps.slice(0, 5);
          steps.push({ icon: "🤢", text: "Beef rotten" });
          isRotten = true;
        }
      }
    }
  }

  return (
    <Container sx={{ pt: 4, pb: 6 }}>
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
            {getAddressOrEnsName(owner, ensNames?.at(0))} 🥊 vs 🥊{" "}
            {getAddressOrEnsName(challenger, ensNames?.at(1))}
          </Typography>

          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{ width: "100%" }}
            connector={<BeefStepConnector />}
          >
            {steps.map((label, index) => {
              const stepTimeInSeconds =
                index === 2
                  ? Number(joinDeadline)
                  : index === 3
                    ? Number(settleStart)
                    : index === 4
                      ? Number(settleStart + BigInt(60 * 60 * 24 * 30))
                      : null;

              const stepDate = stepTimeInSeconds
                ? new Date(1000 * stepTimeInSeconds).toDateString()
                : null;
              return (
                <Step key={label.text}>
                  <StepLabel StepIconComponent={StepIcon}>
                    <Stack>
                      <Typography>{label.text}</Typography>
                      {stepDate && !isRotten && (
                        <Stack>
                          <Typography variant="body2">Deadline</Typography>
                          <Typography variant="body2">{stepDate}</Typography>
                        </Stack>
                      )}
                      {index === step && deadline != null && (
                        <Typography>
                          <Countdown deadline={deadline} />
                        </Typography>
                      )}
                    </Stack>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          <Stack gap={1} alignItems={"stretch"} pt={6}>
            <Typography variant="h4" mb={1} alignSelf={"center"}>
              Arbiters
            </Typography>
            {step >= 4 && (
              <Typography
                variant="h6"
                whiteSpace="pre-line"
                alignSelf={"center"}
              >
                {resultYes.toString()} vote{resultYes > 1n ? "s" : ""} for ⚔️{" "}
                {resultNo.toString()} vote{resultNo > 1n ? "s " : " "}
                against
              </Typography>
            )}
            {/* TODO: We can fetch more complex info about arbiters (e.g. their social credit) and display it here */}
            {arbiters.map((arbiter, index) => (
              <Stack
                direction={"row"}
                key={arbiter}
                gap={1}
                justifyContent={"space-between"}
                alignItems="center"
              >
                <Chip
                  label={
                    <Typography color="white" variant="subtitle1">
                      {arbiterStatuses
                        ? Number(arbiterStatuses[index]!.streetCredit)
                        : "-"}
                    </Typography>
                  }
                  sx={{
                    backgroundColor: calculateColorFromStreetCredit(
                      arbiterStatuses?.[index]!.streetCredit
                    ),
                  }}
                />
                <Typography variant="subtitle2">
                  {getAddressOrEnsName(arbiter, ensNames?.at(2 + index), false)}
                </Typography>
                {/* TODO: show attended/settled status */}
                {arbiterStatuses && (
                  <Typography>
                    {step < 4
                      ? arbiterStatuses[index]!.hasAttended
                        ? "✅"
                        : "⌛"
                      : arbiterStatuses[index]!.hasSettled === 1n
                        ? "👍🏽"
                        : arbiterStatuses[index]!.hasSettled === 2n
                          ? "👎🏽"
                          : "⌛"}
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
              isUserChallenger,
              isUserOwner,
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default BeefDetailPage;
