/* @refresh skip */

import { Socket as SocketIo, io } from "socket.io-client";
import { Accessor, createContext, useContext } from "solid-js";

export const getSocket: () => SocketIo<
  ServerToClientEvents,
  ClientToServerEvents
> = () => io("/", { autoConnect: false });

export const SocketContext =
  createContext<Accessor<ReturnType<typeof getSocket>>>();

export const useSocket = () => {
  const value = useContext(SocketContext);

  if (value === undefined) {
    throw new Error("useSocket must be used within a SocketContext.Provider");
  }

  return value;
};
