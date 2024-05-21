import { Beef } from "@/types";
import { Address, isAddressEqual } from "viem";
import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import BeefList from "@/components/BeefList";

type ShowMyBeefsProps = {
  address: Address;
  beefs: (Pick<Beef, "address" | "title" | "wager" | "owner" | "challenger"> & {
    // TODO: Assess possibility of making arbiters readonly directly in `Beef` type
    arbiters: readonly Address[];
  })[];
  isLoadingBeefs: boolean;
};

export const ShowMyBeefs = ({
  address,
  beefs,
  isLoadingBeefs,
}: ShowMyBeefsProps) => {
  const myBeefsOwner = beefs.filter(({ owner }) =>
    isAddressEqual(owner, address),
  );

  const myBeefsChallenger = beefs.filter(({ challenger }) =>
    isAddressEqual(challenger, address),
  );

  const myBeefsArbiter = beefs.filter(({ arbiters }) =>
    arbiters.some((arbiterAddress) => isAddressEqual(arbiterAddress, address)),
  );

  return (
    <Paper elevation={2}>
      <Stack p={4} gap={1}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h3">My Beef List 🥩📝</Typography>
          <Link href="/beef/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" color="secondary">
              Start beef
            </Button>
          </Link>
        </Stack>
        <Typography variant="h5" sx={{ mt: 3 }}>
          As owner 🤴
        </Typography>
        <Stack spacing={2}>
          {isLoadingBeefs ? (
            "Loading beef list"
          ) : myBeefsOwner.length === 0 ? (
            "No beef!"
          ) : (
            <BeefList beefs={myBeefsOwner} />
          )}
        </Stack>
        <Typography variant="h5" sx={{ mt: 4 }}>
          As challenger 🤺
        </Typography>
        <Stack spacing={2}>
          {isLoadingBeefs ? (
            "Loading beef list"
          ) : myBeefsChallenger.length === 0 ? (
            "No beef!"
          ) : (
            <BeefList beefs={myBeefsChallenger} />
          )}
        </Stack>
        <Typography variant="h5" sx={{ mt: 4 }}>
          As arbiter 🧑‍⚖️
        </Typography>
        <Stack spacing={2}>
          {isLoadingBeefs ? (
            "Loading beef list"
          ) : myBeefsArbiter.length === 0 ? (
            "No beef!"
          ) : (
            <BeefList beefs={myBeefsArbiter} />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
