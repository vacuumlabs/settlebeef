import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const activeChain = baseSepolia;

export const publicClient = createPublicClient({
  transport: http(activeChain.rpcUrls.default.http[0]),
});
