import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// EDHREC rank 5846.
//
// Rulings:
//   [2024-01-12] You may pay {W/B} a maximum of one time for each extort triggered ability. You
//     decide whether to pay when the ability resolves.
//   [2024-01-12] The extort ability resolves before the spell that caused it to trigger. The
//     ability resolves even if that spell is countered.
//   [2024-01-12] The extort ability doesn't target any player.
//   [2024-01-12] The amount of life you gain from extort is based on the total amount of life
//     lost, not necessarily the number of opponents you have.
//
// Extort is the `extort()` helper (Sorin of House Markov).

const DIES_TEXT = "Whenever a nontoken creature dies, you lose 1 life and create a Treasure token.";

export default defineCard({
  name: "Life Insurance",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  types: ["enchantment"],
  text: `Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)\n${DIES_TEXT}`,
  triggered: [
    extort(),
    {
      trigger: { on: "dies", who: "any", filter: { token: false, type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "you" },
          { kind: "create-token", token: "Treasure Token", count: 1 },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
