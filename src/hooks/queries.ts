import type { Beef } from "../types";

export const useBeef = (id: string): Beef | undefined => {
  if (id === "test") {
    return {
      title: "Did Kendrick cook Drake?",
      description: "Did BBL Drizzy get cooked by Dot?",
      owner: "0x1234567890123456789012345678901234567890",
      foe: "0x9a10ef0f27d2FB52DED714997912D86235343659",
      wager: 1000000000n,
      deadline: 1634025600n,
      result: 0n,
      arbiters: ["0x123", "0x456", "0x789"],
    };
  }

  return undefined;
};
