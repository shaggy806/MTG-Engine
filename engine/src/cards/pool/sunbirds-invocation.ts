import { defineCard } from "../define.js";

// EDHREC rank 1911. X is the triggering spell's mana value (an {X} counted
// as chosen, rule 202.3e); the cards are revealed, so everyone sees them.
// What isn't cast goes to the bottom in a random order.
const TEXT =
  "Whenever you cast a spell from your hand, reveal the top X cards of your library, where X is that spell's mana value. You may cast a spell with mana value X or less from among cards revealed this way without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Sunbird's Invocation",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", from: "hand" },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: { manaValueOf: "trigger-object" }, reveal: true },
        free: true,
        spell: { manaValue: { op: "lte", n: { amount: { manaValueOf: "trigger-object" } } } },
        rest: "bottom-random",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
