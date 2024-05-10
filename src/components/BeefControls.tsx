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
  useSettleBeef,
  useWithdrawRaw,
} from "@/hooks/mutations";
import { parseIsoDateToTimestamp } from "@/utils/general";
import { DateTime } from "luxon";

type ButtonProps = {
  id: Address;
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
        <Button onClick={() => settleMutation.mutate(true)}>
          Settle In Favour 🧑‍⚖️{" "}
        </Button>
        <Button onClick={() => settleMutation.mutate(false)}>
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

const FoeButton = ({
  id,
  value,
  hasJoined,
}: ButtonProps & { value: bigint; hasJoined: boolean }) => {
  const joinBeefMutation = useJoinBeef(id, value);

  return hasJoined ? (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  ) : (
    <Button onClick={() => joinBeefMutation.mutate()}>Join Beef</Button>
  );
};

const OwnerButton = ({
  id,
  canWithdraw,
}: ButtonProps & { canWithdraw: boolean }) => {
  const withdrawMutation = useWithdrawRaw(id);
  return canWithdraw ? (
    <Button onClick={() => withdrawMutation.mutate()} variant="outlined">
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
  isUserFoe: boolean;
  isUserOwner: boolean;
};

const BeefControls = ({
  id,
  beef,
  isUserArbiter,
  isUserFoe,
  isUserOwner,
}: BeefControlsProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);

  const { isCooking, wager, joinDeadline, settleStart } = beef;
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
        {isUserFoe && (
          <FoeButton {...{ id, hasJoined: isCooking, value: wager }} />
        )}
        {isUserOwner && <OwnerButton {...{ id, canWithdraw }} />}
      </Stack>
    )
  );
};

export default BeefControls;
