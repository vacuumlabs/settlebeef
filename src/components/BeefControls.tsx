import React from "react";
import { Button, Stack } from "@mui/material";

type BeefControlsProps = {
  id: string;
  isUserArbiter: boolean;
  isUserFoe: boolean;
  isUserOwner: boolean;
};

type ButtonProps = {
  id: string;
  enabled: boolean;
};

const ArbiterButton = ({ id, enabled }: ButtonProps) => {
  const buttonText = "Arbiter";
  return (
    <Button disabled={!enabled} variant="outlined">
      {buttonText}
    </Button>
  );
};
const FoeButton = ({ id, enabled }: ButtonProps) => {
  const buttonText = "Foe";
  return (
    <Button disabled={!enabled} variant="outlined">
      {buttonText}
    </Button>
  );
};
const OwnerButton = ({ id, enabled }: ButtonProps) => {
  const buttonText = "Owner";
  return (
    <Button disabled={!enabled} variant="outlined">
      {buttonText}
    </Button>
  );
};

const BeefControls = ({
  id,
  isUserArbiter,
  isUserFoe,
  isUserOwner,
}: BeefControlsProps) => {
  return (
    <Stack direction="row" spacing={2}>
      <ArbiterButton {...{ id }} enabled={isUserArbiter} />
      <FoeButton {...{ id }} enabled={isUserFoe} />
      <OwnerButton {...{ id }} enabled={isUserOwner} />
    </Stack>
  );
};

export default BeefControls;
