type HexString = `0x${string}`;

export type Address = HexString;
type UnixTimestamp = bigint;

// Beef is a disagreement that two people have.
// It is also a type of meat that comes from cows.
export type Beef = {
  address: string;

  owner: Address;
  wager: bigint;
  foe: Address;
  settleStart: UnixTimestamp;
  title: string;
  description: string;
  arbiters: Address[];
  joinDeadline: UnixTimestamp;

  isCooking: boolean;
  resultYes: bigint;
  resultNo: bigint;
  attendCount: bigint;
};

export enum ArbiterAccount {
  EMAIL = "EMAIL",
  ADDRESS = "ADDRESS",
}
