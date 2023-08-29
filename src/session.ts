import { Signal, createContext, useContext } from "solid-js";
import { z } from "zod";

export const UserSession = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string(),
});

export type UserSessionData = z.infer<typeof UserSession>;

export const SessionContext = createContext<Signal<UserSessionData>>();

export const useSession = () => {
  const value = useContext(SessionContext);

  if (value === undefined) {
    throw new Error("useSession must be used within a SessionContext.Provider");
  }

  return value;
};

export const useSessionData = () => {
  const [session] = useSession();

  if (!session().username) {
    throw new Error("useSession must be used within a SessionContext.Provider");
  }

  return () => session();
};
