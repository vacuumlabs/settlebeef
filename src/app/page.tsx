"use client";

import BeefList from "@/components/BeefList";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { useGetBeefs } from "@/hooks/queries";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useContext } from "react";

export default function Home() {
  const { connectedAddress } = useContext(SmartAccountClientContext);
  const { data: beefs, isLoading: isLoadingBeefs } = useGetBeefs();

  const beefsListData =
    beefs?.map((beef) => ({
      title: beef.params.title,
      address: beef.address,
      wager: beef.params.wager,
    })) ?? [];
  const myBeefsOwner =
    connectedAddress && beefs
      ? beefs
          .filter(
            (beef) =>
              beef.params.owner.toLowerCase() ===
              connectedAddress.toLowerCase(),
          )
          .map((beef) => ({
            title: beef.params.title,
            address: beef.address,
            wager: beef.params.wager,
          }))
      : [];
  const myBeefsFoe =
    connectedAddress && beefs
      ? beefs
          .filter(
            (beef) =>
              beef.params.foe.toLowerCase() === connectedAddress.toLowerCase(),
          )
          .map((beef) => ({
            title: beef.params.title,
            address: beef.address,
            wager: beef.params.wager,
          }))
      : [];
  const myBeefsArbiter =
    connectedAddress && beefs
      ? beefs
          .filter((beef) =>
            beef.params.arbiters
              .map((it) => it.toLowerCase())
              .includes(connectedAddress.toLowerCase()),
          )
          .map((beef) => ({
            title: beef.params.title,
            address: beef.address,
            wager: beef.params.wager,
          }))
      : [];

  return (
    <Container>
      {/* My beefs */}
      {connectedAddress && (
        <Paper elevation={2} square>
          <Stack p={4} spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h3">My Beef List 🥩📝</Typography>
              <Link href="/beef/new" style={{ textDecoration: "none" }}>
                <Button variant="outlined">Start beef</Button>
              </Link>
            </Stack>
            <Typography variant="h5">As owner 🤴</Typography>
            <Stack spacing={2}>
              {isLoadingBeefs ? (
                "Loading beef list"
              ) : myBeefsOwner.length === 0 ? (
                "No beef!"
              ) : (
                <BeefList beefs={myBeefsOwner} />
              )}
            </Stack>
            <Typography variant="h5">As foe 🤺</Typography>
            <Stack spacing={2}>
              {isLoadingBeefs ? (
                "Loading beef list"
              ) : myBeefsFoe.length === 0 ? (
                "No beef!"
              ) : (
                <BeefList beefs={myBeefsFoe} />
              )}
            </Stack>
            <Typography variant="h5">As arbiter 🧑‍⚖️</Typography>
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
      )}
      <Box mt={4} />
      <Paper elevation={2} square>
        <Stack p={4} spacing={2}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h3">Beef List 🥩📝</Typography>
            <Link href="/beef/new" style={{ textDecoration: "none" }}>
              <Button variant="outlined">Start beef</Button>
            </Link>
          </Stack>
          {isLoadingBeefs ? (
            "Loading beef list"
          ) : beefsListData.length === 0 ? (
            "No beef!"
          ) : (
            <BeefList beefs={beefsListData} />
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
