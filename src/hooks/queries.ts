import { useContext } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { getEnsName } from "wagmi/actions"
import { BeefSortType } from "@/components/BeefSortDropdown"
import { ensConfig } from "@/components/providers/Providers"
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext"
import { BeefApi } from "@/server/actions/beef/beefApi"
import { publicClient } from "@/utils/chain"
import { queryKeys } from "./queryKeys"

export const useEnsNames = (addresses: (Address | undefined)[]) => {
  return useQuery({
    queryKey: ["ensName", ...addresses],
    queryFn: async () => {
      const ensNameQueries = addresses.map((address) =>
        address == null ? Promise.resolve(null) : getEnsName(ensConfig, { address }),
      )

      const ensNames = await Promise.all(ensNameQueries)

      return ensNames
    },
    enabled: addresses.length > 0,
  })
}

export const useBeef = (address: Address) => {
  return useQuery({
    queryFn: () => BeefApi.getBeef(address),
    queryKey: ["getBeef", address],
  })
}

export const useGetInfiniteBeefs = (pageSize: number, sort: BeefSortType, searchTitle?: string) => {
  const fetchBeefs = async ({ pageParam: page }: { pageParam: number }) => {
    const beefs = await BeefApi.getBeefs(pageSize, pageSize * page, sort, searchTitle)

    return beefs
  }

  return useInfiniteQuery({
    initialPageParam: 0,
    getNextPageParam: (lastPage, _2, lastPageParam) => {
      const nextPageParam = lastPageParam + 1

      if (lastPage.length < pageSize) return null

      return nextPageParam
    },
    queryFn: fetchBeefs,
    queryKey: [queryKeys.infiniteBeefs, sort, searchTitle],
    placeholderData: (previousData) => previousData,
  })
}

export const useBalance = () => {
  const { connectedAddress } = useContext(SmartAccountClientContext)

  return useQuery({
    queryKey: [queryKeys.balance, connectedAddress],
    queryFn: () => publicClient.getBalance({ address: connectedAddress! }),
    enabled: connectedAddress !== undefined,
  })
}
