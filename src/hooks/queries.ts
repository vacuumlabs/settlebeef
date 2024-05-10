import { useReadContract, useReadContracts } from "wagmi";
import type { Address, Beef } from "../types";
import { slaughterhouseAbi } from "@/abi/slaughterhouse";
import { SLAUGHTERHOUSE_ADDRESS } from "@/config";
import { beefAbi } from "@/abi/beef";

export const useBeef = (id: string): Beef | null | undefined => {
  if (!id.startsWith("0x")) {
    return undefined;
  }

  const { data, isError } = useReadContract({
    abi: beefAbi,
    address: id as Address,
    functionName: "getInfo",
  });

  console.log("beef", data);

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
  console.log("beefAddresses", beefAddresses);
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
        address: beefAddresses[index],
      })),
  };
};

export const useGetArbiterStatus = (
  beefId: Address,
  arbiterAddress: Address,
) => {
  const { data } = useReadContracts({
    contracts: [
      {
        abi: beefAbi,
        address: beefId,
        functionName: "hasSettled",
        args: [arbiterAddress],
      },
      {
        abi: beefAbi,
        address: beefId,
        functionName: "hasAttended",
        args: [arbiterAddress],
      },
    ],
    allowFailure: false,
  });

  return data != null
    ? {
        hasSettled: data[0],
        hasAttended: data[1],
      }
    : undefined;
};
