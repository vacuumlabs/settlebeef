import { SmartAccountClient } from "@/components/providers/SmartAccountClientContext";
import { encodeFunctionData } from "viem";
import { beefAbi } from "@/abi/beef";
import type { Address } from "@/types";
import { useMutation } from "@tanstack/react-query";

export const useArbiterAttend = (
  beefId: Address,
  client: SmartAccountClient,
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
  client: SmartAccountClient,
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
