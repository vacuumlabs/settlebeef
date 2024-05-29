import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { beefAbi } from "@/abi/beef";
import { NewBeefFormValues } from "@/app/beef/new/page";
import {
  SLAUGHTERHOUSE_ADDRESS,
  UNISWAP_ROUTER_ADDRESS,
  WETH_ADDRESS,
  WSTETH_ADDRESS,
} from "@/config";
import { ArbiterAccount } from "@/types";
import { getUserGeneratedAddress } from "@/utils/generateUserAddress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { Address, encodeFunctionData, erc20Abi, isAddress } from "viem";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { parseIsoDateToTimestamp } from "@/utils/general";
import { queryKeys } from "./queryKeys";
import { sendBeefRequestEmail } from "@/server/actions/sendBeefRequestEmail";
import { readContract, readContracts } from "wagmi/actions";
import { uniswapV2RouterAbi } from "@/abi/uniswapV2Router";
import { wagmiConfig } from "@/components/providers/Providers";
import { subtractSlippage } from "@/utils/slippage";
import { generateAddressFromTwitterHandle } from "@/server/actions/generateAddressFromTwitterHandle";

const mutationKeys = {
  arbiterAttend: "arbiterAttend",
  withdrawBeef: "withdrawBeef",
  settleBeef: "settleBeef",
  joinBeef: "joinBeef",
};

export const useArbiterAttend = (beefId: Address) => {
  const { sendTransaction, connectedAddress } = useContext(
    SmartAccountClientContext,
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [mutationKeys.arbiterAttend, connectedAddress, beefId],
    mutationFn: async () => {
      const txHash = await sendTransaction({
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
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] });
    },
  });
};

export const useSettleBeef = (beefId: Address) => {
  const { sendTransaction } = useContext(SmartAccountClientContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [mutationKeys.settleBeef, beefId],
    mutationFn: async (verdict: boolean) => {
      const txHash = await sendTransaction({
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
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] });
    },
  });
};

export const useJoinBeef = (beefId: Address, value: bigint) => {
  const { sendTransaction } = useContext(SmartAccountClientContext);
  const queryClient = useQueryClient();

  const joinBeef = async () => {
    const [wager, staking] = await readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: [
        {
          abi: beefAbi,
          address: beefId,
          functionName: "wager",
        },
        {
          abi: beefAbi,
          address: beefId,
          functionName: "staking",
        },
      ],
    });

    const amountOut = staking
      ? (
          await readContract(wagmiConfig, {
            address: UNISWAP_ROUTER_ADDRESS,
            abi: uniswapV2RouterAbi,
            functionName: "getAmountsOut",
            args: [wager, [WETH_ADDRESS, WSTETH_ADDRESS]],
          })
        )[1]!
      : BigInt(0);

    const txHash = await sendTransaction({
      to: beefId,
      value,
      data: encodeFunctionData({
        abi: beefAbi,
        functionName: "joinBeef",
        args: [subtractSlippage(amountOut)],
      }),
    });

    return txHash;
  };

  return useMutation({
    mutationKey: [mutationKeys.joinBeef, beefId],
    mutationFn: joinBeef,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] });
    },
  });
};

export const useAddBeef = () => {
  const { sendTransaction, connectedAddress } = useContext(
    SmartAccountClientContext,
  );
  const queryClient = useQueryClient();

  const addBeef = async ({
    arbiters,
    title,
    description,
    wager,
    settleStart,
    joinDeadline,
    challenger,
    staking,
  }: NewBeefFormValues) => {
    if (!connectedAddress) {
      throw new Error("Wallet not connected");
    }
    if (!challenger || !isAddress(challenger.value) || !wager) {
      throw new Error("Invalid request");
    }

    arbiters.forEach((arbiter) => {
      if (arbiter.type === ArbiterAccount.EMAIL) {
        sendBeefRequestEmail(arbiter.value);
      }
    });

    const addressPromises = arbiters.map(({ type, value }) => {
      if (type === ArbiterAccount.TWITTER) {
        return generateAddressFromTwitterHandle(value);
      } else if (type === ArbiterAccount.EMAIL) {
        return getUserGeneratedAddress([
          {
            address: value,
            type: "email" as const,
          },
        ]);
      } else {
        return value as Address;
      }
    });

    const arbitersAddresses = await Promise.all(addressPromises);

    const amountOut = staking
      ? (
          await readContract(wagmiConfig, {
            address: UNISWAP_ROUTER_ADDRESS,
            abi: uniswapV2RouterAbi,
            functionName: "getAmountsOut",
            args: [wager, [WETH_ADDRESS, WSTETH_ADDRESS]],
          })
        )[1]!
      : BigInt(0);

    return sendTransaction({
      to: SLAUGHTERHOUSE_ADDRESS,
      value: wager,
      data: encodeFunctionData({
        abi: slaughterhouseAbi,
        functionName: "packageBeef",
        args: [
          {
            owner: connectedAddress,
            wager,
            challenger: challenger.value as Address,
            settleStart: parseIsoDateToTimestamp(settleStart),
            joinDeadline: parseIsoDateToTimestamp(joinDeadline),
            title,
            description,
            arbiters: arbitersAddresses,
            staking,
          },
          subtractSlippage(amountOut),
        ],
      }),
    });
  };

  return useMutation({
    mutationFn: addBeef,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] });
    },
  });
};

const getWithdrawAmountOut = async (beefAddress: Address) => {
  const [wstEthBalance, staking] = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: [
      {
        abi: erc20Abi,
        address: WSTETH_ADDRESS,
        functionName: "balanceOf",
        args: [beefAddress],
      },
      {
        abi: beefAbi,
        address: beefAddress,
        functionName: "staking",
      },
    ],
  });

  const amountOut = staking
    ? (
        await readContract(wagmiConfig, {
          address: UNISWAP_ROUTER_ADDRESS,
          abi: uniswapV2RouterAbi,
          functionName: "getAmountsOut",
          args: [wstEthBalance, [WSTETH_ADDRESS, WETH_ADDRESS]],
        })
      )[1]!
    : BigInt(0);

  return subtractSlippage(amountOut);
};

export const useWithdrawBeef = (
  beefId: Address,
  withdrawType: "withdrawRaw" | "withdrawRotten" | "serveBeef",
) => {
  const { sendTransaction } = useContext(SmartAccountClientContext);
  const queryClient = useQueryClient();

  const executeMutation = async () => {
    const amountOut = await getWithdrawAmountOut(beefId);

    const txHash = await sendTransaction({
      to: beefId,
      data: encodeFunctionData({
        abi: beefAbi,
        functionName: withdrawType,
        args: [amountOut],
      }),
    });

    return txHash;
  };

  return useMutation({
    mutationFn: executeMutation,
    mutationKey: [beefId, withdrawType],
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.balance] });
    },
  });
};
