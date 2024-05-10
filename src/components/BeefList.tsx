import React from "react";
import { Stack } from "@mui/material";
import BeefRow, { BeefRowProps } from "./BeefRow";

type BeefListProps = {
  beefs: BeefRowProps[];
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
