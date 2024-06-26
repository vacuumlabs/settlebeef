import { Address } from "viem"

export const truncateString = (value: string, keepStart: number = 6, keepEnd: number = 4) => {
  if (value.length <= keepStart + keepEnd) return value

  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export const getAddressOrEnsName = (address: Address, ensName: string | undefined | null, truncate = true) => {
  if (ensName != null) {
    return ensName
  }
  return truncate ? truncateString(address) : address
}
