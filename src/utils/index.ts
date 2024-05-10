import type { Address } from "@/types";

export const truncateAddress = (address: Address) => {
  return `${address.slice(0, 6)}...${address.slice(-3)}`;
};
