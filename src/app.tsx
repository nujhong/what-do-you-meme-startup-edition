import { ErrorBoundary, FileRoutes, Navigate, Routes } from "solid-start";
import { SocketContext, getSocket, useSocket } from "./ws";
import {
  createSignal,
  createEffect,
  ParentComponent,
  Switch,
  Match,
} from "solid-js";
import { SessionContext, UserSessionData } from "~/session";
import { Loader } from "~/components/loader";
import toast from "solid-toast";

const SessionProvider: ParentComponent = (props) => {
  const socket = useSocket();

  const session = createSignal<UserSessionData>({
    id: socket().id,
    username: "",
    avatar: "",
  });

  return (
    <SessionContext.Provider value={session}>
      {props.children}
    </SessionContext.Provider>
  );
};

const App = () => {
  const socket = getSocket();
  const [ws] = createSignal(socket);

  const [id, setId] = createSignal<string>();

  createEffect(() => {
    socket.connect();

    socket
      .on("connect", () => {
        setId(socket.id);
        toast.success("Connected");
      })
      .on("connect_error", (e) => {
        console.error(e);
      })
      .on("disconnect", () => {
        toast.error("Disconnected");
      });
  });

  return (
    <Switch
      fallback={
        <SocketContext.Provider value={ws}>
          <SessionProvider>
            <ErrorBoundary fallback={() => <Navigate href="/" />}>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </SessionProvider>
        </SocketContext.Provider>
      }
    >
      <Match when={id() === undefined}>
        <Loader />
      </Match>
    </Switch>
  );
};

export default App;
