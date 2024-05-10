import React, { useContext } from "react";
import { Button, Stack } from "@mui/material";
import {
  SmartAccountClient,
  SmartAccountClientContext,
} from "./providers/SmartAccountClientContext";
import { Address, Beef } from "@/types";
import { useGetArbiterStatus } from "@/hooks/queries";
import {
  useArbiterAttend,
  useJoinBeef,
  useSettleBeef,
  useWithdrawRaw,
} from "@/hooks/mutations";

type ButtonProps = {
  id: Address;
  enabled: boolean;
  client: SmartAccountClient;
};

const ArbiterButton = ({ client, id, enabled }: ButtonProps) => {
  const arbiterStatus = useGetArbiterStatus(id, client.account.address);
  const settleMutation = useSettleBeef(id, client);
  const attendMutation = useArbiterAttend(id, client);

  if (!arbiterStatus) {
    return <Button disabled={!enabled}>Nothing to do</Button>;
  }

  const { hasSettled, hasAttended } = arbiterStatus;

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
  enabled,
}: ButtonProps & { value: bigint; hasJoined: boolean }) => {
  const joinBeefMutation = useJoinBeef(id, value, client);

  return hasJoined ? (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  ) : (
    <Button onClick={() => joinBeefMutation.mutate()} disabled={!enabled}>
      Join Beef
    </Button>
  );
};

const OwnerButton = ({
  client,
  id,
  canWithdraw,
  enabled,
}: ButtonProps & { canWithdraw: boolean }) => {
  const withdrawMutation = useWithdrawRaw(id, client);
  return canWithdraw ? (
    <Button
      disabled={!enabled}
      onClick={() => withdrawMutation.mutate()}
      variant="outlined"
    >
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

  // TODO: proper condition
  const { isCooking, wager } = beef;
  const canWithdraw = true;

  return (
    client && (
      <Stack direction="row" spacing={2}>
        <ArbiterButton {...{ id, client }} enabled={isUserArbiter} />
        <FoeButton
          {...{ id, client, hasJoined: isCooking, value: wager }}
          enabled={isUserFoe}
        />
        <OwnerButton {...{ id, client, canWithdraw }} enabled={isUserOwner} />
      </Stack>
    )
  );
};

export default BeefControls;
