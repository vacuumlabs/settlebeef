"use client";

import { useContext, useState } from "react";
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
import BeefList from "@/components/BeefList";
import { SmartAccountClientContext } from "@/components/providers/SmartAccountClientContext";
import { ShowMyBeefs } from "@/components/ShowMyBeefs";
import { useGetInfiniteBeefs } from "@/hooks/queries";

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
  const {
    data: beefs,
    isLoading: isLoadingBeefs,
    fetchNextPage,
    hasNextPage,
  } = useGetInfiniteBeefs();
  const [tabIndex, setTabIndex] = useState(0);

  const beefsListData =
    beefs?.pages?.flatMap(
      (beefs) =>
        beefs?.map((beef) => ({
          title: beef.params.title,
          address: beef.address,
          wager: beef.params.wager,
          owner: beef.params.owner,
          challenger: beef.params.challenger,
          arbiters: beef.params.arbiters,
        })) ?? [],
    ) ?? [];

  const handleChangeTabIndex = (_: React.SyntheticEvent, newValue: number) => {
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
            {isLoadingBeefs || beefs === undefined ? (
              "Loading beef list"
            ) : beefsListData.length === 0 ? (
              "No beef!"
            ) : (
              <BeefList beefs={beefsListData} />
            )}
            <Button
              disabled={!hasNextPage}
              onClick={() => void fetchNextPage()}
            >
              More beef
            </Button>
          </Stack>
        </Paper>
      </CustomTabPanel>
      <CustomTabPanel value={tabIndex} index={1}>
        {/* My beefs */}
        {connectedAddress && (
          <ShowMyBeefs
            beefs={beefsListData}
            isLoadingBeefs={isLoadingBeefs}
            address={connectedAddress}
          />
        )}
      </CustomTabPanel>
    </Container>
  );
}
