import { pixelArt } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { createSignal } from "solid-js";
import { useSocket } from "~/ws";
import toast from "solid-toast";
import { createRouteAction, useNavigate } from "solid-start";
import { UserSession, useSession } from "~/session";
import { ZodError } from "zod";

export default function Home() {
  const socket = useSocket();
  const navigate = useNavigate();

  const [, setUser] = useSession();

  const [seed, regenerate] = createSignal(crypto.randomUUID());

  const avatar = () => createAvatar(pixelArt, { seed: seed() }).toString();

  const [creating, createCharacter] = createRouteAction(
    async (formData: FormData) => {
      try {
        const data = await UserSession.parseAsync(Object.fromEntries(formData));

        setUser(data);
        navigate("/lobby/1");
      } catch (e) {
        console.error(e, formData);

        if (e instanceof ZodError) {
          toast.error("Invalid username");
        }
      }
    }
  );

  return (
    <main>
      <createCharacter.Form autocomplete="off">
        <div class="w-screen h-[100dvh] grid place-items-center mx-auto p-4">
          <div class="flex gap-2 items-center max-w-sm w-full">
            <svg
              onClick={() => regenerate(crypto.randomUUID())}
              aria-hidden="true"
              class="h-12 w-12"
              viewBox="0 0 40 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              innerHTML={avatar()}
            ></svg>

            <input type="hidden" name="id" value={socket().id} />

            <input type="hidden" name="avatar" value={avatar()} />

            <input
              type="text"
              name="username"
              autocomplete="off"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Enter a username"
              minLength={2}
              required
            />

            <button
              type="submit"
              disabled={creating.pending}
              class="inline-flex items-center py-2 px-3 text-lg font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Start
            </button>
          </div>
        </div>
      </createCharacter.Form>
    </main>
  );
}
