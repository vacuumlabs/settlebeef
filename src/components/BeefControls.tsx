import React, { useContext } from "react";
import { Button, Stack } from "@mui/material";
import {
  SmartAccountClient,
  SmartAccountClientContext,
} from "./providers/SmartAccountClientContext";
import { Address, Beef } from "@/types";
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
  client: SmartAccountClient;
};

const ArbiterButton = ({ client, id }: ButtonProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);

  const arbiterStatus = useGetArbiterStatuses(
    id,
    connectedAddress ? [connectedAddress] : []
  );
  const settleMutation = useSettleBeef(id);
  const attendMutation = useArbiterAttend(id);

  if (!arbiterStatus?.[0]) {
    return <Button disabled>Nothing to do</Button>;
  }

  const { hasSettled, hasAttended } = arbiterStatus[0];

  if (!hasAttended && !hasSettled) {
    return <Button onClick={() => attendMutation.mutate()}>Attend ✋</Button>;
  } else if (hasAttended && !hasSettled) {
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
  }
};

const FoeButton = ({
  client,
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
  client,
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
  const { client } = useContext(SmartAccountClientContext);

  const { isCooking, wager, joinDeadline } = beef;
  const canWithdraw =
    !isCooking &&
    isUserOwner &&
    joinDeadline * 1000n <
      BigInt(parseIsoDateToTimestamp(DateTime.now().toISODate()));

  return (
    client && (
      <Stack direction="row" spacing={2}>
        {isUserArbiter && <ArbiterButton {...{ id, client }} />}
        {isUserFoe && (
          <FoeButton {...{ id, client, hasJoined: isCooking, value: wager }} />
        )}
        {isUserOwner && <OwnerButton {...{ id, client, canWithdraw }} />}
      </Stack>
    )
  );
};

export default BeefControls;
