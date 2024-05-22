import React, { useContext } from "react";
import { Button, Stack } from "@mui/material";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";
import type { Beef, UnixTimestamp } from "@/types";
import { ArbiterStatus } from "@/hooks/queries";
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
import { Address, isAddressEqual, zeroAddress } from "viem";

type ButtonProps = {
  refetch: () => void;
};

const WithdrawButton = ({ beef, refetch }: ButtonProps & { beef: Beef }) => {
  const {
    address,
    isCooking,
    joinDeadline,
    settleStart,
    resultYes,
    resultNo,
    arbiters,
  } = beef;

  const canWithdrawRaw =
    !isCooking &&
    parseIsoDateToTimestamp(DateTime.now().toISO()) > joinDeadline;
  const canWithdrawRotten =
    isCooking &&
    parseIsoDateToTimestamp(DateTime.now().toISO()) >
      settleStart + BigInt(30 * 24 * 60 * 60);
  const canServe =
    resultYes > Math.floor(arbiters.length / 2) ||
    resultNo > Math.floor(arbiters.length / 2);

  const withdrawRawMutation = useWithdrawRaw(address);
  const withdrawRottenMutation = useWithdrawRotten(address);
  const serveMutation = useServeBeef(address);

  if (canWithdrawRaw) {
    return (
      <Button
        onClick={() =>
          withdrawRawMutation.mutate(undefined, { onSuccess: refetch })
        }
        variant="contained"
      >
        Withdraw Raw Beef
      </Button>
    );
  } else if (canWithdrawRotten) {
    return (
      <Button
        onClick={() =>
          withdrawRottenMutation.mutate(undefined, { onSuccess: refetch })
        }
        variant="contained"
      >
        Withdraw Rotten Beef
      </Button>
    );
  } else if (canServe) {
    return (
      <Button
        onClick={() => serveMutation.mutate(undefined, { onSuccess: refetch })}
        variant="contained"
      >
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
  beefAddress,
  hasAttended,
  hasSettled,
  settleStart,
  refetch,
}: ButtonProps & {
  beefAddress: Address;
  hasSettled: bigint;
  hasAttended: boolean;
  settleStart: UnixTimestamp;
}) => {
  const settleMutation = useSettleBeef(beefAddress);
  const attendMutation = useArbiterAttend(beefAddress);

  if (!hasAttended && hasSettled === 0n) {
    return (
      <Button
        onClick={() => attendMutation.mutate(undefined, { onSuccess: refetch })}
      >
        Attend ✋
      </Button>
    );
  } else if (
    hasAttended &&
    hasSettled === 0n &&
    parseIsoDateToTimestamp(DateTime.now().toISO()) > settleStart
  ) {
    return (
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={() => settleMutation.mutate(true, { onSuccess: refetch })}
        >
          Settle In Favour 👍
        </Button>
        <Button
          variant="contained"
          onClick={() => settleMutation.mutate(false, { onSuccess: refetch })}
        >
          Settle Against 👎
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
  beefAddress,
  value,
  hasJoined,
  attendCount,
  refetch,
}: ButtonProps & {
  beefAddress: Address;
  value: bigint;
  hasJoined: boolean;
  attendCount: bigint;
}) => {
  const joinBeefMutation = useJoinBeef(beefAddress, value);

  // FIXME: FUTURE PROOF: remove the magic number and replace with data from cotract
  return hasJoined || attendCount < 3 ? (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  ) : (
    <Button
      variant="contained"
      onClick={() => joinBeefMutation.mutate(undefined, { onSuccess: refetch })}
    >
      Join Beef
    </Button>
  );
};

type BeefControlsProps = {
  beef: Beef;
  arbiterStatuses: ArbiterStatus[];
  refetch: () => void;
};

const BeefControls = ({
  beef,
  arbiterStatuses,
  refetch,
}: BeefControlsProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext);

  const {
    isCooking,
    wager,
    settleStart,
    attendCount,
    beefGone,
    challenger,
    owner,
  } = beef;

  const isUserChallenger = isAddressEqual(
    challenger,
    connectedAddress ?? zeroAddress,
  );
  const isUserOwner = isAddressEqual(owner, connectedAddress ?? zeroAddress);

  const showWithdrawButton = !beefGone && (isUserOwner || isUserChallenger);

  // Responsibility for the status presence is delegated to the parent
  const userArbiter = arbiterStatuses.find(({ address }) =>
    isAddressEqual(address, connectedAddress ?? zeroAddress),
  );

  return (
    connectedAddress && (
      <Stack direction="row" spacing={2}>
        {userArbiter?.status && (
          <ArbiterButton
            {...{
              beefAddress: beef.address,
              connectedAddress,
              settleStart,
              hasAttended: userArbiter.status.hasAttended,
              hasSettled: userArbiter.status.hasSettled,
              refetch,
            }}
          />
        )}
        {isUserChallenger && !(isCooking || attendCount < 3) && (
          <ChallengerButton
            {...{
              beefAddress: beef.address,
              hasJoined: isCooking,
              value: wager,
              attendCount,
              refetch,
            }}
          />
        )}
        {showWithdrawButton && <WithdrawButton {...{ beef, refetch }} />}
      </Stack>
    )
  );
};

export default BeefControls;
