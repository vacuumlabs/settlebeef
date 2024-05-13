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
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useContext, useState } from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Home() {
  const { connectedAddress } = useContext(SmartAccountClientContext);
  const { data: beefs, isLoading: isLoadingBeefs } = useGetBeefs();
  const [tabIndex, setTabIndex] = useState(0);

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
  const myBeefsChallenger =
    connectedAddress && beefs
      ? beefs
          .filter(
            (beef) =>
              beef.params.challenger.toLowerCase() ===
              connectedAddress.toLowerCase(),
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

  const handleChangeTabIndex = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setTabIndex(newValue);
  };

  return (
    <Container>
      <Tabs
        value={tabIndex}
        onChange={handleChangeTabIndex}
        aria-label="Beef tabs"
        centered
      >
        <Tab
          label={
            <Typography variant="h5" px={2}>
              Beef List 🥩📝
            </Typography>
          }
          {...a11yProps(0)}
        />
        <Tab
          label={
            <Typography variant="h5" px={2}>
              My beef List 🥩📝
            </Typography>
          }
          {...a11yProps(1)}
        />
      </Tabs>
      <CustomTabPanel value={tabIndex} index={0}>
        <Paper elevation={2} sx={{ mb: 5 }}>
          <Stack p={4} gap={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h3">Beef List 🥩📝</Typography>
              <Link href="/beef/new" style={{ textDecoration: "none" }}>
                <Button variant="contained" color="secondary">
                  Start beef
                </Button>
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
      </CustomTabPanel>
      <CustomTabPanel value={tabIndex} index={1}>
        {/* My beefs */}
        {connectedAddress && (
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
        )}
      </CustomTabPanel>
    </Container>
  );
}
