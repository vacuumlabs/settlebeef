"use client";

import { getFarcasterUserAddress } from "@coinbase/onchainkit/farcaster";
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
import { generateAddressForHandle } from "@/server/actions/generateAddressForHandle";
import { ArbiterAccount, ChallengerAccount } from "@/types";
import { isValidEmail } from "@/utils/validations";

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

  // TODO: Perform all validations before aborting the submit
  const addBeef = handleSubmit(async (values) => {
    const indexedArbiters = values.arbiters.map(
      (arbiter, index) => [arbiter, index] as const,
    );

    const arbitersGrouped = Object.groupBy(indexedArbiters, ([arbiter]) =>
      JSON.stringify(arbiter),
    );

    if (JSON.stringify(values.challenger) in arbitersGrouped) {
      setError("challenger.value", {
        message: "Challenger should not also be an arbiter!",
      });

      return;
    }
    const arbiterGroups = Object.values(arbitersGrouped);

    arbiterGroups.forEach((arbiters) => {
      if (arbiters !== undefined && arbiters.length > 1) {
        arbiters.forEach(([, index]) =>
          setError(`arbiters.${index}.value`, { message: "Duplicate arbiter" }),
        );
      }
    });

    if (arbiterGroups.length !== values.arbiters.length) return;

    // Validate submitted arbiter ens names
    const submittedEnsNames = values.arbiters.map(async (arbiter) => {
      if (arbiter.type === ArbiterAccount.ENS) {
        return getEnsAddress(ensConfig, { name: normalize(arbiter.value) });
      } else if (arbiter.type === ArbiterAccount.FARCASTER) {
        const response = await getFarcasterUserAddress(Number(arbiter.value), {
          hasVerifiedAddresses: false,
        });
        // Coalesce to null to keep the falsey type unified
        return response?.custodyAddress ?? null;
      } else {
        return Promise.resolve(null);
      }
    });

    const validatedEnsNames = await Promise.all(submittedEnsNames);

    validatedEnsNames.forEach((resolvedEnsName, index) => {
      if (resolvedEnsName === null) {
        const type = values.arbiters[index]?.type;

        if (type === ArbiterAccount.ENS) {
          setError(`arbiters.${index}.value`, {
            message: "ENS name not found",
          });
        } else if (type === ArbiterAccount.FARCASTER) {
          setError(`arbiters.${index}.value`, {
            message: "Farcaster ID not found",
          });
        }
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

      const resolvedAddress = await generateAddressForHandle(normalizedValue);

      values.challenger = {
        type: ChallengerAccount.ADDRESS,
        value: resolvedAddress,
      };
    }

    // If any ens name / farcaster id is invalid, return
    if (
      validatedEnsNames.some(
        (ensName, index) =>
          ensName === null &&
          (values.arbiters[index]!.type === ArbiterAccount.ENS ||
            values.arbiters[index]!.type === ArbiterAccount.FARCASTER),
      )
    ) {
      return;
    }

    values.arbiters = values.arbiters.map((arbiter, index) => {
      const resolvedAddress = validatedEnsNames[index] ?? null;

      if (arbiter.type === ArbiterAccount.ENS && resolvedAddress !== null) {
        return { type: ArbiterAccount.ADDRESS, value: resolvedAddress };
      }
      return arbiter;
    });

    if ((values.wager ?? 0n) > (balance ?? 0n)) {
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
                    <MenuItem value={ChallengerAccount.ADDRESS}>
                      Wallet address
                    </MenuItem>
                    <MenuItem value={ChallengerAccount.ENS}>ENS Name</MenuItem>
                    <MenuItem value={ChallengerAccount.TWITTER}>
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
          <Stack gap={1}>
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
            <Stack direction="row" gap={1} alignItems="center">
              <Typography variant="subtitle2" color="grey">
                A 0.5% fee will be taken from this amount for each arbiter and
                the protocol.
              </Typography>
              <Tooltip
                title={
                  <Typography>
                    Settlebeef takes a 1% fee from the total amount of settled
                    beef. <br />
                    Each correctly voting arbiter gets a 1% fee from the total
                    amount of the settled beef. <br />
                    In total, 4% of the total amount will go towards fees, 2%
                    from your deposit, 2% from the challenger&apos;s.
                  </Typography>
                }
              >
                <Typography>❓</Typography>
              </Tooltip>
            </Stack>
          </Stack>
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
                      <MenuItem value={ArbiterAccount.EMAIL}>Email</MenuItem>
                      <MenuItem value={ArbiterAccount.ADDRESS}>
                        Wallet address
                      </MenuItem>
                      <MenuItem value={ArbiterAccount.ENS}>ENS Name</MenuItem>
                      <MenuItem value={ArbiterAccount.FARCASTER}>
                        Farcaster ID
                      </MenuItem>
                    </Select>
                  )}
                />
                <Controller
                  name={`arbiters.${index}.value`}
                  control={control}
                  rules={{
                    required: "Required",
                    validate: (value, formValues) => {
                      const type = formValues.arbiters[index]?.type;

                      if (type === ArbiterAccount.ADDRESS) {
                        return isAddress(value) || "Address not valid";
                      } else if (type === ArbiterAccount.EMAIL) {
                        return isValidEmail(value) || "Email not valid";
                      } else if (type === ArbiterAccount.FARCASTER) {
                        return (
                          !Number.isNaN(Number(value)) ||
                          "Farcaster ID must be a number"
                        );
                      }

                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      sx={{ flexGrow: 1 }}
                      error={!!error}
                      helperText={error?.message}
                      label={(() => {
                        const type = watch(`arbiters.${index}.type`);

                        switch (type) {
                          case ArbiterAccount.ENS:
                            return "ENS Name";
                          case ArbiterAccount.TWITTER:
                            return "X / Twitter handle";
                          case ArbiterAccount.EMAIL:
                            return "Email address";
                          case ArbiterAccount.ADDRESS:
                            return "Wallet address";
                          case ArbiterAccount.FARCASTER:
                            return "Farcaster ID";
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
