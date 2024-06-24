import React from "react"
import { MenuItem, FormControl, InputLabel, Select } from "@mui/material"

export type BeefSortType = {
  orderBy: "createdAt" | "wager"
  orderDirection: "asc" | "desc"
}

type SortOptionType = {
  label: "Newest to Oldest" | "Oldest to Newest" | "Wager Low to High" | "Wager High to Low"
  sort: BeefSortType
}

export const BEEF_SORT_OPTIONS: SortOptionType[] = [
  {
    label: "Oldest to Newest",
    sort: {
      orderBy: "createdAt",
      orderDirection: "asc",
    },
  },
  {
    label: "Newest to Oldest",
    sort: {
      orderBy: "createdAt",
      orderDirection: "desc",
    },
  },
  {
    label: "Wager Low to High",
    sort: {
      orderBy: "wager",
      orderDirection: "asc",
    },
  },
  {
    label: "Wager High to Low",
    sort: {
      orderBy: "wager",
      orderDirection: "desc",
    },
  },
] as const

type BeefSortProps = {
  sortOption: SortOptionType
  setSortOption: (newSortOption: SortOptionType) => void
}

export const BeefSortDropdown = ({ sortOption, setSortOption }: BeefSortProps) => {
  const handleClickMenuItem = (label: SortOptionType["label"]) => {
    const option = BEEF_SORT_OPTIONS.find((option) => option.label === label)!

    setSortOption(option)
  }

  return (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>Sort Beefs</InputLabel>
      <Select
        onChange={(event) => {
          if ("alt" in event.target) return

          const label = event.target.value
          handleClickMenuItem(label)
        }}
        label="Sort Beefs"
        value={sortOption.label}
      >
        {BEEF_SORT_OPTIONS.map((sortOption, index) => (
          <MenuItem value={sortOption.label} key={index}>
            {sortOption.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
