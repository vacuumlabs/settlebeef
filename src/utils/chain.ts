import { baseSepolia as baseSepoliaAlchemy } from "@alchemy/aa-core";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const activeChain = baseSepolia;
// Alchemy tries to be nice and add its RPC url, breaking compatibility in the process...
export const activeChainAlchemy = baseSepoliaAlchemy;

export const publicClient = createPublicClient({
  transport: http(
    `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  ),
});
