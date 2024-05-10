import { http } from "viem";
import {
  ENTRYPOINT_ADDRESS_V07,
  providerToSmartAccountSigner,
} from "permissionless";
import {
  createZeroDevPaymasterClient,
  createKernelAccountClient,
  createKernelAccount,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { activeChain, publicClient } from "./chain";
import { ConnectedWallet } from "@privy-io/react-auth";

export const ZERODEV_BUNDLER_RPC =
  "https://rpc.zerodev.app/api/v2/bundler/55689498-0691-431a-8afd-5bfc31f232e0";
export const ZERODEV_PAYMASTER_RPC =
  "https://rpc.zerodev.app/api/v2/paymaster/55689498-0691-431a-8afd-5bfc31f232e0";

export const createSmartAccountClient = async (
  embeddedWallet: ConnectedWallet
) => {
  await embeddedWallet.switchChain(activeChain.id);

  const eip1193provider = await embeddedWallet.getEthereumProvider();

  const smartAccountSigner = await providerToSmartAccountSigner(
    eip1193provider as any
  );

  // Create a ZeroDev ECDSA validator from the `smartAccountSigner` from above and your `publicClient`
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: smartAccountSigner,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  // Create a Kernel account from the ECDSA validator
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  // Create a Kernel account client to send user operations from the smart account
  return createKernelAccountClient({
    account,
    chain: activeChain,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    bundlerTransport: http(ZERODEV_BUNDLER_RPC),
    middleware: {
      sponsorUserOperation: async ({ userOperation, entryPoint }) => {
        const zerodevPaymaster = createZeroDevPaymasterClient({
          chain: activeChain,
          entryPoint,
          transport: http(ZERODEV_PAYMASTER_RPC),
        });

        return zerodevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint,
        });
      },
    },
  });
};
