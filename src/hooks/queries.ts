import { useReadContract, useReadContracts } from "wagmi";
import type { Address, Beef } from "../types";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { SLAUGHTERHOUSE_ADDRESS } from "@/config";
import { beefAbi } from "@/abi/beef";

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
          }) as const,
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
  arbiterAddresses: Address[],
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
      ]),
    ],
    allowFailure: false,
  });

  return data != null
    ? data
        .reduce(
          (acc, curr, idx) => {
            if (idx % 2 === 0) {
              acc.push([curr] as unknown as [boolean, bigint]);
            } else {
              acc[acc.length - 1]?.push(curr);
            }
            return acc;
          },
          [] as Array<[boolean, bigint]>,
        )
        .map(([hasAttended, hasSettled]) => ({
          hasAttended,
          hasSettled,
        }))
    : undefined;
};
