import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { Instructions } from "~/components/instructions";
import { Item } from "~/components/player";
import { useSocket } from "~/ws";

export default function Ob() {
  const socket = useSocket();

  const [lobby, setLobby] = createSignal<Lobby>(),
    [round, setRound] = createSignal<Round>(),
    [players, setPlayers] = createSignal<Player[]>([]);

  const leaderboard = createMemo(() =>
    players()
      .slice()
      .sort((a, b) => b.trophies.length - a.trophies.length)
  );

  createEffect(() => {
    socket()
      .on("lobby:updated", (lobby) => {
        setLobby(lobby);
        setPlayers(lobby.players);
      })
      .on("round:updated", (round) => {
        setRound(round);
        setPlayers(round.players);
      });
  });

  return (
    <div class="w-screen h-screen text-gray-900 dark:text-white">
      <div class="w-full h-full flex flex-col sm:flex-row flex-grow overflow-hidden divide-x-2">
        <div class="sm:w-1/3 md:1/4 w-full flex-shrink flex-grow-0 p-4">
          <div class="sticky top-0 p-4 w-full">
            <Show when={lobby()}>
              <div class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700 mb-8">
                <h5 class="mb-3 text-base font-semibold text-gray-900 md:text-xl dark:text-white">
                  Stats
                </h5>
                <ul class="max-w-md space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                  <p class="text-xs">Round {lobby()?.round || "-"}</p>
                  <p class="text-xs">
                    Caption Cards x{lobby()?.captions.length}
                  </p>
                  <p class="text-xs">Photo Cards x{lobby()?.photos.length}</p>
                </ul>
              </div>
            </Show>

            <div class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <Show
                when={players().length !== 0}
                fallback={
                  <div
                    role="status"
                    class="max-w-sm animate-pulse flex flex-col gap-4"
                  >
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <div class="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                    <span class="sr-only">Loading...</span>
                  </div>
                }
              >
                <h5 class="mb-3 text-base font-semibold text-gray-900 md:text-xl dark:text-white">
                  Leaderboards
                </h5>
                <ul class="my-4 space-y-3 overflow-y-auto">
                  <For each={leaderboard()}>
                    {(item, index) => <Item item={item} index={index()} />}
                  </For>
                </ul>
              </Show>
            </div>
          </div>
        </div>

        <main
          role="main"
          class="w-full h-full flex-grow p-10 overflow-auto relative"
        >
          <Switch fallback={<Instructions />}>
            <Match when={round()?.phase === "select-photo"}>
              <div class="w-full h-full grid place-content-center">
                <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl text-center">
                  <span class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                    {round()?.judge?.username}
                  </span>{" "}
                  is the judge.
                </h1>

                <p class="text-center mt-12">
                  Waiting for the judge to select a Photo Card...
                </p>
              </div>
            </Match>

            <Match when={round()?.phase === "select-caption"}>
              <div class="w-full h-full grid place-content-center">
                <img
                  class="h-auto max-w-lg rounded-lg"
                  src={round()?.photo?.url}
                  alt={round()?.photo?.name}
                />

                <Show
                  when={
                    round()!.submissions.length >= round()!.submissionsRequired
                  }
                  fallback={
                    <p class="text-center mt-12">
                      Waiting for ({round()!.submissions.length}/
                      {round()!.submissionsRequired}) players to submit their
                      Caption Cards...
                    </p>
                  }
                >
                  <p class="text-center mt-12">
                    Waiting for the judge to read out the Caption Cards and
                    submit a winner...
                  </p>
                </Show>
              </div>
            </Match>

            <Match when={round()?.phase === "end"}>
              <div class="w-full h-full grid place-content-center">
                <div class="flex flex-col gap-12">
                  <figure class="relative max-w-lg h-auto mx-auto">
                    <img
                      class="w-full rounded-lg"
                      src={round()?.photo?.url}
                      alt={round()?.photo?.name}
                    />

                    <figcaption class="absolute px-4 py-4 text-3xl text-white bottom-0 bg-gray-900 bg-opacity-20 font-extrabold">
                      <p>{round()?.winner?.[1].caption}</p>
                    </figcaption>
                  </figure>

                  <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl text-center">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                      {round()?.winner?.[0].username}
                    </span>{" "}
                    wins this round.
                  </h1>

                  <p class="text-center">
                    Next round will be starting shortly...
                  </p>
                </div>
              </div>
            </Match>
          </Switch>
        </main>
      </div>
    </div>
  );
}
