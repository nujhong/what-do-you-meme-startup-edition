export const Instructions = () => {
  return (
    <>
      <h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        What Do You Meme?{" "}
        <span class="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">
          Startup Edition
        </span>
      </h1>
      <p class="my-4 text-lg text-gray-500">BASIC RULES:</p>
      <div class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
        <ul class="list-disc space-y-2">
          <li>
            To start playing, each player draws 7 Caption Cards. Caption Cards
            are the cards with captions on them.
          </li>
          <li>A random person will be assigned as the judge.</li>
          <li>
            The judge then looks through the Photo Cards and selects the one
            they want to judge for that round. Everyone else takes a few moments
            to decide which of their 7 Caption Cards pair funniest with the
            Photo Card in play and passes it to the judge.
          </li>
          <li>
            Once the judge has received a Caption Card from each player, read
            them aloud one at a time.
          </li>
          <li>
            The judge then selects the funniest Caption Card and the player who
            played it wins that round. The winner keeps that Photo Card as a
            trophy.
          </li>
          <li>
            After the winner celebrates, everyone draws back up to 7 Caption
            Cards and a random players becomes the new judge for the next round.
          </li>
          <li>
            <img
              class="inline-block align-middle max-h-8"
              src="https://emojis.slackmojis.com/emojis/images/1657618872/60026/success.png"
            />
          </li>
        </ul>
      </div>
    </>
  );
};
