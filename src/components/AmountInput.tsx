import { SxProps, TextField, Theme } from "@mui/material";
import React, {
  ChangeEventHandler,
  forwardRef,
  useEffect,
  useState,
} from "react";
import { formatEther, parseEther } from "viem";

import { formatBigint, sliceStringDecimals } from "@/utils/general";

const DECIMALS = 6;

const formatValue = (value: bigint | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = formatEther(value);
  return sliceStringDecimals(stringValue, DECIMALS);
};

const parseValue = (value: string) => {
  try {
    return parseEther(value);
  } catch {
    return undefined;
  }
};

type AmountInputProps = {
  disabled?: boolean;
  maxValue?: bigint;
  minValue?: bigint;
  label?: string;
  errorMessage?: string;
  name?: string;
  setError: (error: string | undefined) => void;
  setValue: (value: bigint | null) => void;
  sx?: SxProps<Theme>;
  value: bigint | null | undefined;
};

const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  (
    {
      disabled,
      errorMessage,
      setError,
      value,
      setValue,
      maxValue,
      minValue = BigInt(0),
      name,
      sx,
      label,
    },
    ref,
  ) => {
    const [stringValue, setStringValue] = useState(formatValue(value));

    useEffect(() => {
      setStringValue(formatValue(value));
    }, [value]);

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      setError(undefined);

      const newValue = event.target.value.replace(",", ".");
      const normalizedValue = sliceStringDecimals(newValue, DECIMALS);

      setStringValue(normalizedValue);

      if (normalizedValue === "") {
        setValue(null);
        return;
      }

      if (Number.isNaN(Number(normalizedValue))) {
        setError("Value is not a number.");
        return;
      }
      const parsedValue = parseValue(normalizedValue);

      if (parsedValue === undefined) {
        setError("Invalid price");
        return;
      }
      if (parsedValue <= minValue) {
        setError(`Amount must be greater than ${formatBigint(minValue, 4)}`);
        return;
      }
      if (maxValue !== undefined && parsedValue > maxValue) {
        setError(`Amount must be at most ${formatBigint(maxValue, 4)}`);
        return;
      }

      setValue(parsedValue);
    };

    const handleInputFocus = () => {
      if (stringValue === "0") {
        setStringValue("");
      }
    };

    const handleInputBlur = () => {
      if (stringValue === "") {
        setStringValue("0");
        return;
      }

      const numberValue = Number(stringValue);
      if (Number.isNaN(numberValue)) {
        return;
      }

      // Removes trailing / leading zeros
      setStringValue(numberValue.toString());
    };

    return (
      <TextField
        ref={ref}
        label={label}
        disabled={disabled}
        autoComplete="off"
        type="text"
        value={stringValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        error={!!errorMessage}
        helperText={errorMessage}
        name={name}
        sx={sx}
      />
    );
  },
);

AmountInput.displayName = "AmountInput";

export default AmountInput;
