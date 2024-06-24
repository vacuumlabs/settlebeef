import React, { useContext } from "react"
import { Button, CircularProgress, Stack } from "@mui/material"
import { Address, isAddressEqual } from "viem"
import { BeefActions } from "@/app/beef/[id]/page"
import { useArbiterAttend, useJoinBeef, useSettleBeef, useWithdrawBeef } from "@/hooks/mutations"
import type { ArbiterType, Beef } from "@/types"
import { SmartAccountClientContext } from "./providers/SmartAccountClientContext"

type ButtonProps = {
  beefAddress: Address
  refetch: () => void
}

const WithdrawButton = ({
  beefAddress,
  refetch,
  type,
}: ButtonProps & { type: "withdrawRaw" | "withdrawRotten" | "serveBeef" }) => {
  const { mutate, isPending, isSuccess } = useWithdrawBeef(beefAddress, type)

  const selectText = () => {
    if (type === "withdrawRaw") {
      return "Withdraw Raw Beef"
    } else if (type === "withdrawRotten") {
      return "Withdraw Rotten Beef"
    } else {
      return "Serve Beef"
    }
  }

  const text = selectText()

  return (
    <Button
      onClick={() => mutate(undefined, { onSuccess: refetch })}
      disabled={isPending || isSuccess}
      variant="contained"
    >
      {text}
      {(isPending || isSuccess) && <CircularProgress size={20} sx={{ ml: 2 }} />}
    </Button>
  )
}

const ArbiterButton = ({ beefAddress, actionType, refetch }: ButtonProps & { actionType: "attend" | "vote" }) => {
  const {
    mutate: settleMutation,
    isPending: isSettlePending,
    isSuccess: isSettleSuccess,
    variables,
  } = useSettleBeef(beefAddress)
  const {
    mutate: attendMutation,
    isPending: isAttendPending,
    isSuccess: isAttendSuccess,
  } = useArbiterAttend(beefAddress)

  const isSettleLoading = isSettlePending || isSettleSuccess
  const isAttendLoading = isAttendPending || isAttendSuccess

  return actionType === "attend" ? (
    <Button
      variant="contained"
      disabled={isAttendLoading}
      onClick={() => attendMutation(undefined, { onSuccess: refetch })}
    >
      Attend ✋{isAttendLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
    </Button>
  ) : (
    <Stack direction="row" spacing={2}>
      <Button
        variant="contained"
        disabled={isSettleLoading}
        onClick={() => settleMutation(true, { onSuccess: refetch })}
      >
        Settle In Favour 👍
        {isSettleLoading && variables === true && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Button>
      <Button
        variant="contained"
        disabled={isSettleLoading}
        onClick={() => settleMutation(false, { onSuccess: refetch })}
      >
        Settle Against 👎
        {isSettleLoading && variables === false && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Button>
    </Stack>
  )
}

const ChallengerButton = ({ beefAddress, value, refetch }: ButtonProps & { value: bigint }) => {
  const { mutate, isPending, isSuccess } = useJoinBeef(beefAddress, value)

  return (
    <Button
      variant="contained"
      disabled={isPending || isSuccess}
      onClick={() => mutate(undefined, { onSuccess: refetch })}
    >
      Join Beef
      {(isPending || isSuccess) && <CircularProgress size={20} sx={{ ml: 2 }} />}
    </Button>
  )
}

type BeefControlsProps = {
  beef: Beef
  beefActions: BeefActions
  refetch: () => void
}

const BeefControls = ({ beef, beefActions, refetch }: BeefControlsProps) => {
  const { connectedAddress } = useContext(SmartAccountClientContext)

  if (connectedAddress === undefined) {
    return null
  }

  const { action, type } = decideAction(beef.owner, beef.challenger, beef.arbiters, beefActions, connectedAddress)

  // User is not a part of the beef - don't show anything
  if (action === undefined) {
    return null
  }

  return (
    <>
      {action === "arbiter" && <ArbiterButton refetch={refetch} beefAddress={beef.address} actionType={type} />}
      {action === "withdrawal" && <WithdrawButton refetch={refetch} beefAddress={beef.address} type={type} />}
      {action === "joinBeef" && <ChallengerButton refetch={refetch} beefAddress={beef.address} value={beef.wager} />}
      {action === "noAction" && (
        <Button disabled variant="outlined">
          Nothing to do
        </Button>
      )}
    </>
  )
}

const decideAction = (
  owner: Address,
  challenger: Address,
  arbiters: ArbiterType[],
  beefActions: BeefActions,
  userAddress: Address,
) => {
  const isUserChallenger = isAddressEqual(challenger, userAddress)
  const isUserOwner = isAddressEqual(owner, userAddress)

  // Responsibility for the status presence is delegated to the parent
  const userArbiter = arbiters.find(({ address }) => isAddressEqual(address, userAddress))

  // The user is not a part of the beef
  if (!isUserOwner && !isUserChallenger && userArbiter === undefined) {
    return {
      action: undefined,
      type: undefined,
    }
  }

  const noAction = {
    action: "noAction",
    type: undefined,
  } as const

  if (isUserOwner) {
    if (beefActions.owner === undefined) return noAction

    return {
      action: "withdrawal",
      type: beefActions.owner,
    } as const
  }

  if (isUserChallenger) {
    if (beefActions.challenger === undefined) return noAction

    if (beefActions.challenger === "joinBeef") {
      return {
        action: "joinBeef",
        type: undefined,
      } as const
    } else {
      return {
        action: "withdrawal",
        type: beefActions.challenger,
      } as const
    }
  }

  if (userArbiter?.status !== undefined) {
    const status = userArbiter.status

    if (beefActions.arbiter === "attend" && status === "none") {
      return {
        action: "arbiter",
        type: "attend",
      } as const
    }

    if (beefActions.arbiter === "vote" && status === "attended") {
      return {
        action: "arbiter",
        type: "vote",
      } as const
    }

    return noAction
  }

  return noAction
}

export default BeefControls
