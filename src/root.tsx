// @refresh reload
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  Head,
  Html,
  Meta,
  Scripts,
  Title,
} from "solid-start";

import "swiper/css";
import "swiper/css/effect-cards";

import "./root.css";
import App from "./app";
import { Toaster } from "solid-toast";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Title>What Do You Meme?</Title>
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <App />
            <Toaster position="bottom-center" />
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
