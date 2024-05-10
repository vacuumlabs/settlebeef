import { createContext, useMemo, useState } from "react";

type SmartAccountClientContext = {
  client: any;
  setClient: any;
};

export const SmartAccountClientContext = createContext(
  {} as SmartAccountClientContext
);

type SmartAccountClientContextProviderProps = {
  children: React.ReactNode;
};

export const SmartAccountClientContextProvider = ({
  children,
}: SmartAccountClientContextProviderProps) => {
  const [client, setClient] = useState();

  const value = useMemo(() => ({ client, setClient }), [client]);

  return (
    <SmartAccountClientContext.Provider value={value}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};
