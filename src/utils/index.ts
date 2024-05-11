import type { Address } from "@/types";

const truncateAddress = (address: Address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getAddressOrEnsName = (
  address: Address | undefined,
  ensNameOrUndefined: string | undefined | null,
  truncate = true,
) => {
  if (ensNameOrUndefined != null) {
    return ensNameOrUndefined;
  }
  return truncate ? (address ? truncateAddress(address) : "-") : address;
};
