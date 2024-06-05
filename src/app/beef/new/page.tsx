"use client";

import {
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { usePrivy } from "@privy-io/react-auth";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { Controller, useForm } from "react-hook-form";
import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { getEnsAddress } from "wagmi/actions";
import AmountInput from "@/components/AmountInput";
import NotLoggedIn from "@/components/NotLoggedIn";
import { ensConfig } from "@/components/providers/Providers";
import { useAddBeef } from "@/hooks/mutations";
import { useBalance } from "@/hooks/queries";
import { generateAddressFromTwitterHandle } from "@/server/actions/generateAddressFromTwitterHandle";
import { ArbiterAccount, ChallengerAccount } from "@/types";

const NUMBER_OF_ARBITERS = 3;

type FormArbiter = {
  type: ArbiterAccount;
  value: string;
};

type FormChallenger = {
  type: ChallengerAccount;
  value: string;
};

export type NewBeefFormValues = {
  title: string;
  description: string;
  arbiters: FormArbiter[];
  wager: bigint | null;
  joinDeadline: string;
  settleStart: string;
  challenger: FormChallenger;
  staking: boolean;
};

const NewBeefPage = () => {
  const { mutate, isPending } = useAddBeef();
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { data: balance } = useBalance();

  const form = useForm<NewBeefFormValues>({
    defaultValues: {
      title: "",
      description: "",
      arbiters: [
        { type: ArbiterAccount.TWITTER, value: "" },
        { type: ArbiterAccount.TWITTER, value: "" },
        { type: ArbiterAccount.TWITTER, value: "" },
      ],
      wager: null,
      joinDeadline: DateTime.now()
        .plus({ days: 7 })
        .set({ second: 0, millisecond: 0 })
        .toISO({ suppressSeconds: true, includeOffset: false }),
      settleStart: DateTime.now()
        .plus({ months: 6 })
        .set({ second: 0, millisecond: 0 })
        .toISO({ suppressSeconds: true, includeOffset: false }),
      challenger: {
        type: ChallengerAccount.TWITTER,
        value: "",
      },
      staking: true,
    },
  });

  const { watch, control, handleSubmit, setError } = form;

  const addBeef = handleSubmit(async (values) => {
    // Validate submitted arbiter ens names
    const submittedEnsNames = values.arbiters.map((arbiter) =>
      arbiter.type === ArbiterAccount.ENS
        ? getEnsAddress(ensConfig, { name: normalize(arbiter.value) })
        : Promise.resolve(null),
    );

    const validatedEnsNames = await Promise.all(submittedEnsNames);

    validatedEnsNames.forEach((resolvedEnsName, index) => {
      if (
        resolvedEnsName === null &&
        values.arbiters[index]!.type === ArbiterAccount.ENS
      ) {
        setError(`arbiters.${index}.value`, { message: "ENS name not found" });
      }
    });

    if (values.challenger.type === ChallengerAccount.ENS) {
      const resolvedAddress = await getEnsAddress(ensConfig, {
        name: normalize(values.challenger.value),
      });

      if (resolvedAddress === null) {
        setError("challenger.value", { message: "ENS name not found" });
        return;
      } else {
        values.challenger = {
          type: ChallengerAccount.ADDRESS,
          value: resolvedAddress,
        };
      }
    } else if (values.challenger.type === ChallengerAccount.TWITTER) {
      const value = values.challenger.value;

      const normalizedValue = value.startsWith("@")
        ? value.replace("@", "")
        : value;

      const resolvedAddress =
        await generateAddressFromTwitterHandle(normalizedValue);

      values.challenger = {
        type: ChallengerAccount.ADDRESS,
        value: resolvedAddress,
      };
    }

    // If any ens name is invalid, return
    if (
      validatedEnsNames.some(
        (ensName, index) =>
          ensName === null &&
          values.arbiters[index]!.type === ArbiterAccount.ENS,
      )
    ) {
      return;
    }

    values.arbiters = values.arbiters.map((arbiter, index) => {
      const resolvedAddress = validatedEnsNames[index];
      if (arbiter.type === ArbiterAccount.ENS && resolvedAddress != null) {
        return { type: ArbiterAccount.ADDRESS, value: resolvedAddress };
      }
      return arbiter;
    });

    if ((values.wager ?? 0n) > (balance?.value ?? 0n)) {
      setError("wager", { message: "Not enough balance!" });
      return;
    }

    mutate(values, {
      onSuccess: () => {
        enqueueSnackbar("Beef added", { variant: "success" });
        router.push("/");
      },
    });
  });

  return authenticated ? (
    <Container component="main" maxWidth="md">
      <Paper sx={{ p: 4, mb: 10 }}>
        <Typography variant="h3" component="h1">
          Start Beef 🐄🔪👀
        </Typography>
        <Stack sx={{ display: "flex", gap: 2, mt: 2 }}>
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
          <Stack gap={1}>
            <Typography variant="body2">Challenger</Typography>
            <Stack direction="row" alignItems="flex-start" gap={2}>
              <Controller
                name="challenger.type"
                control={control}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 200 }}>
                    <MenuItem value={ArbiterAccount.ADDRESS}>
                      Wallet address
                    </MenuItem>
                    <MenuItem value={ArbiterAccount.ENS}>ENS Name</MenuItem>
                    <MenuItem value={ArbiterAccount.TWITTER}>
                      X / Twitter
                    </MenuItem>
                  </Select>
                )}
              />
              <Controller
                name="challenger.value"
                control={control}
                rules={{
                  required: "Required",
                  validate: (value, formValues) => {
                    const type = formValues.challenger.type;
                    if (type === ChallengerAccount.ADDRESS) {
                      return isAddress(value ?? "") || "Address not valid";
                    }

                    if (type === ChallengerAccount.TWITTER && value === "") {
                      return "X / Twitter handle not defined";
                    }

                    return true;
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    sx={{ flexGrow: 1 }}
                    {...field}
                    label={(() => {
                      const type = watch(`challenger.type`);

                      if (type === ChallengerAccount.ENS) {
                        return "ENS Name";
                      } else if (type === ChallengerAccount.TWITTER) {
                        return "X / Twitter handle";
                      } else {
                        return "Wallet address";
                      }
                    })()}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
          <Controller
            name="joinDeadline"
            control={control}
            rules={{
              required: "Required",
              min: {
                value: DateTime.now().toISO(),
                message: "Date must be in the future",
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="datetime-local"
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
                type="datetime-local"
                label="Judging start"
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="wager"
            control={control}
            rules={{ required: "Required" }}
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
                      <MenuItem value={ArbiterAccount.TWITTER}>
                        X / Twitter
                      </MenuItem>
                      <MenuItem value={ArbiterAccount.ADDRESS}>
                        Wallet address
                      </MenuItem>
                      <MenuItem value={ArbiterAccount.ENS}>ENS Name</MenuItem>
                    </Select>
                  )}
                />
                <Controller
                  name={`arbiters.${index}.value`}
                  control={control}
                  rules={{
                    required: "Required",
                    validate: (value, formValues) =>
                      formValues.arbiters[index]?.type ===
                      ArbiterAccount.ADDRESS
                        ? isAddress(value) || "Address not valid"
                        : true,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      sx={{ flexGrow: 1 }}
                      error={!!error}
                      helperText={error?.message}
                      label={(() => {
                        const type = watch(`arbiters.${index}.type`);

                        if (type === ArbiterAccount.ENS) {
                          return "ENS Name";
                        } else if (type === ArbiterAccount.TWITTER) {
                          return "X / Twitter handle";
                        } else {
                          return "Wallet address";
                        }
                      })()}
                    />
                  )}
                />
              </Stack>
            </Stack>
          ))}
          <Controller
            name="staking"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                sx={{ mt: 4 }}
                control={
                  <Checkbox checked={field.value} onChange={field.onChange} />
                }
                label={
                  <Stack>
                    <Typography variant="h6">Let the beef drip!</Typography>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography variant="subtitle2" color="grey">
                        {`Beef amount will be steaked (🤣)`}
                      </Typography>
                      <Tooltip
                        title={
                          <Typography>
                            Your and your challenger&apos;s ETH will be swapped
                            to Liquid Staking Derivative token wstETH for the
                            duration of the beef, earning ETH staking yield paid
                            out to the winner when the beef is served&nbsp;📈
                          </Typography>
                        }
                      >
                        <Typography>❓</Typography>
                      </Tooltip>
                    </Stack>
                  </Stack>
                }
              />
            )}
          />
          <Button
            disabled={isPending}
            onClick={addBeef}
            type="submit"
            sx={{ mt: 5, alignSelf: "center" }}
            variant="contained"
            color="secondary"
          >
            Start Beef
            {isPending && <CircularProgress size={20} sx={{ ml: 2 }} />}
          </Button>
        </Stack>
      </Paper>
    </Container>
  ) : (
    <NotLoggedIn />
  );
};

export default NewBeefPage;
