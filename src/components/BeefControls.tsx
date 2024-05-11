import React, { useContext } from "react";
import { Button, Stack } from "@mui/material";
import {
  SmartAccountClient,
  SmartAccountClientContext,
} from "./providers/SmartAccountClientContext";
import type { Address, Beef, UnixTimestamp } from "@/types";
import { useGetArbiterStatuses } from "@/hooks/queries";
import {
  useArbiterAttend,
  useJoinBeef,
  useServeBeef,
  useSettleBeef,
  useWithdrawRaw,
  useWithdrawRotten,
} from "@/hooks/mutations";
import { parseIsoDateToTimestamp } from "@/utils/general";
import { DateTime } from "luxon";

type ButtonProps = {
  id: Address;
};

const WithdrawButton = ({ id, beef }: ButtonProps & { beef: Beef }) => {
  const {
    isCooking,
    joinDeadline,
    settleStart,
    resultYes,
    resultNo,
    arbiters,
  } = beef;

  const canWithdrawRaw =
    !isCooking &&
    parseIsoDateToTimestamp(DateTime.now().toISODate()) > joinDeadline;
  const canWithdrawRotten =
    isCooking &&
    parseIsoDateToTimestamp(DateTime.now().toISODate()) >
      settleStart + BigInt(30 * 24 * 60 * 60);
  const canServe =
    resultYes > Math.floor(arbiters.length / 2) ||
    resultNo > Math.floor(arbiters.length / 2);

  const withdrawRawMutation = useWithdrawRaw(id);
  const withdrawRottenMutation = useWithdrawRotten(id);
  const serveMutation = useServeBeef(id);

  if (canWithdrawRaw) {
    return (
      <Button onClick={() => withdrawRawMutation.mutate()} variant="outlined">
        Withdraw Raw Beef
      </Button>
    );
  } else if (canWithdrawRotten) {
    return (
      <Button
        onClick={() => withdrawRottenMutation.mutate()}
        variant="outlined"
      >
        Withdraw Rotten Beef
      </Button>
    );
  } else if (canServe) {
    return (
      <Button onClick={() => serveMutation.mutate()} variant="outlined">
        Serve Beef
      </Button>
    );
  } else {
    return (
      <Button disabled variant="outlined">
        Nothing to do
      </Button>
    );
  }
};

const ArbiterButton = ({
  connectedAddress,
  id,
  settleStart,
}: ButtonProps & { connectedAddress: Address; settleStart: UnixTimestamp }) => {
  const arbiterStatus = useGetArbiterStatuses(
    id,
    connectedAddress ? [connectedAddress] : [],
  );
  const settleMutation = useSettleBeef(id);
  const attendMutation = useArbiterAttend(id);

  if (!arbiterStatus?.[0]) {
    return <Button disabled>Nothing to do</Button>;
  }

  const { hasSettled, hasAttended } = arbiterStatus[0];

  if (!hasAttended && !hasSettled) {
    return <Button onClick={() => attendMutation.mutate()}>Attend ✋</Button>;
  } else if (
    hasAttended &&
    !hasSettled &&
    parseIsoDateToTimestamp(DateTime.now().toISODate()) > settleStart
  ) {
    return (
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => settleMutation.mutate(true)}>
          Settle In Favour 🧑‍⚖️{" "}
        </Button>
        <Button
          variant="contained"
          onClick={() => settleMutation.mutate(false)}
        >
          Settle Against 🧑‍⚖️{" "}
        </Button>
      </Stack>
    );
  } else {
    return (
      <Button disabled variant="outlined">
        Nothing to do
      </Button>
    );
  }
};

const ChallengerButton = ({
  id,
  value,
  hasJoined,
  attendCount,
}: ButtonProps & {
  value: bigint;
  hasJoined: boolean;
  attendCount: bigint;
}) => {
  const joinBeefMutation = useJoinBeef(id, value);

  // FIXME: FUTURE PROOF: remove the magic number and replace with data from cotract
  return hasJoined || attendCount < 3 ? (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  ) : (
    <Button variant="contained" onClick={() => joinBeefMutation.mutate()}>
      Join Beef
    </Button>
  );
};

const OwnerButton = ({
  id,
  canWithdraw,
}: ButtonProps & { canWithdraw: boolean }) => {
  const withdrawMutation = useWithdrawRaw(id);
  return canWithdraw ? (
    <Button onClick={() => withdrawMutation.mutate()} variant="contained">
      Withdraw Raw Beef
    </Button>
  ) : (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  );
};

type BeefControlsProps = {
  id: Address;
  beef: Beef;
  isUserArbiter: boolean;
  isUserChallenger: boolean;
  isUserOwner: boolean;
};

const BeefControls = ({
  id,
  beef,
  isUserArbiter,
  isUserChallenger,
  isUserOwner,
}: BeefControlsProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);

  const { isCooking, wager, joinDeadline, settleStart, attendCount } = beef;
  const canWithdraw =
    !isCooking &&
    isUserOwner &&
    joinDeadline < parseIsoDateToTimestamp(DateTime.now().toISODate());

  return (
    connectedAddress && (
      <Stack direction="row" spacing={2}>
        {isUserArbiter && (
          <ArbiterButton {...{ id, connectedAddress, settleStart }} />
        )}
        {isUserChallenger && (
          <ChallengerButton
            {...{ id, hasJoined: isCooking, value: wager, attendCount }}
          />
        )}
        {isUserOwner && <OwnerButton {...{ id, canWithdraw }} />}
        <WithdrawButton {...{ id, beef }} />
      </Stack>
    )
  );
};

export default BeefControls;
