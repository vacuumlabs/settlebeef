type HexString = `0x${string}`;

export type Address = HexString;
type UnixTimestamp = bigint;

// Beef is a disagreement that two people have.
// It is also a type of meat that comes from cows.
export type Beef = {
  address: string;
  title: string;
  description: string;
  owner: Address;
  foe: Address;
  wager: bigint;
  deadline: UnixTimestamp;
  arbiters: Address[];
  result: bigint;
  isCooking: boolean;
};
