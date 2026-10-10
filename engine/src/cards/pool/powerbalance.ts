import { defineCard } from "../define.js";

// EDHREC rank 2488. Revealing is the choice; the card is cast only if its
// mana value equals the opponent's spell's, and otherwise stays on top.
const TEXT =
  "Whenever an opponent casts a spell, you may reveal the top card of your library. If you do, you may cast that card without paying its mana cost if the two spells have the same mana value.";

export default defineCard({
  name: "Powerbalance",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Reveal the top card of your library?",
        effect: {
          kind: "cast-now",
          from: { libraryTop: 1, reveal: true },
          free: true,
          spell: { manaValue: { op: "eq", n: { amount: { manaValueOf: "trigger-object" } } } },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
