import { createLightAccount } from "@alchemy/aa-accounts";
import {
  getEntryPoint,
  SmartAccountSigner,
  UserOperationStruct_v6,
  createSmartAccountClient as createSmartAccountClientAlchemy,
  resolveProperties,
} from "@alchemy/aa-core";
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless";
import { Address, Hex, http, isHex, toHex } from "viem";
import { activeChainAlchemy, baseApiUrl } from "@/utils/chain";

// Wraps an arbitrary object type to enforce that all values are hex-formatted strings
type AsHex<T> = {
  [K in keyof T]: Hex;
};

type PaymasterResponse = {
  result: {
    paymasterAndData: Hex;
    preVerificationGas: Hex;
    verificationGasLimit: Hex;
    callGasLimit: Hex;
  };
};

export const sponsorUserOperation = async (userOp: UserOperationStruct_v6) => {
  const resolvedUserOp = formatUserOpAsHex(userOp);

  const paymasterRequest = makePaymasterRequest(resolvedUserOp);

  const response = await fetch(baseApiUrl, {
    method: "POST",
    body: JSON.stringify(paymasterRequest),
  });
  const { result } = (await response.json()) as PaymasterResponse;

  const updatedUserOp = {
    ...userOp,
    callGasLimit: result.callGasLimit,
    preVerificationGas: result.preVerificationGas,
    verificationGasLimit: result.verificationGasLimit,
    paymasterAndData: result.paymasterAndData,
  };

  return updatedUserOp;
};

export const createSmartAccountClient = async (
  signer: SmartAccountSigner,
  accountAddress?: Address,
) => {
  const account = await createLightAccount({
    signer,
    accountAddress,
    transport: http(baseApiUrl),
    chain: activeChainAlchemy,
    entryPoint: getEntryPoint(activeChainAlchemy, { version: "0.6.0" }),
  });

  return createSmartAccountClientAlchemy({
    transport: http(baseApiUrl),
    account,
    chain: activeChainAlchemy,
    gasEstimator: async (struct) => ({
      ...struct,
      callGasLimit: 0n,
      preVerificationGas: 0n,
      verificationGasLimit: 0n,
    }),
    paymasterAndData: {
      // @ts-expect-error Type inference utterly fails to infer the entrypoint version
      paymasterAndData: async (userOp) => {
        // UserOp truly is UserOperationStruct_v6, however the type inference Alchemy is hoping for is truly a stretch
        const resolvedUserOp = (await resolveProperties(
          userOp,
        )) as UserOperationStruct_v6;
        // request sponsorship
        const updatedUserOp = await sponsorUserOperation(resolvedUserOp);

        return updatedUserOp;
      },
      dummyPaymasterAndData: () => "0x",
    },
  });
};

const makePaymasterRequest = (userOp: AsHex<UserOperationStruct_v6>) => {
  return {
    jsonrpc: "2.0",
    method: "pm_sponsorUserOperation",
    id: "1",
    params: [userOp, ENTRYPOINT_ADDRESS_V06],
  };
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
