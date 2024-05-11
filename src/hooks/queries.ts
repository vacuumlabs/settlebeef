import { useReadContract, useReadContracts } from "wagmi";
import type { Address, Beef } from "../types";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { SLAUGHTERHOUSE_ADDRESS } from "@/config";
import { beefAbi } from "@/abi/beef";
import { useContext } from "react";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { ensConfig, wagmiConfig } from "@/components/providers/Providers";
import { getBalance, getEnsName } from "wagmi/actions";

export const useEnsName = (address: Address | undefined) => {
  return useQuery({
    queryKey: ["ensName", address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      return getEnsName(ensConfig, { address });
    },
    enabled: !!address,
  });
};

export const useEnsNames = (addresses: (Address | undefined)[]) => {
  return useQuery({
    queryKey: ["ensName", ...addresses],
    queryFn: async () => {
      const ensNameQueries = addresses.map((address) =>
        address == null
          ? Promise.resolve(null)
          : getEnsName(ensConfig, { address })
      );

      const ensNames = await Promise.all(ensNameQueries);

      return ensNames;
    },
    enabled: addresses.length > 0,
  });
};

export const useBeef = (id: string): Beef | null | undefined => {
  const { data, isError } = useReadContract({
    abi: beefAbi,
    address: id as Address,
    functionName: "getInfo",
    query: {
      enabled: id.startsWith("0x"),
    },
  });

  if (isError) {
    return undefined;
  }

  return data != null
    ? {
        ...data.params,
        arbiters: [...data.params.arbiters],
        address: id,
        isCooking: data.cooking,
        resultYes: data.resultYes,
        resultNo: data.resultNo,
        attendCount: data.attendCount,
      }
    : null;
};

const useGetBeefsArray = () => {
  return useReadContract({
    abi: slaughterhouseAbi,
    address: SLAUGHTERHOUSE_ADDRESS,
    functionName: "getBeefs",
  });
};

export const useGetBeefs = () => {
  const { data: beefAddresses } = useGetBeefsArray();

  const query = useReadContracts({
    contracts:
      beefAddresses?.map(
        (address) =>
          ({
            abi: beefAbi,
            address,
            functionName: "getInfo",
          }) as const
      ) ?? [],
    query: { enabled: !!beefAddresses },
    allowFailure: false,
  });
  return {
    ...query,
    data:
      beefAddresses &&
      query.data?.map((beef, index) => ({
        ...beef,
        address: beefAddresses[index]!,
      })),
  };
};

export const useGetArbiterStatuses = (
  beefId: Address,
  arbiterAddresses: Address[]
) => {
  const { data } = useReadContracts({
    contracts: [
      ...arbiterAddresses.flatMap((arbiterAddress) => [
        {
          abi: beefAbi,
          address: beefId,
          functionName: "hasAttended",
          args: [arbiterAddress],
        } as const,
        {
          abi: beefAbi,
          address: beefId,
          functionName: "hasSettled",
          args: [arbiterAddress],
        } as const,
        {
          abi: slaughterhouseAbi,
          address: SLAUGHTERHOUSE_ADDRESS,
          functionName: "streetCredit",
          args: [arbiterAddress],
        } as const,
      ]),
    ],
    allowFailure: false,
  });

  return data != null
    ? data
        .reduce(
          (acc, curr, idx) => {
            if (idx % 3 === 0) {
              acc.push([curr] as unknown as [boolean, bigint, bigint]);
            } else {
              acc[acc.length - 1]?.push(curr);
            }
            return acc;
          },
          [] as Array<[boolean, bigint, bigint]>
        )
        .map(([hasAttended, hasSettled, streetCredit]) => ({
          hasAttended,
          hasSettled,
          streetCredit,
        }))
    : undefined;
};

export const useBalance = () => {
  const { connectedAddress } = useContext(SmartAccountClientContext);

  return useQuery({
    queryKey: [queryKeys.balance, connectedAddress],
    queryFn: () =>
      getBalance(wagmiConfig, {
        address: connectedAddress!,
      }),
    enabled: !!connectedAddress,
  });
};
