import { useContext } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { getEnsName } from "wagmi/actions"
import { BeefSortType } from "@/components/BeefSortDropdown"
import { ensConfig } from "@/components/providers/Providers"
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext"
import { BeefApi } from "@/server/actions/beef/beefApi"
import { getAllUserDetailsAction } from "@/server/actions/getUserDetailsAction"
import { Beef } from "@/types"
import { getAddressOrEnsName } from "@/utils"
import { publicClient } from "@/utils/chain"
import { queryKeys } from "./queryKeys"

export const useEnsNames = (addresses?: Address[]) => {
  return useQuery({
    queryKey: ["ensName", addresses],
    queryFn: async () => {
      if (addresses === undefined) return undefined

      const ensNameQueries = addresses.map((address) => getEnsName(ensConfig, { address }))

      const ensNames = await Promise.all(ensNameQueries)

      return ensNames
    },
    enabled: addresses !== undefined,
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

const useGetAllUserDetailsAction = (addresses?: Address[]) =>
  useQuery({
    enabled: addresses !== undefined,
    queryKey: [queryKeys.getAllUserDetails, addresses],
    queryFn: () => getAllUserDetailsAction(addresses ?? []),
  })

const extractUsername = (details: { xHandle: string | null; email: string | null; farcasterId: string | null }) => {
  return details?.xHandle ?? details?.email ?? details?.farcasterId ?? undefined
}

export const useGetUsernames = (beef?: Beef) => {
  const addresses = beef ? [beef.owner, beef.challenger, ...beef.arbiters.map(({ address }) => address)] : undefined

  const { data: ensNames } = useEnsNames(addresses)
  const { data: userDetails } = useGetAllUserDetailsAction(addresses)

  const getUsernames = () => {
    if (userDetails === undefined || beef === undefined) return undefined

    const addressToUsername = new Map(
      userDetails.map((detail) => [detail.smartAccountAddress, extractUsername(detail)]),
    )

    // Null asserts, because compiler is not so smart :(
    const [owner, challenger, ...arbiters] = addresses!.map((address, index) => {
      return addressToUsername.get(address) ?? getAddressOrEnsName(address, ensNames?.[index], false)
    })

    return {
      owner: owner!,
      challenger: challenger!,
      arbiters,
    }
  }

  return useQuery({
    enabled: beef !== undefined && ensNames !== undefined && userDetails !== undefined,
    queryKey: [queryKeys.getUsernames, beef?.address],
    queryFn: getUsernames,
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
