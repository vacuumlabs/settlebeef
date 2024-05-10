type HexString = `0x${string}`;

type Address = HexString;
type Timestamp = bigint;

// Beef is a disagreement that two people have.
// It is also a type of meat that comes from cows.
type Beef = {
  title: string;
  description: string;
  owner: Address;
  foe: Address;
  wager: bigint;
  duration: Timestamp;
  arbiters: Address[];
  result: bigint;
};
