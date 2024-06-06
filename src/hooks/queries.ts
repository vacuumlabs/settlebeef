import { useContext } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { getEnsName, readContract, readContracts } from "wagmi/actions";
import { beefAbi } from "@/abi/beef";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { ensConfig, wagmiConfig } from "@/components/providers/Providers";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { SLAUGHTERHOUSE_ADDRESS } from "@/constants";
import type { Beef } from "@/types";
import { publicClient } from "@/utils/chain";
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

const getBeefsSlice = async (from: number, to: number) => {
  return await readContract(wagmiConfig, {
    abi: slaughterhouseAbi,
    address: SLAUGHTERHOUSE_ADDRESS,
    functionName: "getBeefsSlice",
    args: [BigInt(from), BigInt(to)],
  });
};

// Gets total number of beefs in the contract
export const useBeefsLength = () => {
  return useReadContract({
    abi: slaughterhouseAbi,
    address: SLAUGHTERHOUSE_ADDRESS,
    functionName: "getBeefsLength",
    query: { select: (data) => Number(data) },
  });
};

export const useGetInfiniteBeefs = (pageSize: number) => {
  const { data: beefsLength } = useBeefsLength();

  const fetchBeefs = async ({ pageParam: page }: { pageParam: number }) => {
    if (beefsLength === undefined) return null;

    const to = beefsLength - page * pageSize;
    const from = Math.max(0, to - pageSize);

    if (to <= 0) return null;

    const addresses = await getBeefsSlice(from, to);

    const contractCalls = addresses.map((address) => {
      return {
        abi: beefAbi,
        address,
        functionName: "getInfo",
      } as const;
    });

    const data = await readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: contractCalls,
    });

    const dataWithAddress = data.map((beef, index) => ({
      ...beef,
      address: addresses[index]!,
    }));

    // We want to display the most recent beefs first
    return dataWithAddress.toReversed();
  };

  return useInfiniteQuery({
    enabled: beefsLength !== undefined,
    maxPages: beefsLength ? Math.ceil(beefsLength / pageSize) : 0,
    initialPageParam: 0,
    getNextPageParam: (_1, _2, lastPageParam) => {
      const nextPageParam = lastPageParam + 1;

      if (beefsLength === undefined || nextPageParam * pageSize >= beefsLength)
        return null;

      return nextPageParam;
    },
    queryFn: fetchBeefs,
    queryKey: [queryKeys.infiniteBeefs],
  });
};

export type ArbiterStatus = {
  address: Address;
  // Status is undefined while its being fetched.
  status?: {
    hasAttended: boolean;
    hasSettled: bigint;
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
    ]),
    allowFailure: false,
  });

  if (data) {
    // Chunk data to groups of 3 elements (one readContract call)
    const chunkedData = Array.from(
      { length: Math.ceil(data.length / 2) },
      (_, index) => data.slice(index * 2, index * 2 + 2),
    );

    const groupedData: ArbiterStatus[] = chunkedData.map(
      ([hasAttended, hasSettled], index) => {
        return {
          address: arbiters[index]!,
          status: {
            hasAttended: hasAttended as boolean,
            hasSettled: hasSettled as bigint,
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
    queryFn: () => publicClient.getBalance({ address: connectedAddress! }),
    enabled: connectedAddress !== undefined,
  });
};
