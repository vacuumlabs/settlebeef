import { UserOperationStruct_v6 } from "@alchemy/aa-core";
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless";
import { Hex, isHex, toHex } from "viem";
import { baseApiUrl } from "@/utils/chain";

// Wraps an arbitrary object type to enforce that all values are hex-formatted strings
type AsHex<T> = {
  [K in keyof T]: Hex;
};

// Utility for avoiding converting already Hex values
const formatAsHex = (value: string | Uint8Array | bigint | number): Hex => {
  if (isHex(value)) {
    return value;
  } else {
    return toHex(value);
  }
};

const formatAsHexOptional = (
  value?: string | Uint8Array | bigint | number,
): Hex | undefined => {
  if (value === undefined) {
    return undefined;
  } else {
    return formatAsHex(value);
  }
};

const formatUserOpAsHex = (userOp: UserOperationStruct_v6) => {
  const {
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    paymasterAndData,
    signature,
  } = userOp;

  const formattedUserOp: AsHex<UserOperationStruct_v6> = {
    sender: formatAsHex(sender),
    nonce: formatAsHex(nonce),
    initCode: formatAsHex(initCode),
    callData: formatAsHex(callData),
    callGasLimit: formatAsHexOptional(callGasLimit),
    verificationGasLimit: formatAsHexOptional(verificationGasLimit),
    preVerificationGas: formatAsHexOptional(preVerificationGas),
    maxFeePerGas: formatAsHexOptional(maxFeePerGas),
    maxPriorityFeePerGas: formatAsHexOptional(maxPriorityFeePerGas),
    paymasterAndData: formatAsHex(paymasterAndData),
    signature: formatAsHex(signature),
  };

  return formattedUserOp;
};

const makePaymasterRequest = (userOp: AsHex<UserOperationStruct_v6>) => {
  return {
    jsonrpc: "2.0",
    method: "pm_sponsorUserOperation",
    id: "1",
    params: [userOp, ENTRYPOINT_ADDRESS_V06],
  };
};

export const sponsorUserOperation = async (userOp: UserOperationStruct_v6) => {
  const resolvedUserOp = formatUserOpAsHex(userOp);

  const paymasterRequest = makePaymasterRequest(resolvedUserOp);

  const response = await fetch(baseApiUrl, {
    method: "POST",
    body: JSON.stringify(paymasterRequest),
  });
  const paymasterResponse = (await response.json()) as PaymasterResponse;

  const updatedUserOp = updateUserOpGasFields(userOp, paymasterResponse);

  return updatedUserOp;
};

type PaymasterResponse = {
  result: {
    paymasterAndData: Hex;
    preVerificationGas: Hex;
    verificationGasLimit: Hex;
    callGasLimit: Hex;
  };
};

export const updateUserOpGasFields = (
  userOp: UserOperationStruct_v6,
  { result }: PaymasterResponse,
) => {
  return {
    ...userOp,
    callGasLimit: result.callGasLimit,
    preVerificationGas: result.preVerificationGas,
    verificationGasLimit: result.verificationGasLimit,
    paymasterAndData: result.paymasterAndData,
  };
};
