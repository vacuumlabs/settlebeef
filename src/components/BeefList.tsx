import React from "react";
import { Stack } from "@mui/material";
import BeefRow from "./BeefRow";
import { Beef } from "@/types";

type BeefListProps = {
  beefs: Beef[];
};

const BeefList = ({ beefs }: BeefListProps) => {
  return (
    <Stack spacing={2}>
      {beefs.map((beef) => (
        <BeefRow key={beef.address} {...beef} />
      ))}
    </Stack>
  );
};

export default BeefList;
