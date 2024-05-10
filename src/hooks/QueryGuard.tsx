import { Skeleton, Typography } from "@mui/material";

type QueryGuardProps<T> = {
  isLoading: boolean;
  isPending: boolean;
  error: unknown;
  data: T;
  children: ((data: Exclude<T, undefined>) => JSX.Element | null) | JSX.Element;
};

const isDefined = <T,>(data: T): data is Exclude<T, undefined> => {
  return data !== undefined;
};

// TODO: Query Guard for multiple queries
export function QueryGuard<T>({
  isLoading,
  isPending,
  error,
  data,
  children,
}: QueryGuardProps<T>) {
  if (error) {
    return <Typography>Error!</Typography>;
  }
  if (isDefined(data)) {
    return typeof children === "function" ? children(data) : children;
  }
  return isLoading || isPending ? <Skeleton /> : null;
}
