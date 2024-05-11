type HexString = `0x${string}`;

export type Address = HexString;
export type UnixTimestamp = bigint;

// Beef is a disagreement that two people have.
// It is also a type of meat that comes from cows.
export type Beef = {
  address: string;

  owner: Address;
  wager: bigint;
  challenger: Address;
  settleStart: UnixTimestamp;
  title: string;
  description: string;
  arbiters: Address[];
  joinDeadline: UnixTimestamp;
  staking: boolean;
  isCooking: boolean;
  resultYes: bigint;
  resultNo: bigint;
  attendCount: bigint;
};

export enum ArbiterAccount {
  EMAIL = "EMAIL",
  ADDRESS = "ADDRESS",
  TWITTER = "TWITTER",
  ENS = "ENS",
}
