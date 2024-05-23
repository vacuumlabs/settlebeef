import React, { useContext } from "react";
import { Button, CircularProgress, Stack } from "@mui/material";
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

  const selectMutation = () => {
    if (canWithdrawRaw) {
      return {
        text: "Withdraw Raw Beef",
        mutation: withdrawRawMutation,
      };
    }

    if (canWithdrawRotten) {
      return {
        text: "Withdraw Rotten Beef",
        mutation: withdrawRottenMutation,
      };
    }

    if (canServe) {
      return {
        text: "Serve Beef",
        mutation: serveMutation,
      };
    }

    return { text: "Nothing to do" };
  };

  const { text, mutation } = selectMutation();

  return mutation ? (
    <Button
      disabled={mutation.isPending || mutation.isSuccess}
      onClick={() => mutation.mutate(undefined, { onSuccess: refetch })}
      variant="contained"
    >
      {text}
      {(mutation.isPending || mutation.isSuccess) && (
        <CircularProgress size={20} sx={{ ml: 2 }} />
      )}
    </Button>
  ) : (
    <Button disabled variant="outlined">
      {text}
    </Button>
  );
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
  const {
    mutate: settleMutation,
    isPending: isSettlePending,
    isSuccess: isSettleSuccess,
    variables,
  } = useSettleBeef(beefAddress);
  const {
    mutate: attendMutation,
    isPending: isAttendPending,
    isSuccess: isAttendSuccess,
  } = useArbiterAttend(beefAddress);

  const isSettleLoading = isSettlePending || isSettleSuccess;
  const isAttendLoading = isAttendPending || isAttendSuccess;

  if (!hasAttended && hasSettled === 0n) {
    return (
      <Button
        variant="contained"
        disabled={isAttendLoading}
        onClick={() => attendMutation(undefined, { onSuccess: refetch })}
      >
        Attend ✋
        {isAttendLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
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
          disabled={isSettleLoading}
          onClick={() => settleMutation(true, { onSuccess: refetch })}
        >
          Settle In Favour 👍
          {isSettleLoading && variables === true && (
            <CircularProgress size={20} sx={{ ml: 2 }} />
          )}
        </Button>
        <Button
          variant="contained"
          disabled={isSettleLoading}
          onClick={() => settleMutation(false, { onSuccess: refetch })}
        >
          Settle Against 👎
          {isSettleLoading && variables === false && (
            <CircularProgress size={20} sx={{ ml: 2 }} />
          )}
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
  const {
    mutate: joinMutation,
    isPending,
    isSuccess,
  } = useJoinBeef(beefAddress, value);

  // FIXME: FUTURE PROOF: remove the magic number and replace with data from cotract
  return hasJoined || attendCount < 3 ? (
    <Button disabled variant="outlined">
      Nothing to do
    </Button>
  ) : (
    <Button
      variant="contained"
      disabled={isPending || isSuccess}
      onClick={() => joinMutation(undefined, { onSuccess: refetch })}
    >
      Join Beef
      {(isPending || isSuccess) && (
        <CircularProgress size={20} sx={{ ml: 2 }} />
      )}
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
