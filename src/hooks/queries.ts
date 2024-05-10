import { useReadContracts } from "wagmi";
import type { Address, Beef } from "../types";
import { beefAbi } from "@/abi/beef";

export const useBeef = (id: string): Beef | undefined => {
  if (id === "test") {
    return {
      address: id,
      title: "Did Kendrick cook Drake?",
      description: "Did BBL Drizzy get cooked by Dot?",
      owner: "0x1234567890123456789012345678901234567890",
      foe: "0x9a10ef0f27d2FB52DED714997912D86235343659",
      wager: 1000000000000000n,
      deadline: 1634025600n,
      result: 0n,
      arbiters: ["0x123", "0x456", "0x789"],
      isCooking: false,
    };
  }

  return undefined;
};

export const useGetBeefs = (): Beef[] | undefined => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const beef = useBeef("test")!;
  return [beef, beef, beef];
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
