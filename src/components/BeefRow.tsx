import React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { formatEther } from "viem";
import Link from "next/link";
import { Beef } from "@/types";

export type BeefRowProps = Pick<Beef, "address" | "title" | "wager">;

const BeefRow = ({ address, title, wager }: BeefRowProps) => {
  return (
    <Link href={`/beef/${address}`} style={{ textDecoration: "none" }}>
      <Card>
        <CardContent>
          <Stack
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h4">{title}</Typography>
              <Typography variant="body1">{address}</Typography>
            </Stack>
            <Typography variant="h3">{formatEther(wager)} ETH</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BeefRow;
