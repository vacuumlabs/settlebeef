import { formatEther } from "viem";

export const sliceStringDecimals = (
  stringValue: string,
  maxDecimals: number
) => {
  const indexOfDot = stringValue.indexOf(".");

  return indexOfDot === -1
    ? stringValue
    : stringValue.slice(0, indexOfDot + maxDecimals + 1);
};

export const formatBigint = (
  value: bigint | null | undefined,
  decimalsDisplay = 2
) => {
  if (value == null) {
    return "";
  }

  const stringValue = formatEther(value);

  return Number(stringValue).toLocaleString("en", {
    maximumFractionDigits: decimalsDisplay,
  });
};
