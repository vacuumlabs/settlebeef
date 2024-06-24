"use client"

import React from "react"
import {
  Box,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Step,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  StepLabel,
  Stepper,
  styled,
  Typography,
} from "@mui/material"
import { redirect } from "next/navigation"
import { Address, formatEther } from "viem"
import BeefControls from "@/components/BeefControls"
import { Countdown } from "@/components/Countdown"
import { useBeef, useEnsNames } from "@/hooks/queries"
import { getAddressOrEnsName } from "@/utils"

type BeefDetailPageProps = {
  params: {
    id: string
  }
}

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
    borderColor: theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[400],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}))

function StepIcon(props: StepIconProps) {
  const { icon, completed } = props
  return (
    <Box
      sx={(theme) => ({
        bgcolor: completed ? theme.palette.primary.main : theme.palette.grey[100],
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
          textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;",
        }}
      >
        {icon}
      </Typography>
    </Box>
  )
}

export type BeefActions = {
  owner?: "withdrawRaw" | "withdrawRotten" | "serveBeef"
  challenger?: "joinBeef" | "withdrawRotten" | "serveBeef"
  arbiter?: "attend" | "vote"
}

type BeefState = {
  step: number
  steps: { icon: string; text: string }[] | typeof DEFAULT_STEPS
  isRotten?: boolean
  deadline?: Date
  actions: BeefActions
}

const DEFAULT_STEPS = [
  { icon: "🥩", text: "Beef creation" },
  { icon: "🧑‍⚖️", text: "Arbiters attendance" },
  { icon: "🤺", text: "Challenger joining" },
  { icon: "👨‍🍳", text: "Beef cooking" },
  { icon: "🧑‍⚖️", text: "Beef settling" },
  { icon: "🍽️", text: "Beef ready to serve" },
  { icon: "😋", text: "Beef served" },
] as const

const BeefDetailPage = ({ params }: BeefDetailPageProps) => {
  const { id } = params
  const { data: beef, refetch, isLoading } = useBeef(id as Address)

  const { isLoading: ensNamesLoading, data: ensNames } = useEnsNames([
    beef?.owner,
    beef?.challenger,
    ...(beef?.arbiters?.map((it) => it.address) ?? []),
  ])

  if (isLoading || beef === undefined || ensNamesLoading) {
    return (
      <Container sx={{ pb: 6 }}>
        <Skeleton height={600} />
      </Container>
    )
  }

  if (beef === null) {
    redirect("/not-found")
  }

  const {
    title,
    description,
    owner,
    challenger,
    wager,
    joinDeadline: joinDeadlineTimestamp,
    arbiters,
    isCooking,
    settleStart: settleStartTimestamp,
    staking,
    beefGone,
  } = beef

  const joinDeadline = new Date(Number(joinDeadlineTimestamp) * 1000)
  const settleStart = new Date(Number(settleStartTimestamp) * 1000)

  // FIXME: this assumes constant settlingDuration of 30 days!
  const settleDuration = BigInt(60 * 60 * 24 * 30)
  const settleDeadline = new Date(Number((settleStartTimestamp + settleDuration) * 1000n))

  const [resultYes, resultNo] = arbiters.reduce(
    ([yes, no], { status }) =>
      status === "voted_yes"
        ? ([yes + 1, no] as const)
        : status === "voted_no"
          ? ([yes, no + 1] as const)
          : ([yes, no] as const),
    [0, 0] as readonly [number, number],
  )

  const getBeefState = (): BeefState => {
    const now = new Date()
    const attendCount = arbiters.reduce((acc, { status }) => (status !== "none" ? acc + 1 : acc), 0)

    // Arbiters have not joined yet
    if (attendCount < arbiters.length) {
      // Arbiters still have time join
      if (now < joinDeadline) {
        return {
          step: 1,
          steps: DEFAULT_STEPS,
          deadline: joinDeadline,
          actions: {
            arbiter: "attend",
          },
        }
      } else {
        // Arbiters failed to attend
        return {
          steps: [
            { icon: "🥩", text: "Beef creation" },
            { icon: "🤦", text: "Arbiters didn't attend" },
            { icon: "🤢", text: "Beef raw forever" },
          ],
          step: beefGone ? 3 : 2,
          isRotten: true,
          deadline: joinDeadline, // TODO: verify
          actions: {
            owner: beefGone ? undefined : "withdrawRaw",
          },
        }
      }
    } else {
      if (isCooking) {
        // Challenger joined the beef
        if (now < settleStart) {
          // Wait until `settleStart` when arbiters can vote
          return {
            steps: DEFAULT_STEPS,
            step: 3,
            deadline: settleStart,
            actions: {},
          }
        } else {
          const majorityReached = resultYes > arbiters.length / 2 || resultNo > arbiters.length / 2

          if (majorityReached) {
            // Beef is successfully decided
            return {
              steps: DEFAULT_STEPS,
              step: beefGone ? 7 : 6,
              actions: {
                owner: beefGone ? undefined : "serveBeef",
                challenger: beefGone ? undefined : "serveBeef",
              },
            }
          } else if (now > settleDeadline) {
            // Arbiters failed to vote and decide the beef
            return {
              steps: [
                { icon: "🥩", text: "Beef creation" },
                { icon: "🧑‍⚖️", text: "Arbiters attendance" },
                { icon: "🤺", text: "Challenger joining" },
                { icon: "👨‍🍳", text: "Beef cooking" },
                { icon: "🤦", text: "Beef wasn't settled" },
                { icon: "🤢", text: "Beef rotten" },
              ],
              step: beefGone ? 6 : 5,
              isRotten: true,
              actions: {
                owner: beefGone ? undefined : "withdrawRotten",
                challenger: beefGone ? undefined : "withdrawRotten",
              },
            }
          } else {
            // Voting in progress until `settleDeadline`
            return {
              steps: DEFAULT_STEPS,
              step: 4,
              deadline: settleDeadline,
              actions: {
                arbiter: "vote",
              },
            }
          }
        }
      } else {
        // Challenger has not yet joined the beef
        if (now < joinDeadline) {
          // Waiting for challenger to join
          return {
            steps: DEFAULT_STEPS,
            step: 2,
            deadline: joinDeadline,
            actions: {
              challenger: "joinBeef",
            },
          }
        } else {
          // Challenger failed to join in time
          return {
            steps: [
              { icon: "🥩", text: "Beef creation" },
              { icon: "🧑‍⚖️", text: "Arbiters attendance" },
              { icon: "🤦", text: "Challenger didn't join" },
              { icon: "🤢", text: "Beef raw forever" },
            ],
            step: beefGone ? 4 : 3,
            isRotten: true,
            actions: {
              owner: beefGone ? undefined : "withdrawRaw",
            },
          }
        }
      }
    }
  }

  const dateCases: Record<string, Date> = {
    "Challenger joining": joinDeadline,
    "Beef cooking": settleStart,
    "Beef settling": settleDeadline,
  }

  const { steps, step, isRotten, deadline, actions } = getBeefState()

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
            <Stack alignItems="flex-end" gap={2}>
              <Typography variant="h4">💸&nbsp;{formatEther(wager)}&nbsp;Ξ</Typography>
              {staking && (
                <Chip
                  sx={{ backgroundColor: "primary.main" }}
                  label={
                    <Typography fontWeight={500} color="white">
                      {"Steaked 🥩📈"}
                    </Typography>
                  }
                />
              )}
            </Stack>
          </Stack>
          <Typography variant="h5">{description}</Typography>
          <Typography variant="h3" whiteSpace="pre-line" pb={4}>
            {getAddressOrEnsName(owner, ensNames?.at(0))} 🥊 vs 🥊 {getAddressOrEnsName(challenger, ensNames?.at(1))}
          </Typography>

          <Stepper activeStep={step} alternativeLabel sx={{ width: "100%" }} connector={<BeefStepConnector />}>
            {steps.map((label, index) => {
              const stepDate = dateCases[label.text]?.toDateString()

              return (
                <Step key={label.text}>
                  <StepLabel
                    StepIconComponent={() => {
                      return StepIcon({
                        completed: step > index,
                        icon: label.icon,
                      })
                    }}
                  >
                    <Stack>
                      <Typography>{label.text}</Typography>
                      {stepDate && !isRotten && (
                        <Stack>
                          <Typography variant="body2">Deadline</Typography>
                          <Typography variant="body2">{stepDate}</Typography>
                        </Stack>
                      )}
                      {index === step && deadline !== undefined && (
                        <Typography sx={{ fontWeight: 600 }}>
                          <Countdown deadline={deadline} />
                        </Typography>
                      )}
                    </Stack>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>

          <Stack gap={1} alignItems={"stretch"} pt={6}>
            <Typography variant="h4" mb={1} alignSelf={"center"}>
              Arbiters
            </Typography>
            {step >= 4 && (
              <Typography variant="h6" whiteSpace="pre-line" alignSelf={"center"}>
                {resultYes.toString()} vote{resultYes > 1n ? "s" : ""} for ⚔️ {resultNo.toString()} vote
                {resultNo > 1n ? "s " : " "}
                against
              </Typography>
            )}
            {/* TODO: We can fetch more complex info about arbiters (e.g. their social credit) and display it here */}
            {arbiters.map(({ address, status }, index) => (
              <Stack direction={"row"} key={address} gap={1} justifyContent={"space-between"} alignItems="center">
                <Typography variant="subtitle2">
                  {getAddressOrEnsName(address, ensNames?.at(2 + index), false)}
                </Typography>

                {status && (
                  <Typography>
                    {step < 4
                      ? status === "attended"
                        ? "✅"
                        : "⌛"
                      : status === "voted_yes"
                        ? "👍🏽"
                        : status === "voted_no"
                          ? "👎🏽"
                          : "⌛"}
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
          <BeefControls
            {...{
              beef,
              beefActions: actions,
              refetch,
            }}
          />
        </Stack>
      </Paper>
    </Container>
  )
}

export default BeefDetailPage
