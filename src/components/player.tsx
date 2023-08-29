import { Component, For, Match, Show, Switch } from "solid-js";

export const Item: Component<{ item: Player; index?: number }> = (props) => {
  const isLeader = () => props.item.trophies.length !== 0 && props.index === 0;

  return (
    <li>
      <div
        class="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 group dark:bg-gray-600 dark:text-white"
        classList={{
          "shadow bg-gray100 dark:bg-gray-500": isLeader(),
        }}
      >
        <svg
          aria-hidden="true"
          class="h-6 w-6"
          viewBox="0 0 40 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          innerHTML={props.item.avatar}
        ></svg>

        <span class="flex-1 ml-3 whitespace-nowrap">{props.item.username}</span>

        <Switch
          fallback={
            <span class="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
              ...
            </span>
          }
        >
          <Match when={props.item.status === "ready"}>
            <span class="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white rounded dark:text-white bg-green-400">
              Ready
            </span>
          </Match>

          <Match when={props.item.status === "in-game"}>
            <></>
          </Match>

          <Match when={props.item.status === "in-game:judge"}>
            <span class="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white rounded dark:text-white bg-green-400">
              Judge
            </span>
          </Match>
        </Switch>
      </div>

      <Show when={props.item.trophies.length !== 0}>
        <div class="mt-2 flex flex-wrap gap-1">
          <For each={props.item.trophies}>
            {(photo) => (
              <div>
                <img
                  class="w-[40px] h-[30px] object-cover rounded-lg"
                  src={photo.url}
                  alt={photo.name}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </li>
  );
};
