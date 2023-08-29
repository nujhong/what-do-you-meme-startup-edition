import {
  Component,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
} from "solid-js";
import { Cards } from "./cards";
import { useSocket } from "~/ws";
import Swiper from "swiper";
import { EffectCards } from "swiper/modules";
import { Loader } from "./loader";
import toast from "solid-toast";

export const Game: Component = () => {
  const socket = useSocket();
  const [player, setPlayer] = createSignal<Player>();

  createEffect(() => {
    socket().on("player:updated", (p) => {
      setPlayer(p);
    });
  });

  return (
    <Show when={player() !== undefined} fallback={<Loader />}>
      <Switch>
        <Match when={player()?.status === "in-game"}>
          <Normal player={player()!} />
        </Match>

        <Match when={player()?.status === "in-game:judge"}>
          <Judge player={player()!} />
        </Match>
      </Switch>
    </Show>
  );
};

const Judge: Component<{ player: Player }> = (props) => {
  const socket = useSocket();

  const [round, setRound] = createSignal<Round>();

  const cards = createMemo(() => props.player.hand);

  createEffect(() => {
    socket().on("round:updated", (r) => {
      setRound(r);
    });
  });

  return (
    <Switch fallback={<Loader />}>
      <Match when={round()?.phase === "select-photo"}>
        <SelectPhoto player={props.player} round={round()!} />
      </Match>

      <Match when={round()?.phase === "select-caption"}>
        <SelectCaption player={props.player} round={round()!} />
      </Match>

      <Match when={round()?.phase === "end"}>
        <div class="flex flex-col gap-12">
          <Cards data={cards()} />
          <p class="text-center">Next round will be starting shortly...</p>
        </div>
      </Match>
    </Switch>
  );
};

const Normal: Component<{ player: Player }> = (props) => {
  let swiper: Swiper;

  const socket = useSocket();

  const [round, setRound] = createSignal<Round>();

  const cards = createMemo(() => props.player.hand);

  const submission = () =>
    round()?.submissions.find(
      (submission) => submission[0].id === props.player.id
    )?.[1];

  createEffect(() => {
    socket().on("round:updated", (r) => {
      setRound(r);
    });
  });

  const handleSubmit = async () => {
    const card = props.player.hand.find(
      (_, index) => index === swiper.activeIndex
    );

    if (card) {
      await socket().emitWithAck("game:submit-caption", card);
    }
  };

  return (
    <div class="flex flex-col gap-12">
      <Cards data={cards()} ref={swiper!} />

      <Switch
        fallback={
          <div class="relative">
            <Loader />
          </div>
        }
      >
        <Match when={round()?.phase === "select-photo"}>
          <p class="text-center">
            Waiting for the judge to select a Photo Card...
          </p>
        </Match>

        <Match when={round()?.phase === "select-caption"}>
          <Show
            when={submission()}
            fallback={
              <>
                <p class="text-center">
                  Swipe to decide which of the 7 Caption Cards pairs funnisest
                  with the Photo Card.
                </p>

                <button
                  onClick={handleSubmit}
                  type="button"
                  class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  YES
                </button>
              </>
            }
          >
            <>
              <blockquote class="text-center text-xl italic font-semibold text-gray-900 dark:text-white">
                "{submission()?.caption}"
              </blockquote>

              <p class="text-center">
                Waiting for the judge to pick a winner...
              </p>
            </>
          </Show>
        </Match>

        <Match when={round()?.phase === "end"}>
          <p class="text-center">Next round will be starting shortly...</p>
        </Match>
      </Switch>
    </div>
  );
};

const SelectPhoto: Component<{ player: Player; round: Round }> = (props) => {
  let swiper: Swiper;

  onMount(() => {
    swiper = new Swiper(".swiper", {
      modules: [EffectCards],
      effect: "cards",
      grabCursor: true,
      observer: true,
      centeredSlides: true,
      cardsEffect: {
        perSlideRotate: 8,
        perSlideOffset: 20,
        slideShadows: false,
      },
    });
  });

  createEffect(async () => {
    const photos = await socket().emitWithAck("game:view-photo-cards");
    setPhotos(photos);
  });

  const socket = useSocket(),
    [photos, setPhotos] = createSignal<PhotoCard[]>([]);

  const handleStart = async () => {
    const photo = photos().find((_, index) => index === swiper.activeIndex);

    if (!photo) {
      toast.error("Something went wrong");
      return;
    }

    await socket().emitWithAck("game:select-photo", photo);
  };

  const handleStartRandom = async () => {
    await socket().emitWithAck("game:select-random-photo", null);
  };

  return (
    <div class="flex flex-col gap-12">
      <div class="swiper w-[320px] h-[240px]">
        <div class="swiper-wrapper">
          <For each={photos()}>
            {(card) => (
              <div class="swiper-slide photo-card flex justify-center rounded-2xl bg-white border border-gray-200 shadow">
                <img class="object-cover" src={card.url} />
              </div>
            )}
          </For>
        </div>
      </div>

      <p class="text-center">
        Swipe through the Photo Cards and select the one you want judge for this
        round.
      </p>

      <div class="flex flex-col gap-2">
        <button
          onClick={handleStart}
          type="button"
          class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-full"
        >
          YES
        </button>

        <button
          onClick={handleStartRandom}
          type="button"
          class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-full"
        >
          Random
        </button>
      </div>
    </div>
  );
};

const SelectCaption: Component<{ player: Player; round: Round }> = (props) => {
  let swiper: Swiper;

  const socket = useSocket();

  const cards = createMemo(() =>
    props.round.submissions.map((submission) => submission[1])
  );

  const handleSubmit = async () => {
    const card = props.round.submissions.find(
      (_, index) => index === swiper.activeIndex
    )?.[1];

    if (card) {
      await socket().emitWithAck("game:select-caption", card);
    }
  };

  return (
    <div class="flex flex-col gap-12">
      <Show
        when={cards().length !== 0}
        fallback={
          <div
            role="status"
            class="max-w-sm animate-pulse flex items-center justify-center"
          >
            <div class="w-[240px] h-[320px] bg-gray-200 rounded-2xl dark:bg-gray-700"></div>
            <span class="sr-only">Loading...</span>
          </div>
        }
      >
        <Cards data={cards()} ref={swiper!} />
      </Show>

      <Show
        when={cards().length === props.round.submissionsRequired}
        fallback={
          <p class="text-center">
            Waiting for ({props.round.submissions.length}/
            {props.round.submissionsRequired}) players to submit their Caption
            Cards...
          </p>
        }
      >
        <>
          <p class="text-center">
            Read them aloud one at a time. Select the funniest Caption Card.
          </p>

          <button
            onClick={handleSubmit}
            type="button"
            class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2 w-full"
          >
            YES
          </button>
        </>
      </Show>
    </div>
  );
};
