import type { Address } from "@/types";

const truncateAddress = (address: Address) => {
  return `${address.slice(0, 6)}...${address.slice(-3)}`;
};

export const getAddressOrEnsName = (
  address: Address,
  ensNameOrUndefined: string | undefined | null,
  truncate = true,
) => {
  if (ensNameOrUndefined != null) {
    return ensNameOrUndefined;
  }
  return truncate ? truncateAddress(address) : address;
};
