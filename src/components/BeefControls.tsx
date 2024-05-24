import React, { useContext } from "react";
import { Button, CircularProgress, Stack } from "@mui/material";
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext";
import type { Beef } from "@/types";
import { ArbiterStatus } from "@/hooks/queries";
import {
  useArbiterAttend,
  useJoinBeef,
  useSettleBeef,
  useWithdrawBeef,
} from "@/hooks/mutations";
import { parseIsoDateToTimestamp } from "@/utils/general";
import { DateTime } from "luxon";
import { Address, isAddressEqual } from "viem";

type ButtonProps = {
  beefAddress: Address;
  refetch: () => void;
};

const WithdrawButton = ({
  beefAddress,
  refetch,
  type,
}: ButtonProps & { type: "withdrawRaw" | "withdrawRotten" | "serveBeef" }) => {
  const { mutate, isPending, isSuccess } = useWithdrawBeef(beefAddress, type);

  const selectText = () => {
    if (type === "withdrawRaw") {
      return "Withdraw Raw Beef";
    } else if (type === "withdrawRotten") {
      return "Withdraw Rotten Beef";
    } else {
      return "Serve Beef";
    }
  };

  const text = selectText();

  return (
    <Button
      onClick={() => mutate(undefined, { onSuccess: refetch })}
      disabled={isPending || isSuccess}
      variant="contained"
    >
      {text}
      {(isPending || isSuccess) && (
        <CircularProgress size={20} sx={{ ml: 2 }} />
      )}
    </Button>
  );
};

const ArbiterButton = ({
  beefAddress,
  actionType,
  refetch,
}: ButtonProps & { actionType: "attend" | "vote" }) => {
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

  return actionType === "attend" ? (
    <Button
      variant="contained"
      disabled={isAttendLoading}
      onClick={() => attendMutation(undefined, { onSuccess: refetch })}
    >
      Attend ✋
      {isAttendLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
    </Button>
  ) : (
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
};

const ChallengerButton = ({
  beefAddress,
  value,
  refetch,
}: ButtonProps & { value: bigint }) => {
  const { mutate, isPending, isSuccess } = useJoinBeef(beefAddress, value);

  return (
    <Button
      variant="contained"
      disabled={isPending || isSuccess}
      onClick={() => mutate(undefined, { onSuccess: refetch })}
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

  if (connectedAddress === undefined) {
    return null;
  }

  const { action, type } = decideAction(
    beef,
    arbiterStatuses,
    connectedAddress,
  );

  // User is not a part of the beef - don't show anything
  if (action === undefined) {
    return null;
  }

  return (
    <>
      {action === "arbiter" && (
        <ArbiterButton
          refetch={refetch}
          beefAddress={beef.address}
          actionType={type}
        />
      )}
      {action === "withdrawal" && (
        <WithdrawButton
          refetch={refetch}
          beefAddress={beef.address}
          type={type}
        />
      )}
      {action === "joinBeef" && (
        <ChallengerButton
          refetch={refetch}
          beefAddress={beef.address}
          value={beef.wager}
        />
      )}
      {action === "noAction" && (
        <Button disabled variant="outlined">
          Nothing to do
        </Button>
      )}
    </>
  );
};

const decideAction = (
  beef: Beef,
  arbiterStatuses: ArbiterStatus[],
  userAddress: Address,
) => {
  const {
    challenger,
    owner,
    beefGone,
    settleStart,
    isCooking,
    attendCount,
    joinDeadline,
  } = beef;

  const nowTimestamp = parseIsoDateToTimestamp(DateTime.now().toISO());
  const hasPassedJoinDeadline = nowTimestamp > joinDeadline;
  const hasPassedSettleDeadline =
    nowTimestamp > settleStart + BigInt(30 * 24 * 60 * 60);

  const isUserChallenger = isAddressEqual(challenger, userAddress);
  const isUserOwner = isAddressEqual(owner, userAddress);

  const showWithdrawButton = !beefGone && (isUserOwner || isUserChallenger);

  // Responsibility for the status presence is delegated to the parent
  const userArbiter = arbiterStatuses.find(({ address }) =>
    isAddressEqual(address, userAddress),
  );

  // The user is not a part of the beef
  if (!isUserOwner && !isUserChallenger && userArbiter === undefined) {
    return {
      action: undefined,
      type: undefined,
    };
  }

  const noAction = {
    action: "noAction",
    type: undefined,
  } as const;

  if (showWithdrawButton) {
    const withdrawalType = getWithdrawalType(
      beef,
      hasPassedJoinDeadline,
      hasPassedSettleDeadline,
    );

    if (withdrawalType !== undefined) {
      return {
        action: "withdrawal",
        type: withdrawalType,
      } as const;
    }

    return noAction;
  }

  if (userArbiter?.status !== undefined) {
    const { hasAttended, hasSettled } = userArbiter.status;

    const arbiterType = getArbiterType(
      hasAttended,
      hasSettled,
      hasPassedJoinDeadline,
      hasPassedSettleDeadline,
    );

    if (arbiterType !== undefined) {
      return {
        action: "arbiter",
        type: arbiterType,
      } as const;
    }

    return noAction;
  }

  // FIXME: FUTURE PROOF: remove the magic number and replace with data from cotract
  if (
    isUserChallenger &&
    !(isCooking || attendCount < 3) &&
    !hasPassedJoinDeadline
  ) {
    return {
      action: "joinBeef",
      type: undefined,
    } as const;
  }

  return noAction;
};

const getWithdrawalType = (
  { isCooking, resultYes, resultNo, arbiters }: Beef,
  hasPassedJoinDeadline: boolean,
  hasPassedSettleDeadline: boolean,
) => {
  const quorum = Math.floor(arbiters.length / 2);
  const majorityReached = resultYes > quorum || resultNo > quorum;

  if (!isCooking && hasPassedJoinDeadline) {
    return "withdrawRaw";
  } else if (isCooking && hasPassedSettleDeadline) {
    return "withdrawRotten";
  } else if (majorityReached) {
    return "serveBeef";
  }

  return undefined;
};

const getArbiterType = (
  hasAttended: boolean,
  hasSettled: bigint,
  hasPassedJoinDeadline: boolean,
  hasPassedSettleDeadline: boolean,
) => {
  if (hasSettled !== 0n) return undefined;

  if (!hasAttended && !hasPassedJoinDeadline) {
    return "attend";
  } else if (hasAttended && !hasPassedSettleDeadline) {
    return "vote";
  }

  return undefined;
};

export default BeefControls;
