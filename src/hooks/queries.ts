import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { getBalance, getEnsName } from "wagmi/actions";
import { beefAbi } from "@/abi/beef";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { ensConfig, wagmiConfig } from "@/components/providers/Providers";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { SLAUGHTERHOUSE_ADDRESS } from "@/constants";
import type { Beef } from "@/types";
import { queryKeys } from "./queryKeys";

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
          : getEnsName(ensConfig, { address }),
      );

      const ensNames = await Promise.all(ensNameQueries);

      return ensNames;
    },
    enabled: addresses.length > 0,
  });
};

export const useBeef = (
  address: Address,
): (Beef & { refetch: () => Promise<unknown> }) | null | undefined => {
  const { data, isError, refetch } = useReadContract({
    abi: beefAbi,
    address,
    functionName: "getInfo",
    query: {
      enabled: isAddress(address),
    },
  });

  if (isError) {
    return undefined;
  }

  return data != null
    ? {
        refetch,
        ...data.params,
        arbiters: [...data.params.arbiters],
        address,
        isCooking: data.cooking,
        resultYes: data.resultYes,
        resultNo: data.resultNo,
        attendCount: data.attendCount,
        beefGone: data.beefGone,
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

  const beefContractCalls =
    beefAddresses?.map((address) => {
      return {
        abi: beefAbi,
        address,
        functionName: "getInfo",
      } as const;
    }) ?? [];

  const query = useReadContracts({
    contracts: beefContractCalls,
    query: { enabled: !!beefAddresses },
    allowFailure: false,
  });

  const dataWithAddress =
    beefAddresses &&
    query.data?.map((beef, index) => ({
      ...beef,
      address: beefAddresses[index]!,
    }));

  return {
    ...query,
    data: dataWithAddress,
  };
};

export type ArbiterStatus = {
  address: Address;
  // Status is undefined while its being fetched.
  status?: {
    hasAttended: boolean;
    hasSettled: bigint;
    streetCredit: bigint;
  };
};

export const useGetArbiterStatuses = (
  beefAddress: Address,
  arbiters: readonly Address[],
) => {
  const { data, refetch } = useReadContracts({
    contracts: arbiters.flatMap((arbiterAddress) => [
      {
        abi: beefAbi,
        address: beefAddress,
        functionName: "hasAttended",
        args: [arbiterAddress],
      } as const,
      {
        abi: beefAbi,
        address: beefAddress,
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
    allowFailure: false,
  });

  if (data) {
    // Chunk data to groups of 3 elements (one readContract call)
    const chunkedData = Array.from(
      { length: Math.ceil(data.length / 3) },
      (_, index) => data.slice(index * 3, index * 3 + 3),
    );

    const groupedData: ArbiterStatus[] = chunkedData.map(
      ([hasAttended, hasSettled, streetCredit], index) => {
        return {
          address: arbiters[index]!,
          status: {
            hasAttended: hasAttended as boolean,
            hasSettled: hasSettled as bigint,
            streetCredit: streetCredit as bigint,
          },
        };
      },
    );

    return {
      data: groupedData,
      refetch,
    };
  } else {
    return {
      data: arbiters.map((arbiter) => ({
        address: arbiter,
        status: undefined,
      })),
      refetch: undefined,
    };
  }
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
