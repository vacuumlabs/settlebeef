import React, { Dispatch, SetStateAction, createContext, useCallback, useEffect, useMemo, useState } from "react"
import { LightAccount } from "@alchemy/aa-accounts"
import { SmartAccountClient as AlchemySmartAccountClient, WalletClientSigner } from "@alchemy/aa-core"
import { ConnectedWallet, usePrivy, useWallets, WalletConnector } from "@privy-io/react-auth"
import { Address, Chain, createWalletClient, custom, TransactionReceipt, Transport } from "viem"
import { useSendTransaction } from "wagmi"
import { getGeneratedSmartAccount } from "@/server/actions/getGeneratedSmartAccount"
import { activeChain, publicClient } from "@/utils/chain"
import { createSmartAccountClient } from "@/utils/userOperation"

export type SmartAccountClient = AlchemySmartAccountClient<Transport, Chain, LightAccount>

type SendTransactionParams = {
  to: Address
  data: `0x${string}`
  value?: bigint
}

type SmartAccountClientContext = {
  isConnected: boolean
  connectedAddress: Address | undefined
  setClient: Dispatch<SetStateAction<SmartAccountClient | undefined>>
  connectCoinbase: () => void
  disconnectCoinbase: () => void
  sendTransaction: (params: SendTransactionParams) => Promise<TransactionReceipt>
}

export const SmartAccountClientContext = createContext({} as SmartAccountClientContext)

type SmartAccountClientContextProviderProps = {
  children: React.ReactNode
}

export const SmartAccountClientContextProvider = ({ children }: SmartAccountClientContextProviderProps) => {
  const [client, setClient] = useState<SmartAccountClient>()
  const [coinbaseAddress, setCoinbaseAddress] = useState<Address | undefined>()

  const { wallets } = useWallets()
  const { sendTransactionAsync } = useSendTransaction()
  const { user, walletConnectors, authenticated, ready } = usePrivy()

  const createCoinbaseProvider = useCallback(async (walletConnector: WalletConnector) => {
    if (walletConnector.wallets.length === 0) return

    const wallet = await walletConnector.getConnectedWallet()

    const provider = await wallet?.getEthersProvider()
    const address = await provider?.getSigner()?.getAddress()

    setCoinbaseAddress(address as Address | undefined)
  }, [])

  const connectCoinbase = useCallback(async () => {
    const connector = walletConnectors?.findWalletConnector("coinbase_wallet", "coinbase_smart_wallet")

    if (connector) {
      const wallet = await connector.connect({ chainId: activeChain.id, showPrompt: true })

      setCoinbaseAddress(wallet?.address as Address | undefined)
    }
  }, [walletConnectors])

  const disconnectCoinbase = useCallback(() => {
    const connector = walletConnectors?.findWalletConnector("coinbase_wallet", "coinbase_smart_wallet")

    connector?.disconnect()
    setCoinbaseAddress(undefined)
  }, [walletConnectors])

  const sendTransaction = useCallback(
    async (params: SendTransactionParams) => {
      if (client) {
        const uo = {
          target: params.to,
          value: params.value,
          data: params.data,
        }

        const { hash: uoHash } = await client.sendUserOperation({ uo })

        const txHash = await client.waitForUserOperationTransaction({ hash: uoHash })

        const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

        return receipt
      } else {
        const hash = await sendTransactionAsync(params)

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        return receipt
      }
    },
    [client, sendTransactionAsync],
  )

  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy")
  const coinbaseWallet = walletConnectors?.findWalletConnector("coinbase_wallet", "coinbase_smart_wallet")

  const createClient = useCallback(
    async (wallet: ConnectedWallet) => {
      if (user === null) {
        return
      }

      // For some (invited by socials) users, we use a different smart wallet than the default one.
      const getAccountAddress =
        user.twitter !== undefined || user.email !== undefined || user.farcaster !== undefined
          ? getGeneratedSmartAccountAddress()
          : undefined

      const eip1193provider = await wallet.getEthereumProvider()

      const privyClient = createWalletClient({
        account: wallet.address as Address,
        chain: activeChain,
        transport: custom(eip1193provider),
      })

      const privySigner = new WalletClientSigner(privyClient, "json-rpc")

      const accountAddress = await getAccountAddress

      const client = await createSmartAccountClient(privySigner, accountAddress)

      setClient(client)
    },
    [user],
  )

  const value = useMemo(() => {
    const isEOAConnected = embeddedWallet === undefined && user !== null

    return {
      isConnected: ready && (authenticated || coinbaseAddress !== undefined),
      connectedAddress:
        // Show EOA wallet address if present
        isEOAConnected ? (wallets[0]?.address as Address | undefined) : client?.account.address ?? coinbaseAddress,
      client,
      setClient,
      sendTransaction,
      connectCoinbase,
      disconnectCoinbase,
    }
  }, [
    ready,
    authenticated,
    coinbaseAddress,
    embeddedWallet,
    user,
    wallets,
    client,
    sendTransaction,
    connectCoinbase,
    disconnectCoinbase,
  ])

  useEffect(() => {
    if (!ready) return

    if (embeddedWallet) {
      void createClient(embeddedWallet)
    } else if (!authenticated && coinbaseWallet) {
      void createCoinbaseProvider(coinbaseWallet)
    }
  }, [embeddedWallet, createClient, authenticated, createCoinbaseProvider, ready, coinbaseWallet])

  return <SmartAccountClientContext.Provider value={value}>{children}</SmartAccountClientContext.Provider>
}

const getGeneratedSmartAccountAddress = async () => {
  const address = await getGeneratedSmartAccount()

  if (address === undefined) throw new Error("Error getting smart account address from twitter / x")

  return address
}
