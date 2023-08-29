import {
  Component,
  For,
  Ref,
  createEffect,
  createRenderEffect,
  onMount,
} from "solid-js";
import Swiper from "swiper";
import { EffectCards, EffectCoverflow, Pagination } from "swiper/modules";

export const Cards: Component<{
  ref?: Ref<Swiper>;
  data: Array<CaptionCard>;
}> = (props) => {
  onMount(() => {
    const swiper = new Swiper(".swiper", {
      observer: true,
      modules: [EffectCards],
      effect: "cards",
      grabCursor: true,
    });

    if (typeof props.ref === "function") {
      props.ref(swiper);
    }
  });

  return (
    <div class="swiper w-[240px] h-[320px]">
      <div class="swiper-wrapper">
        <For each={props.data}>
          {(card) => (
            <div class="swiper-slide flex justify-center font-bold rounded-2xl p-4 text-white caption-card text-lg">
              {card.caption}
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
