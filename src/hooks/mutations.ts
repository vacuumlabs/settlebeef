import {
  SmartAccountClient,
  SmartAccountClientContext,
} from "@/components/providers/SmartAccountClientContext";
import { beefAbi } from "@/abi/beef";
import type { Address } from "@/types";
import { NewBeefFormValues } from "@/app/beef/new/page";
import { SLAUGHTERHOUSE_ADDRESS } from "@/config";
import { ArbiterAccount } from "@/types";
import { getUserGeneratedAddress } from "@/utils/generateUserAddress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { encodeFunctionData, isAddress } from "viem";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { parseIsoDateToTimestamp } from "@/utils/general";

export const useArbiterAttend = (
  beefId: Address,
  client: SmartAccountClient
) => {
  return useMutation({
    mutationFn: async () => {
      const txHash = await client.sendTransaction({
        to: beefId,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "arbiterAttend",
          args: [],
        }),
      });

      return txHash;
    },
    onSuccess() {
      // FIXME:invalidate QueryClient
    },
  });
};

export const useSettleBeef = (beefId: Address, client: SmartAccountClient) => {
  return useMutation({
    mutationFn: async (verdict: boolean) => {
      const txHash = await client.sendTransaction({
        to: beefId,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "settleBeef",
          args: [verdict],
        }),
      });

      return txHash;
    },
    onSuccess() {
      // FIXME:invalidate QueryClient
    },
  });
};

export const useJoinBeef = (
  beefId: Address,
  value: bigint,
  client: SmartAccountClient
) => {
  return useMutation({
    mutationFn: async () => {
      const txHash = await client.sendTransaction({
        to: beefId,
        value,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "joinBeef",
          args: [],
        }),
      });

      return txHash;
    },
    onSuccess() {
      // FIXME:invalidate QueryClient
    },
  });
};

export const useWithdrawRaw = (beefId: Address, client: SmartAccountClient) => {
  return useMutation({
    mutationFn: async () => {
      const txHash = await client.sendTransaction({
        to: beefId,
        data: encodeFunctionData({
          abi: beefAbi,
          functionName: "withdrawRaw",
          args: [],
        }),
      });

      return txHash;
    },
    onSuccess() {
      // FIXME:invalidate QueryClient
    },
  });
};

export const useAddBeef = () => {
  const { client } = useContext(SmartAccountClientContext);
  const queryClient = useQueryClient();

  const addBeef = async ({
    arbiters,
    title,
    description,
    wager,
    settleStart,
    joinDeadline,
    foe,
  }: NewBeefFormValues) => {
    if (!client) {
      throw new Error("Client not connected");
    }
    if (!foe || !isAddress(foe) || !wager) {
      throw new Error("Invalid request");
    }

    const addressPromises = arbiters
      .map(({ type, value }) =>
        type === ArbiterAccount.ADDRESS
          ? [
              {
                address: value,
                type: "wallet" as const,
                chainType: "ethereum" as const,
              },
            ]
          : [
              {
                address: value,
                type: "email" as const,
              },
            ]
      )
      .map(getUserGeneratedAddress);

    const arbitersAddresses = await Promise.all(addressPromises);

    return client.sendTransaction({
      to: SLAUGHTERHOUSE_ADDRESS,
      value: wager,
      data: encodeFunctionData({
        abi: slaughterhouseAbi,
        functionName: "packageBeef",
        args: [
          {
            owner: client.account.address,
            wager,
            foe,
            settleStart: parseIsoDateToTimestamp(settleStart),
            joinDeadline: parseIsoDateToTimestamp(joinDeadline),
            title,
            description,
            arbiters: arbitersAddresses,
          },
        ],
      }),
    });
  };

  return useMutation({
    mutationFn: addBeef,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [""] });
    },
  });
};
