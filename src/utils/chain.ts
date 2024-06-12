import {
  base as baseAlchemy,
  baseSepolia as baseSepoliaAlchemy,
} from "@alchemy/aa-core";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const useTestChain = process.env.NEXT_PUBLIC_USE_TEST_CHAIN === "true";
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";

export const activeChain = useTestChain ? baseSepolia : base;
// Alchemy tries to be nice and add its RPC url, breaking compatibility in the process...
export const activeChainAlchemy = useTestChain
  ? baseSepoliaAlchemy
  : baseAlchemy;

export const alchemyApiUrl = useTestChain
  ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;

export const publicClient = createPublicClient({
  transport: http(alchemyApiUrl),
});
