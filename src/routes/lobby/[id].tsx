import {
  For,
  Match,
  Switch,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { useSocket } from "~/ws";
import { Item } from "~/components/player";
import { useSessionData } from "~/session";
import { Game } from "~/components/game";
import { useNavigate } from "solid-start";

export default function Lobby() {
  const navigate = useNavigate();
  const socket = useSocket();
  const user = useSessionData();

  const [status, setStatus] = createSignal<LobbyStatus>("waiting");
  const [players, setPlayers] = createSignal<Player[]>([]);

  const isReady = () =>
    players().find(({ id }) => id === user()?.id)?.status === "ready";

  createEffect(() => {
    socket()
      .on("lobby:updated", (lobby) => {
        setPlayers(lobby.players);
      })
      .on("game:started", () => {
        setStatus("started");
      })
      .on("disconnect", () => {
        navigate("/");
      });

    onCleanup(() => {
      socket().emit("lobby:leave");
    });
  });

  onMount(async () => {
    await socket().emitWithAck("lobby:join", user());
  });

  const handleReady = () => {
    socket().emit("lobby:ready");
  };

  return (
    <main class="w-screen h-[100dvh] grid place-items-center mx-auto max-w-lg sm:max-w-sm overflow-hidden p-4">
      <Switch>
        <Match when={status() === "waiting"}>
          <div class="w-full p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h5 class="mb-3 text-base font-semibold text-gray-900 md:text-xl dark:text-white">
              What Do You Meme? (Startup Edition)
            </h5>
            <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
              What do you mean? Oh, oh
            </p>
            <ul class="my-4 space-y-3 max-h-80 overflow-y-auto">
              <For each={players()}>{(player) => <Item item={player} />}</For>
            </ul>

            <Switch>
              <Match when={!isReady()}>
                <button
                  onClick={handleReady}
                  type="button"
                  class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-full"
                >
                  Ready
                </button>
              </Match>
              <Match when={players().length < 3}>
                <div class="text-center text-sm">
                  Waiting for more players to join...
                </div>
              </Match>

              <Match
                when={players().some((player) => player.status !== "ready")}
              >
                <div class="text-center text-sm">
                  Waiting for all players to ready...
                </div>
              </Match>
            </Switch>
          </div>
        </Match>

        <Match when={status() === "started"}>
          <Game />
        </Match>
      </Switch>
    </main>
  );
}
