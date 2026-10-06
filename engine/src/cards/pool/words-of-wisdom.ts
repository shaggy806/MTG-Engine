import { defineCard } from "../define.js";

// EDHREC rank 6654.
//
// "Each other player" is each opponent (Grave Pact's `"each-opponent"`): the
// engine has no teams, so every other player is an opponent. You draw first,
// then they do.
export default defineCard({
  name: "Words of Wisdom",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "You draw two cards, then each other player draws a card.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "draw", amount: 1, who: "each-opponent" },
    ],
  },
});
