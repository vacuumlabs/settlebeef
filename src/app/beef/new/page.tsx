"use client";

import AmountInput from "@/components/AmoutInput";
import { isValidEmail } from "@/utils/validations";
import {
  Button,
  Container,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { isAddress } from "viem";
import { DateTime } from "luxon";
import { useAddBeef } from "@/hooks/mutations";
import { ArbiterAccount } from "@/types";
import { usePrivy } from "@privy-io/react-auth";
import NotLoggedIn from "@/components/NotLoggedIn";
import { enqueueSnackbar } from "notistack";

const NUMBER_OF_ARBITERS = 3;

type FormArbiter = {
  type: ArbiterAccount;
  value: string;
};

export type NewBeefFormValues = {
  title: string;
  description: string;
  arbiters: FormArbiter[];
  wager: bigint | null;
  joinDeadline: string;
  settleStart: string;
  foe: string | null;
};

const NewBeefPage = () => {
  const { mutate } = useAddBeef();
  const { authenticated } = usePrivy();
  const form = useForm<NewBeefFormValues>({
    defaultValues: {
      title: "",
      description: "",
      arbiters: [
        { type: ArbiterAccount.EMAIL, value: "" },
        { type: ArbiterAccount.EMAIL, value: "" },
        { type: ArbiterAccount.EMAIL, value: "" },
      ],
      wager: null,
      joinDeadline: DateTime.now().plus({ days: 7 }).toISODate(),
      settleStart: DateTime.now().plus({ months: 6 }).toISODate(),
      foe: "",
    },
  });

  const { watch, control, handleSubmit, setError } = form;

  const addBeef = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        enqueueSnackbar("Beef added", { variant: "success" });
      },
    });
  });

  return authenticated ? (
    <Container component="main" maxWidth="md">
      <Typography variant="h2" component="h1">
        New Beef
      </Typography>
      <Stack sx={{ display: "flex", gap: 2 }}>
        <Controller
          name="title"
          control={control}
          rules={{
            required: "Required",
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Title"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          rules={{
            required: "Required",
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              multiline
              rows={3}
              {...field}
              error={!!error}
              helperText={error?.message}
              label="Description"
            />
          )}
        />
        <Controller
          name="foe"
          control={control}
          rules={{
            required: "Required",
            validate: (value) => isAddress(value ?? "") || "Address not valid",
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Foe"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          name="joinDeadline"
          control={control}
          rules={{
            required: "Required",
            min: {
              value: DateTime.now().toISODate(),
              message: "Date must be in the future",
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              type="date"
              label="Deadline for joining"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          name="settleStart"
          control={control}
          rules={{
            required: "Required",
            min: {
              value: watch("joinDeadline"),
              message: "Date must be after the deadling for joining",
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              type="date"
              label="Judging start"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          name="wager"
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState: { error } }) => (
            <AmountInput
              label="Amount"
              {...field}
              setValue={field.onChange}
              errorMessage={error?.message}
              setError={(message) => setError("wager", { message })}
            />
          )}
        />
        {Array.from({ length: NUMBER_OF_ARBITERS }).map((_, index) => (
          <Stack gap={1} key={index}>
            <Typography variant="body2">{`Arbiter #${index + 1}`}</Typography>
            <Stack direction="row" alignItems="flex-start" gap={2}>
              <Controller
                name={`arbiters.${index}.type`}
                control={control}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 200 }}>
                    <MenuItem value={ArbiterAccount.EMAIL}>Email</MenuItem>
                    <MenuItem value={ArbiterAccount.ADDRESS}>
                      Wallet address
                    </MenuItem>
                  </Select>
                )}
              />
              <Controller
                name={`arbiters.${index}.value`}
                control={control}
                rules={{
                  required: "Required",
                  validate: (value, formValues) =>
                    formValues.arbiters[index]?.type === ArbiterAccount.ADDRESS
                      ? isAddress(value) || "Address not valid"
                      : isValidEmail(value) || "Email not valid",
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    sx={{ flexGrow: 1 }}
                    error={!!error}
                    helperText={error?.message}
                    label={
                      watch(`arbiters.${index}.type`) === ArbiterAccount.EMAIL
                        ? "Email address"
                        : "Wallet address"
                    }
                  />
                )}
              />
            </Stack>
          </Stack>
        ))}
        <Button
          onClick={addBeef}
          type="submit"
          sx={{ mb: 10, mt: 5, alignSelf: "center" }}
          variant="contained"
        >
          Add new Beef
        </Button>
      </Stack>
    </Container>
  ) : (
    <NotLoggedIn />
  );
};

export default NewBeefPage;
