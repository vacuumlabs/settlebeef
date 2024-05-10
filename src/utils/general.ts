import { DateTime } from "luxon";
import { formatEther } from "viem";

export const sliceStringDecimals = (
  stringValue: string,
  maxDecimals: number,
) => {
  const indexOfDot = stringValue.indexOf(".");

  return indexOfDot === -1
    ? stringValue
    : stringValue.slice(0, indexOfDot + maxDecimals + 1);
};

export const formatBigint = (
  value: bigint | null | undefined,
  decimalsDisplay = 2,
) => {
  if (value == null) {
    return "";
  }

  const stringValue = formatEther(value);

  return Number(stringValue).toLocaleString("en", {
    maximumFractionDigits: decimalsDisplay,
  });
};

export const parseIsoDateToTimestamp = (value: string) =>
  Math.round(DateTime.fromISO(value).toMillis() / 1000);

export const ellipsizeText = (text: string, maxLength: number) => {
  const trimmedText = text.trim();

  return trimmedText.length <= maxLength
    ? trimmedText
    : `${trimmedText.slice(0, maxLength)}...`;
};
