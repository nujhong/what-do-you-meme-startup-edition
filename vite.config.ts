import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/socket.io": {
        target: "ws://0.0.0.0:8080",
        ws: true,
      },
    },
  },
  plugins: [
    solid({
      experimental: {
        websocket: true,
      },
    }),
  ],
});
